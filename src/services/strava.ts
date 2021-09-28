import { Activity, User } from "../model";
import { verifyIdToken } from "../middleware/auth";

import express from "express";
import geojsonPolyline from "geojson-polyline";
import got from "got";
import https from "https";

import { Logger } from "tslog";

const logger: Logger = new Logger();

class StravaService {
  router: express.Router;

  #clientId: number;
  #clientSecret: string;

  constructor(clientId: number, clientSecret: string) {
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;

    this.router = express.Router();
    this.router.get("/authorize", verifyIdToken, this.authorize.bind(this));
    this.router.get("/authorize_callback", this.authorizeCallback.bind(this));
    this.router.get(
      "/load_activities",
      verifyIdToken,
      this.loadActivities.bind(this)
    );
  }

  swapAuthCodeForAccessToken(uid: string, authCode: string) {
    const tokenUrl = new URL("https://www.strava.com/oauth/token");
    tokenUrl.searchParams.append("client_id", this.#clientId.toString());
    tokenUrl.searchParams.append("client_secret", this.#clientSecret);
    tokenUrl.searchParams.append("code", authCode);
    tokenUrl.searchParams.append("grant_type", "authorization_code");

    let tokenText: string = "";

    const tokenReq = https.request(
      tokenUrl,
      {
        method: "POST",
      },
      (tokenRes) => {
        tokenRes
          .on("data", (chunk) => {
            tokenText += chunk.toString();
          })
          .on("end", async () => {
            const token = JSON.parse(tokenText);

            await User.update(
              {
                stravaAccessToken: token.access_token,
                stravaRefreshToken: token.refresh_token,
                stravaAccessTokenExpiresAt: token.expires_at,
              },
              { where: { id: uid } }
            );
          });
      }
    );
    tokenReq.end();
  }

  // TODO: You can do better than any.
  // TODO: Passing around the user ID maybe isn't great?
  async loadActivity(activity: any, uid: string) {
    logger.info("Loading activity:", activity.id, activity.name);

    if (!activity.map.polyline && !activity.map.summary_polyline) {
      logger.info("Skipping activity without map.");
      return;
    }
    const pathJson = geojsonPolyline.decode({
      type: "LineString",
      coordinates: activity.map.polyline || activity.map.summary_polyline,
    });

    await User.findOne({ where: { id: uid } }).then(async (user) => {
      await user.createActivity({
        source: "strava",
        name: activity.name,
        date: activity.start_date,
        path: pathJson,
      });
    });
  }

  authorize(req: express.Request, res: express.Response) {
    const authUrl = new URL("https://www.strava.com/oauth/authorize");
    authUrl.searchParams.append("client_id", this.#clientId.toString());
    // TODO: Shouldn't be hardcoded like this.
    authUrl.searchParams.append(
      "redirect_uri",
      "http://localhost:3003/api/strava/authorize_callback"
    );
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "activity:read,activity:read_all");
    // TODO: Consider whether exposing user UIDs is a bad idea.
    authUrl.searchParams.append("state", req.uid as string);
    res.redirect(authUrl.toString());
  }

  authorizeCallback(req: express.Request, res: express.Response) {
    // TODO: Verify we got the scope we wanted (and probably other stuff).

    const uid = req.query.state as string;
    const authCode = req.query.code as string;
    this.swapAuthCodeForAccessToken(uid, authCode);

    res.status(200);
    res.send("Got it!");
  }

  async loadActivities(req: express.Request, res: express.Response) {
    const user = await User.findOne({ where: { id: req.uid } });

    if (req.query.activity_id != null) {
      const activityId = parseInt(req.query.activity_id as string, 10);

      const getActivityUrl = new URL(
        "https://www.strava.com/api/v3/activities/" + activityId.toString()
      );
      try {
        const listActivitiesRes = await got(getActivityUrl, {
          headers: { Authorization: "Bearer " + user.stravaAccessToken },
          responseType: "json",
        });
        const activity = listActivitiesRes.body;
        await this.loadActivity(activity, req.uid);
      } catch (error) {
        logger.error(error);
      }

      res.status(200);
      res.send("Done.");
      return;
    }

    const listActivitiesUrl = new URL(
      "https://www.strava.com/api/v3/athlete/activities"
    );

    for (let page = 1; ; page++) {
      listActivitiesUrl.searchParams.append("page", page.toString());

      // TODO: Do better.
      let activities: any;
      try {
        const listActivitiesRes = await got(listActivitiesUrl, {
          headers: { Authorization: "Bearer " + user.stravaAccessToken },
          responseType: "json",
        });
        activities = listActivitiesRes.body;
      } catch (error) {
        logger.error(error.response.body);
      }

      if (activities.length === 0) {
        break;
      }

      for (const activity of activities) {
        await this.loadActivity(activity, req.uid);
      }
    }

    res.status(200);
    res.send("Done!");
  }
}

export default StravaService;
