const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const jwt = require("jsonwebtoken");

const prisma = require("../config/db");
const logger = require("../utils/logger");
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    logger.info(`Socket connection attempt with token: ${token}`);

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
    logger.error("Socket authentication failed:", error);
    next(new Error("Authentication error"));
  }
});

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

  socket.on("sendMessage", async ( message ) => {
    try {
      logger.debug("message", message);
      const { discussionId, content, authorId, parentMessageId } = req.body;
      if (!discussionId || !content) {
        throw new Error("Discussion ID and content are required");
      }

      //   const message = await prisma.message.create({
      //     data: {
      //       content,
      //       authorId: socket.user.id,
      //       discussionId,
      //     },
      //     include: { author: true },
      //   });

      io.to(discussionId).emit("newMessage", message);
      logger.debug(
        `Message sent to discussion ${discussionId} by ${socket.user.name}`
      );
    } catch (error) {
      logger.error("Message creation failed:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", (reason) => {
    logger.info(`User disconnected: ${socket.user.name} (Reason: ${reason})`);
  });
});

module.exports = { io, app, server };
