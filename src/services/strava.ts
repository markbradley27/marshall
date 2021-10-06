// TODO: Gracefully handle duplicate activities.

import crypto from "crypto";
import express from "express";
import { oneOf, query } from "express-validator";
import geojsonPolyline from "geojson-polyline";
import got from "got";
import { Logger } from "tslog";

import { verifyIdToken } from "../middleware/auth";
import { checkValidation } from "../middleware/validation";
import { Activity, ActivitySource, User } from "../model";

const logger: Logger = new Logger();

const ACTIVITIES_URL = "https://www.strava.com/api/v3/activities";
const AUTH_URL = "https://www.strava.com/oauth/authorize";
const SUBSCRIPTION_URL = "https://www.strava.com/api/v3/push_subscriptions";
const TOKEN_URL = "https://www.strava.com/oauth/token";

interface StravaAthlete {
  id: number;
}

interface StravaAccessToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: StravaAthlete;
}

interface StravaActivityMap {
  polyline?: string;
  summary_polyline?: string;
}

interface StravaActivity {
  id: number;
  name: string;
  athlete: StravaAthlete;
  start_date: string;
  map: StravaActivityMap;
}

interface SubscriptionCreationResponse {
  id: number;
}

interface SubscriptionEvent {
  object_type: string;
  object_id: number;
  aspect_type: string;
  updates: string;
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

class StravaService {
  router: express.Router;

  #clientId: number;
  #clientSecret: string;
  #subscriptionVerifyToken = "";
  // This will be undefined if the service is not currently subscribed.
  #subscriptionId: number;

  constructor(clientId: number, clientSecret: string) {
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;

    this.router = express.Router();
    this.router.get("/authorize", verifyIdToken, this.getAuthorize.bind(this));
    this.router.get(
      "/authorize_callback",
      query("error").not().exists(),
      query("code").isString(),
      oneOf([
        query("scope").contains("activity:read"),
        query("scope").contains("activity:read_all"),
      ]),
      query("state").isString(),
      checkValidation,
      this.getAuthorizeCallback.bind(this)
    );
    this.router.post(
      "/activity",
      query("activity_id").optional().isInt(),
      checkValidation,
      verifyIdToken,
      this.postActivity.bind(this)
    );
    this.router.delete(
      "/activity",
      query("activity_id").optional().isInt(),
      checkValidation,
      verifyIdToken,
      this.deleteActivity.bind(this)
    );
    this.router.get(
      "/subscription_callback",
      query("hub.mode").equals("subscribe"),
      query("hub.challenge").isString(),
      query("hub.verify_token").isString(),
      checkValidation,
      this.getSubscriptionCallback.bind(this)
    );
    this.router.post(
      "/subscription_callback",
      this.postSubscriptionCallback.bind(this)
    );
  }

