import express from "express";
import cors from "cors";
import { PORT, initialConfig } from "./config";
import apiRoutes from "./routes/api.routes";
import authRoutes from "./routes/auth.routes";
import { schedulerService } from "./services/scheduler.service";

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Mount API and Auth routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// Root health banner
app.get("/", (_req, res) => {
  res.json({
    engine: "Kanto Automator Engine (SaaS Edition)",
    status: "Operational",
    authProvider: "Google OAuth2 (Offline Consent + Gmail API)",
    constitution: "Strict Dynamic Flat UI",
    endpoints: {
      authGoogle: "/api/auth/google",
      authStatus: "/api/auth/status",
      settings: "/api/settings",
      triggerTest: "/api/trigger-test",
      status: "/api/status",
      history: "/api/history",
      health: "/api/health",
    },
  });
});

// Initialize task scheduler with default or configured time
schedulerService.setSchedule(initialConfig.scheduledTime);

// Start server
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(` ⚡ KANTO AUTOMATOR CORE ENGINE ACTIVE (SaaS Mode)`);
  console.log(` 🌐 Server URL: http://localhost:${PORT}`);
  console.log(` 🔐 Google Auth: /api/auth/google`);
  console.log(` ⏰ Scheduled Time: ${initialConfig.scheduledTime}`);
  console.log(` 📡 Sources Configured: ${initialConfig.searchUrls.length}`);
  console.log(`=================================================\n`);
});

export default app;
