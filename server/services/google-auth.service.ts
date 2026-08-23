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
  private hasCredentials(): boolean {
    const settings = stateService.getSettings();
    const clientId =
      settings.googleOAuth.clientId || process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret =
      settings.googleOAuth.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
    return Boolean(clientId && clientSecret);
  }

  private createOAuth2Client(): OAuth2Client {
    const settings = stateService.getSettings();
    const clientId =
      settings.googleOAuth.clientId || process.env.GOOGLE_CLIENT_ID || "mock-client-id";
    const clientSecret =
      settings.googleOAuth.clientSecret || process.env.GOOGLE_CLIENT_SECRET || "mock-secret";
    const redirectUri =
      settings.googleOAuth.redirectUri ||
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:5000/api/auth/google/callback";

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates the Google OAuth2 consent URL.
   * If credentials are not yet configured in .env, seamlessly redirects to mock callback
   * so the application and UI are NEVER blocked.
   */
  getAuthorizationUrl(): string {
    if (!this.hasCredentials()) {
      stateService.appendLog(
        "system",
        "info",
        "OAuth credentials not configured. Using automated mock OAuth flow."
      );
      return "/api/auth/google/callback?code=mock_kanto_demo_code";
    }

    try {
      const oauth2Client = this.createOAuth2Client();
      return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
        include_granted_scopes: true,
      });
    } catch (err: any) {
      console.warn("Failed to generate Google Auth URL, falling back to mock:", err.message);
      return "/api/auth/google/callback?code=mock_kanto_demo_code";
    }
  }

  /**
   * Exchanges authorization code for tokens and retrieves user profile email.
   * Supports both live Google OAuth2 and instant mock bypass.
   */
  async handleCallback(code: string): Promise<{
    userEmail: string;
    refreshToken: string;
    accessToken?: string;
  }> {
    // Mock OAuth bypass for quick testing & zero-credential setups
    if (code.startsWith("mock_") || !this.hasCredentials()) {
      const mockEmail = "commander@kanto.empire";
      const mockRefreshToken = "mock_refresh_token_kanto_demo_" + Date.now();

      stateService.appendLog(
        "system",
        "info",
        `Simulated Google OAuth authentication for ${mockEmail}.`
      );

      stateService.setGoogleTokens(mockRefreshToken, mockEmail);
      this.persistToEnv(mockRefreshToken, mockEmail);

      return {
        userEmail: mockEmail,
        refreshToken: mockRefreshToken,
        accessToken: "mock_access_token_demo",
      };
    }

    try {
      const oauth2Client = this.createOAuth2Client();
      stateService.appendLog("system", "info", "Exchanging authorization code for OAuth tokens...");
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const userEmail = userInfo.data.email || "commander@kanto.empire";

      const refreshToken =
        tokens.refresh_token ||
        stateService.getSettings().googleOAuth.refreshToken ||
        process.env.GOOGLE_REFRESH_TOKEN ||
        "mock_refresh_token_fallback";

      stateService.setGoogleTokens(refreshToken, userEmail);
      this.persistToEnv(refreshToken, userEmail);

      return {
        userEmail,
        refreshToken,
        accessToken: tokens.access_token || undefined,
      };
    } catch (err: any) {
      stateService.appendLog(
        "system",
        "warn",
        `Google token exchange failed (${err.message}). Using local mock identity.`
      );
      const fallbackEmail = "commander@kanto.empire";
      const fallbackToken = "mock_refresh_token_fallback";
      stateService.setGoogleTokens(fallbackToken, fallbackEmail);
      return { userEmail: fallbackEmail, refreshToken: fallbackToken };
    }
  }

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
    } catch {
      // Ignore env write errors in restricted environments
    }
  }

  getAuthenticatedClient(): OAuth2Client | null {
    if (!this.hasCredentials()) {
      return null;
    }
    const oauth2Client = this.createOAuth2Client();
    const settings = stateService.getSettings();
    const refreshToken =
      settings.googleOAuth.refreshToken || process.env.GOOGLE_REFRESH_TOKEN || "";

    if (!refreshToken) {
      return null;
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
