import { User } from "../model";

import express from "express";
import https from "https";

class StravaService {
  router: express.Router;

  #clientId: number;
  #clientSecret: string;

  constructor(clientId: number, clientSecret: string) {
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;

    this.router = express.Router();
    this.router.get("/authorize", this.authorize.bind(this));
    this.router.get("/authorize_callback", this.authorizeCallback.bind(this));
  }

  swapAuthCodeForAccessToken(userId: number, authCode: string) {
    const tokenUrl = new URL("https://www.strava.com/oauth/token");
    tokenUrl.searchParams.append("client_id", this.#clientId.toString());
    tokenUrl.searchParams.append("client_secret", this.#clientSecret);
    tokenUrl.searchParams.append("code", authCode);
    tokenUrl.searchParams.append("grant_type", "authorization_code");
    tokenUrl.searchParams.append("state", userId.toString());

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
              { where: { id: userId } }
            );
          });
      }
    );
    tokenReq.end();
  }

  authorize(req: express.Request, res: express.Response) {
    // TODO: Use actual auth eventually.
    if (req.query.user_id == null) {
      res.status(400);
      res.send("Request missing user ID");
    }

    const authUrl = new URL("https://www.strava.com/oauth/authorize");
    authUrl.searchParams.append("client_id", this.#clientId.toString());
    // TODO: Shoudln't be hardcoded like this.
    authUrl.searchParams.append(
      "redirect_uri",
      "http://localhost:3003/api/strava/authorize_callback"
    );
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "activity:read,activity:read_all");
    authUrl.searchParams.append("state", req.query.user_id as string);
    res.redirect(authUrl.toString());
  }

  authorizeCallback(req: express.Request, res: express.Response) {
    // TODO: Verify we got the scope we wanted (and probably other stuff).

    const userId = parseInt(req.query.state as string, 10);
    const authCode = req.query.code as string;
    this.swapAuthCodeForAccessToken(userId, authCode);

    res.status(200);
    res.send("Got it!");
  }
}

export default StravaService;
