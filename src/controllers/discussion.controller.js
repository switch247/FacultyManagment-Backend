const prisma = require("../config/db");
const { io } = require("../config/socket");
const createDiscussion = async (req, res) => {
  try {
    const { title, content, authorId, communityId } = req.body;

    // Validate required fields
    if (!title || !content || !authorId || !communityId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        authorId,
        communityId,
      },
      include: {
        author: true,
        community: true,
      },
    });

    res.status(201).json(discussion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, authorId, parentMessageId } = req.body;
    const { discussionId } = req.params;

    if (!content || !authorId || !discussionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    const messageData = {
      content,
      authorId,
      discussionId,
      parentMessageId: parentMessageId || undefined,
      role: user.role,
    };

    const message = await prisma.message.create({
      data: messageData,
      include: {
        author: true,
        replies: true,
      },
    });
    io.emit("newMessage", message);
    res.status(201).json(message);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const getDiscussionById = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { parentMessageId } = req.params;
    let whereClause = {};
    if (parentMessageId) whereClause.parentMessageId = parentMessageId;
    const discussion = await prisma.discussion.findUnique({
      where: { id: req.params.discussionId },
      include: {
        author: true,
        community: true,
        messages: {
          where: whereClause,
          include: {
            author: true,
            replies: {
              include: {
                author: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    res.json(discussion);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const updateMessage = async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const { messageId } = req.params;

    if (!content || !authorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.authorId !== authorId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: { author: true },
    });

    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { authorId, role } = req.body;
    const { messageId } = req.params;

    // Validate required fields
    if (!authorId || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.authorId !== authorId && role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const searchDiscussions = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const discussions = await prisma.discussion.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        author: true,
        community: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json(discussions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDiscussion,
  sendMessage,
  getDiscussionById,
  updateMessage,
  deleteMessage,
  searchDiscussions,
};
