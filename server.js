require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");
const profileRoutes = require("./src/routes/profile.routes");
const newsRoutes = require("./src/routes/news.routes");
const discussionRoutes = require("./src/routes/discussion.routes");
const communityRoutes = require("./src/routes/community.routes");

const jwt = require("jsonwebtoken");
const logger = require("./src/utils/logger");
const { io, app, server } = require("./src/config/socket");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    socket: io.engine.clientsCount ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/communities", communityRoutes);

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

function gracefulShutdown() {
  logger.info("Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Force shutdown due to timeout");
    process.exit(1);
  }, 5000);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  prisma
    .$connect()
    .then(() => logger.info("Connected to MongoDB"))
    .catch((err) => logger.error("MongoDB connection error:", err));
});
