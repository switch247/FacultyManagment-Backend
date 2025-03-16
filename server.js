require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");
const profileRoutes = require("./src/routes/profile.routes");
const newsRoutes = require("./src/routes/news.routes");
const discussionRoutes = require("./src/routes/discussion.routes");
const communityRoutes = require("./src/routes/community.routes");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./src/utils/logger");

const app = express();
const server = http.createServer(app);

// Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (for development)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
});

// Express Middleware
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

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    socket: io.engine.clientsCount ? "connected" : "disconnected",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/communities", communityRoutes);

// Socket.IO Authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    logger.debug(`Socket connection attempt with token: ${token}`);

    if (!token) {
      throw new Error("No token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      logger.warn("Socket connection attempt with invalid user");
      throw new Error("Unauthorized");
    }

    socket.user = user;
    logger.info(`Socket authenticated for user: ${user.email}`);
    next();
  } catch (error) {
    logger.error("Socket authentication failed:", error.message);
    next(new Error("Authentication error"));
  }
});

// Socket.IO Event Handlers
io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.user.name} (ID: ${socket.id})`);

  socket.on("error", (error) => {
    logger.error(`Socket error (${socket.id}):`, error);
    socket.emit("error", { message: "Socket error occurred" });
  });

  socket.on("joinDiscussion", (discussionId) => {
    try {
      if (!discussionId) {
        throw new Error("Discussion ID is required");
      }

      socket.join(discussionId);
      logger.info(`User ${socket.user.name} joined discussion ${discussionId}`);
      socket.emit("join-confirmation", {
        status: "success",
        discussionId,
      });
    } catch (error) {
      logger.error("Discussion join error:", error);
      socket.emit("error", { message: "Failed to join discussion" });
    }
  });

  socket.on("sendMessage", async ({ discussionId, content }) => {
    try {
      if (!discussionId || !content) {
        throw new Error("Discussion ID and content are required");
      }

      const message = await prisma.message.create({
        data: {
          content,
          authorId: socket.user.id,
          discussionId,
        },
        include: { author: true },
      });

      io.to(discussionId).emit("newMessage", message);
      logger.debug(`Message sent to discussion ${discussionId} by ${socket.user.name}`);
    } catch (error) {
      logger.error("Message creation failed:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", (reason) => {
    logger.info(`User disconnected: ${socket.user.name} (Reason: ${reason})`);
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Graceful Shutdown
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

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  prisma.$connect()
    .then(() => logger.info("Connected to MongoDB"))
    .catch((err) => logger.error("MongoDB connection error:", err));
});