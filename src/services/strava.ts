// TODO: Better error logging and handling.
// TODO: Gracefully handle duplicate activities.

import { User } from "../model";
import { verifyIdToken } from "../middleware/auth";
import { checkValidation } from "../middleware/validation";

import express from "express";
import { oneOf, query, validationResult } from "express-validator";
import geojsonPolyline from "geojson-polyline";
import got from "got";

import { Logger } from "tslog";

const logger: Logger = new Logger();

const ACTIVITIES_URL = "https://www.strava.com/api/v3/activities";
const AUTH_URL = "https://www.strava.com/oauth/authorize";
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

class StravaService {
  router: express.Router;

  #clientId: number;
  #clientSecret: string;

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

  getAuthorize(req: express.Request, res: express.Response) {
    const authUrl = new URL(AUTH_URL);
    authUrl.searchParams.append("client_id", this.#clientId.toString());
    // TODO: Shouldn't be hardcoded like this.
    authUrl.searchParams.append(
      "redirect_uri",
      "http://localhost:3003/api/strava/authorize_callback"
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
}

export default StravaService;
