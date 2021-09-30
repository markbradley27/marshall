// TODO: Gracefully handle duplicate activities.

import { User } from "../model";
import { verifyIdToken } from "../middleware/auth";
import { checkValidation } from "../middleware/validation";

import crypto from "crypto";
import express from "express";
import { oneOf, query } from "express-validator";
import geojsonPolyline from "geojson-polyline";
import got from "got";

import { Logger } from "tslog";

const logger: Logger = new Logger();

const ACTIVITIES_URL = "https://www.strava.com/api/v3/activities";
const AUTH_URL = "https://www.strava.com/oauth/authorize";
const SUBSCRIPTION_URL = "https://www.strava.com/api/v3/push_subscriptions";
const TOKEN_URL = "https://www.strava.com/oauth/token";

interface AthleteInfo {
  id: number;
}

interface AccessToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: AthleteInfo;
}

interface ActivityMap {
  polyline?: string;
  summary_polyline?: string;
}

interface Activity {
  id: number;
  name: string;
  start_date: string;
  map: ActivityMap;
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
    this.router.get(
      "/load_activities",
      query("activity_id").optional().isInt(),
      checkValidation,
      verifyIdToken,
      this.getLoadActivities.bind(this)
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

  async getAccessTokenFromAuthCode(authCode: string, uid: string) {
    const tokenUrl = new URL(TOKEN_URL);
    tokenUrl.searchParams.append("client_id", this.#clientId.toString());
    tokenUrl.searchParams.append("client_secret", this.#clientSecret);
    tokenUrl.searchParams.append("code", authCode);
    tokenUrl.searchParams.append("grant_type", "authorization_code");

    const tokenRes = await got.post(tokenUrl, {
      responseType: "json",
    });
    const token = tokenRes.body as AccessToken;

    logger.info(`Got token for athlete ${token.athlete.id}, uid ${uid}`);
    await User.update(
      {
        stravaAccessToken: token.access_token,
        stravaRefreshToken: token.refresh_token,
        stravaAccessTokenExpiresAt: new Date(token.expires_at * 1000),
        stravaAthleteId: token.athlete.id,
      },
      { where: { id: uid } }
    );
  }

  async loadActivity(activity: Activity, uid: string) {
    if (!activity.map.polyline && !activity.map.summary_polyline) {
      logger.info(
        `Skipping activity without map: ${activity.id} (${activity.name})`
      );
      return;
    }

    logger.info(`Loading activity: ${activity.id} (${activity.name})`);
    const pathJson = geojsonPolyline.decode({
      type: "LineString",
      coordinates: activity.map.polyline || activity.map.summary_polyline,
    });

    const user = await User.findOne({ where: { id: uid } });
    await user.createActivity({
      source: "strava",
      name: activity.name,
      date: activity.start_date,
      path: pathJson,
    });
  }

  async loadActivityById(activityId: number, user: User) {
    const getActivityUrl = new URL(ACTIVITIES_URL + "/" + activityId);
    const listActivitiesRes = await got(getActivityUrl, {
      headers: { Authorization: "Bearer " + user.stravaAccessToken },
      responseType: "json",
    });
    const activity = listActivitiesRes.body as Activity;
    await this.loadActivity(activity, user.id);
  }

  // Subscribes to strava webhook.
  async subscribe() {
    if (this.#subscriptionId) {
      throw new Error("Strava service already subscribed");
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
      logger.info(
        `Subscribed to strava webhook (id: ${this.#subscriptionId}).`
      );
    } catch (error) {
      logger.error(`subscribe post error: ${error}`);
    }
  }

  getAuthorize(req: express.Request, res: express.Response) {
    const authUrl = new URL(AUTH_URL);
    authUrl.searchParams.append("client_id", this.#clientId.toString());
    // TODO: Shouldn't be hardcoded like this.
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
      this.getAccessTokenFromAuthCode(authCode, uid);
    } catch (error) {
      logger.error("getAccessTokenFromAuthCode:", error);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  }

  async getLoadActivities(req: express.Request, res: express.Response) {
    const user = await User.findOne({ where: { id: req.uid } });

    if (req.query.activity_id != null) {
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

      let activities: Activity[];
      try {
        const listActivitiesRes = await got(listActivitiesUrl, {
          headers: { Authorization: "Bearer " + user.stravaAccessToken },
          responseType: "json",
        });
        activities = listActivitiesRes.body as Activity[];
      } catch (error) {
        res.status(400).send(error.toString());
      }

      if (activities.length === 0) {
        break;
      }

      for (const activity of activities) {
        try {
          await this.loadActivity(activity, req.uid);
        } catch (error) {
          res.status(400).send(error.toString());
        }
      }
    }

    res.sendStatus(200);
  }

  async getSubscriptionCallback(req: express.Request, res: express.Response) {
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

    if (event.object_type !== "activity") {
      // Nothing to do.
      res.sendStatus(200);
      return;
    }

    if (event.aspect_type === "create") {
      const user = await User.findOne({
        where: { stravaAthleteId: event.owner_id },
      });
      await this.loadActivityById(event.object_id, user);
    }
  }
}

export default StravaService;
