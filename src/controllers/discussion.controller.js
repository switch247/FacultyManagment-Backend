const prisma = require('../config/db');

const createDiscussion = async (req, res) => {
  try {
    const discussion = await prisma.discussion.create({
      data: {
        title: req.body.title,
        content: req.body.content,
        authorId: req.user.id,
        communityId: req.user.communityId
      },
      include: {
        author: true,
        community: true
      }
    });
    res.status(201).json(discussion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const messageData = {
      content: req.body.content,
      authorId: req.user.id,
      discussionId: req.params.discussionId,
      parentMessageId: req.body.parentMessageId || null
    };

    const message = await prisma.message.create({
      data: messageData,
      include: {
        author: true,
        replies: true
      }
    });
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getDiscussionById = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const discussion = await prisma.discussion.findUnique({
      where: { id: req.params.discussionId },
      include: {
        author: true,
        community: true,
        messages: {
          where: { parentMessageId: null },
          include: {
            author: true,
            replies: {
              include: {
                author: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    res.json(discussion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMessage = async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: req.params.messageId },
      data: { content: req.body.content },
      include: { author: true }
    });

    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.message.delete({
      where: { id: req.params.messageId }
    });

    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const searchDiscussions = async (req, res) => {
  try {
    const { query } = req.query;
    const discussions = await prisma.discussion.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        author: true,
        community: true,
        _count: {
          select: { messages: true }
        }
      }
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
  searchDiscussions
};