  async swapAuthCodeForTokens(authCode: string, uid: string) {
    logger.info(`Getting tokens via auth code; uid: ${uid}`);
    const tokenUrl = new URL(TOKEN_URL);
    tokenUrl.searchParams.append("client_id", this.#clientId.toString());
    tokenUrl.searchParams.append("client_secret", this.#clientSecret);
    tokenUrl.searchParams.append("grant_type", "authorization_code");
    tokenUrl.searchParams.append("code", authCode);

    const tokenRes = await got.post(tokenUrl, {
      responseType: "json",
    });
    const token = tokenRes.body as StravaAccessToken;

    await User.update(
      {
        stravaAccessToken: token.access_token,
        stravaRefreshToken: token.refresh_token,
        stravaAccessTokenExpiresAt: new Date(token.expires_at * 1000),
        stravaAthleteId: token.athlete.id,
      },
      { where: { id: uid } }
    );
    logger.info(`Saved tokens; uid: ${uid}; athlete id: ${token.athlete.id}`);
  }

  async swapRefreshTokenForTokens(user: User) {
    logger.info(`Getting tokens via refresh code; uid: ${user.id}`);
    const tokenUrl = new URL(TOKEN_URL);
    tokenUrl.searchParams.append("client_id", this.#clientId.toString());
    tokenUrl.searchParams.append("client_secret", this.#clientSecret);
    tokenUrl.searchParams.append("grant_type", "refresh_token");
    tokenUrl.searchParams.append("refresh_token", user.stravaRefreshToken);

    const tokenRes = await got.post(tokenUrl, {
      responseType: "json",
    });
    const token = tokenRes.body as StravaAccessToken;

    user.stravaAccessToken = token.access_token;
    user.stravaRefreshToken = token.refresh_token;
    user.stravaAccessTokenExpiresAt = new Date(token.expires_at * 1000);
    await user.save();
    logger.info(`Saved tokens; uid: ${user.id}`);
  }

  async queryStravaApi(url: URL, user: User) {
    const expireCutoff = new Date();
    expireCutoff.setMinutes(expireCutoff.getMinutes() + 30);
    if (user.stravaAccessTokenExpiresAt < expireCutoff) {
      await this.swapRefreshTokenForTokens(user);
    }

    return await got(url, {
      headers: { Authorization: "Bearer " + user.stravaAccessToken },
      responseType: "json",
    });
  }

  async loadActivity(activity: StravaActivity, user: User) {
    if (!activity.map.polyline && !activity.map.summary_polyline) {
      logger.info(
        `Not saving activity without map; id: ${activity.id}; name: ${activity.name}; athlete id: ${activity.athlete.id}`
      );
      return;
    }

    logger.info(`Saving activity; id: ${activity.id}; name: ${activity.name}`);
    const pathJson = geojsonPolyline.decode({
      type: "LineString",
      coordinates: activity.map.polyline || activity.map.summary_polyline,
    });

    await user.createActivity({
      source: ActivitySource.strava,
      sourceId: activity.id,
      name: activity.name,
      date: activity.start_date,
      path: pathJson,
    });
  }

  async loadActivityById(activityId: number, user: User) {
    const getActivityUrl = new URL(ACTIVITIES_URL + "/" + activityId);
    const getActivityRes = await this.queryStravaApi(getActivityUrl, user);
    const activity = getActivityRes.body as StravaActivity;
    await this.loadActivity(activity, user);
  }

  // Subscribes to strava webhook.
  async subscribe() {
    if (this.#subscriptionId) {
      throw new Error("strava service already subscribed");
    }
    logger.info("Strava service establishing subscription.");

    this.#subscriptionVerifyToken = crypto.randomBytes(32).toString();

    const subscribeUrl = new URL(SUBSCRIPTION_URL);
    subscribeUrl.searchParams.append("client_id", this.#clientId.toString());
    subscribeUrl.searchParams.append(
      "client_secret",
      this.#clientSecret.toString()
    );
    subscribeUrl.searchParams.append(
      "callback_url",
      `http://${process.env.HOST}:${process.env.PORT}/api/strava/subscription_callback`
    );
    subscribeUrl.searchParams.append(
      "verify_token",
      this.#subscriptionVerifyToken
    );

    try {
      const subscribeRes = await got.post(subscribeUrl, {
        responseType: "json",
      });
      const subscribeResObj = subscribeRes.body as SubscriptionCreationResponse;
      this.#subscriptionId = subscribeResObj.id;
      logger.info(`Subscribed to strava webhook; id: ${this.#subscriptionId}`);
    } catch (error) {
      logger.error(`subscribe post error: ${error}`);
    }
  }

  getAuthorize(req: express.Request, res: express.Response) {
    const authUrl = new URL(AUTH_URL);
    authUrl.searchParams.append("client_id", this.#clientId.toString());
    authUrl.searchParams.append(
      "redirect_uri",
      `http://${process.env.HOST}:${process.env.PORT}/api/strava/authorize_callback`
    );
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "activity:read,activity:read_all");
    authUrl.searchParams.append("state", req.uid as string);
    res.redirect(authUrl.toString());
  }

  getAuthorizeCallback(req: express.Request, res: express.Response) {
    const authCode = req.query.code as string;
    const uid = req.query.state as string;

    try {
      this.swapAuthCodeForTokens(authCode, uid);
    } catch (error) {
      logger.error("getAccessTokenFromAuthCode:", error);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  }

  async postActivity(req: express.Request, res: express.Response) {
    logger.info(
      `Got load activities request; uid: ${req.uid}; activity_id: ${req.query.activity_id}`
    );
    const user = await User.findOne({ where: { id: req.uid } });

    if (req.query.activity_id) {
      const activityId = parseInt(req.query.activity_id as string, 10);
      try {
        await this.loadActivityById(activityId, user);
      } catch (error) {
        res.status(400).send(error.toString());
        return;
      }
      res.sendStatus(200);
      return;
    }

    const listActivitiesUrl = new URL(ACTIVITIES_URL);
    for (let page = 1; ; page++) {
      listActivitiesUrl.searchParams.append("page", page.toString());

      let activities: StravaActivity[];
      try {
        const listActivitiesRes = await this.queryStravaApi(
          listActivitiesUrl,
          user
        );
        activities = listActivitiesRes.body as StravaActivity[];
      } catch (error) {
        res.status(400).send(error.toString());
        return;
      }

      if (activities.length === 0) {
        break;
      }

      for (const activity of activities) {
        try {
          await this.loadActivity(activity, user);
        } catch (error) {
          // TODO: I really hope there's a better way to do this...
          if (error.toString().includes("SequelizeUniqueConstraintError")) {
            logger.info(
              `Skipping already loaded activity; id: ${activity.id}; name: ${activity.name}`
            );
            continue;
          }
          res.status(400).send(error.toString());
          return;
        }
      }
    }

    res.sendStatus(200);
  }

  async deleteActivity(req: express.Request, res: express.Response) {
    logger.info(
      `Got delete activities request; uid: ${req.uid}; activity_id: ${req.query.activity_id}`
    );

    try {
      if (req.query.activity_id) {
        const activity = await Activity.findOne({
          where: {
            source: ActivitySource.strava,
            sourceId: req.query.activity_id.toString(),
          },
          // TODO: Probably don't need the whole user here, just the UserId we
          // already get for free.
          include: User,
        });
        if (!activity) {
          res.sendStatus(404);
          return;
        }
        if (activity.User.id !== req.uid) {
          res.sendStatus(403);
          return;
        }
        await activity.destroy();
      }
    } catch (error) {
      res.status(500).send(error.toString);
      return;
    }

    res.sendStatus(200);
  }

  async getSubscriptionCallback(req: express.Request, res: express.Response) {
    logger.info("Got subscription callback probe.");
    if (req.query["hub.verify_token"] !== this.#subscriptionVerifyToken) {
      res.status(400).send("verify token missmatch");
      return;
    }

    res.status(200);
    res.json({
      "hub.challenge": req.query["hub.challenge"],
    });
  }

  // TODO: Think about validation.
  async postSubscriptionCallback(req: express.Request, res: express.Response) {
    const event = req.body as SubscriptionEvent;
    logger.info(
      `Got subscription callback post; type: ${event.object_type}; aspect_type: ${event.aspect_type}; object_id: ${event.object_id}`
    );

    if (event.object_type !== "activity") {
      // Nothing to do.
      res.sendStatus(200);
      return;
    }

    try {
      if (event.aspect_type === "create") {
        const user = await User.findOne({
          where: { stravaAthleteId: event.owner_id },
        });
        await this.loadActivityById(event.object_id, user);
      } else if (event.aspect_type === "update") {
        // TODO: Support updates.
        logger.warn("Dropping update event on the floor!");
      } else if (event.aspect_type === "delete") {
        logger.info(`Deleting activity; id: ${event.object_id}`);
        Activity.destroy({
          where: {
            source: ActivitySource.strava,
            sourceId: event.object_id.toString(),
          },
        });
      }
    } catch (error) {
      logger.error(`Subscription callback post error: ${error}`);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  }
}

export default StravaService;
