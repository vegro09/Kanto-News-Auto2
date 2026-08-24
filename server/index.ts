import express from "express";
import cors from "cors";
import { PORT, initialConfig } from "./config";
import apiRoutes from "./routes/api.routes";
import { schedulerService } from "./services/scheduler.service";
import { storageService } from "./services/storage.service";

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

// Mount API routes exclusively
app.use("/api", apiRoutes);

// Initialize task scheduler with configured daily time
schedulerService.setSchedule(initialConfig.scheduledTime);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n=================================================`);
  console.log(` ⚡ KANTO AUTOMATOR: LOCAL INTELLIGENCE ENGINE`);
  console.log(` 🌐 API Base: http://localhost:${PORT}/api`);
  console.log(` 📚 Summaries Endpoint: http://localhost:${PORT}/api/summaries`);
  console.log(` ⏰ Scheduled Time: ${initialConfig.scheduledTime}`);
  console.log(` 📡 Sources Configured: ${initialConfig.searchUrls.length}`);
  console.log(` 💾 Local Archive Count: ${storageService.getTotalCount()}`);
  console.log(`=================================================\n`);
});

export default app;
