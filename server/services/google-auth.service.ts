import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import { stateService } from "./state.service";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];

export class GoogleAuthService {
  private createOAuth2Client(): OAuth2Client {
    const settings = stateService.getSettings();
    const clientId =
      settings.googleOAuth.clientId || process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret =
      settings.googleOAuth.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
    const redirectUri =
      settings.googleOAuth.redirectUri ||
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:5000/api/auth/google/callback";

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates the Google OAuth2 consent URL.
   * CRITICAL: Enforces access_type: 'offline' and prompt: 'consent'
   * to guarantee Google returns a long-lived refresh_token.
   */
  getAuthorizationUrl(): string {
    const oauth2Client = this.createOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Required to receive refresh_token
      prompt: "consent", // Forces consent screen to ensure refresh_token on repeated logins
      scope: SCOPES,
      include_granted_scopes: true,
    });

    stateService.appendLog(
      "system",
      "info",
      "Generated Google OAuth2 authorization URL with offline consent."
    );

    return authUrl;
  }

  /**
   * Exchanges authorization code for tokens and retrieves user profile email.
   */
  async handleCallback(code: string): Promise<{
    userEmail: string;
    refreshToken: string;
    accessToken?: string;
  }> {
    const oauth2Client = this.createOAuth2Client();

    stateService.appendLog("system", "info", "Exchanging authorization code for OAuth tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const userEmail = userInfo.data.email || "unknown@user.com";

    const refreshToken =
      tokens.refresh_token ||
      stateService.getSettings().googleOAuth.refreshToken ||
      process.env.GOOGLE_REFRESH_TOKEN ||
      "";

    if (!tokens.refresh_token && !refreshToken) {
      stateService.appendLog(
        "system",
        "warn",
        "No refresh_token returned by Google. If re-authenticating, revoke previous app access or re-run with prompt=consent."
      );
    } else {
      stateService.appendLog(
        "system",
        "info",
        `Successfully obtained offline refresh token for ${userEmail}.`
      );
    }

    // Persist in state service
    stateService.setGoogleTokens(refreshToken, userEmail);

    // Persist into .env file for durability across restarts
    this.persistToEnv(refreshToken, userEmail);

    return {
      userEmail,
      refreshToken,
      accessToken: tokens.access_token || undefined,
    };
  }

  /**
   * Helper to write refresh token and user email to .env
   */
  private persistToEnv(refreshToken: string, userEmail: string) {
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      let envContent = "";
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
      }

      const updateKey = (key: string, val: string) => {
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${val}`);
        } else {
          envContent += `\n${key}=${val}`;
        }
      };

      if (refreshToken) updateKey("GOOGLE_REFRESH_TOKEN", refreshToken);
      if (userEmail) updateKey("GOOGLE_USER_EMAIL", userEmail);

      fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");
      stateService.appendLog("system", "info", "Persisted Google OAuth credentials to .env file.");
    } catch (err: any) {
      stateService.appendLog(
        "system",
        "warn",
        `Could not write tokens to .env: ${err?.message || "File error"}`
      );
    }
  }

  /**
   * Returns an authenticated OAuth2 client loaded with the stored refresh_token.
   * googleapis automatically handles refreshing expired access_tokens transparently.
   */
  getAuthenticatedClient(): OAuth2Client {
    const oauth2Client = this.createOAuth2Client();
    const settings = stateService.getSettings();
    const refreshToken =
      settings.googleOAuth.refreshToken || process.env.GOOGLE_REFRESH_TOKEN || "";

    if (!refreshToken) {
      throw new Error(
        "Google OAuth2 is not connected. No refresh_token found. Please authorize via 'Sign in with Google'."
      );
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    return oauth2Client;
  }

  disconnect() {
    stateService.clearGoogleTokens();
    this.persistToEnv("", "");
    stateService.appendLog("system", "info", "Google OAuth2 account disconnected.");
  }
}

export const googleAuthService = new GoogleAuthService();
