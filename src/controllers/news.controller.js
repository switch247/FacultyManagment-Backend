const prisma = require('../config/db');
const { sendNotification } = require('../utils/pushNotification');

const createNews = async (req, res) => {
  try {
    const { title, content } = req.body;

    // Create the news post
    const news = await prisma.news.create({
      data: {
        title,
        content,
        authorId: req.user.id,
      },
    });

    // Fetch all subscriptions from the database
    const subscriptions = await prisma.subscription.findMany();

    // Send push notifications to all subscribers
    subscriptions.forEach((subscription) => {
      sendNotification(subscription, {
        title: 'New News Alert!',
        body: news.title,
      });
    });

    res.status(201).json(news);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getNews = async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      include: { author: true },
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createNews, getNews };