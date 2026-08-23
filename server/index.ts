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

// Mount API and Auth routes exclusively
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// Initialize task scheduler with default or configured time
schedulerService.setSchedule(initialConfig.scheduledTime);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n=================================================`);
  console.log(` ⚡ KANTO AUTOMATOR CORE ENGINE ACTIVE (SaaS Mode)`);
  console.log(` 🌐 Server API: http://localhost:${PORT}/api`);
  console.log(` 🔐 Google Auth: http://localhost:${PORT}/api/auth/google`);
  console.log(` ⏰ Scheduled Time: ${initialConfig.scheduledTime}`);
  console.log(` 📡 Sources Configured: ${initialConfig.searchUrls.length}`);
  console.log(`=================================================\n`);
});

export default app;
