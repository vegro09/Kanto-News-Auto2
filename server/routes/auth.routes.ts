import { Router, Request, Response } from "express";
import { googleAuthService } from "../services/google-auth.service";
import { stateService } from "../services/state.service";

const router = Router();

// GET /api/auth/google -> Redirects to Google OAuth2 Consent Screen
router.get("/google", (req: Request, res: Response) => {
  try {
    const authUrl = googleAuthService.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/google/callback -> Handles OAuth Redirect from Google
router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    console.error("[OAuth] Error received from Google:", error);
    return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.status(400).send("Missing authorization code from Google.");
  }

  try {
    const { userEmail } = await googleAuthService.handleCallback(code);
    console.log(`[OAuth] Successfully authenticated Google account: ${userEmail}`);
    // Redirect back to frontend settings view with success parameter
    res.redirect(`/?auth=success&email=${encodeURIComponent(userEmail)}`);
  } catch (err: any) {
    console.error("[OAuth] Callback token exchange failed:", err);
    res.redirect(`/?auth_error=${encodeURIComponent(err.message || "Token exchange failed")}`);
  }
});

// POST /api/auth/google/disconnect -> Disconnect and clear tokens
router.post("/google/disconnect", (_req: Request, res: Response) => {
  try {
    googleAuthService.disconnect();
    res.json({
      success: true,
      message: "Google OAuth disconnected successfully.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/status -> Check authentication status
router.get("/status", (_req: Request, res: Response) => {
  try {
    const settings = stateService.getPublicSettings();
    res.json({
      success: true,
      googleConnected: settings.googleConnected,
      userEmail: settings.googleUserEmail,
      hasRefreshToken: settings.hasGoogleRefreshToken,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
