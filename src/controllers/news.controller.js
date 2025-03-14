const prisma = require("../config/db");
const { sendNotification } = require("../utils/pushNotification");

const createNews = async (req, res) => {
  try {
    const { title, content, authorId } = req.body; // Extract authorId from the request body

    // Validate required fields
    if (!title || !content || !authorId) {
      return res.status(400).json({ error: "Title, content, and authorId are required" });
    }

    // Create the news post and associate it with the author
    const news = await prisma.news.create({
      data: {
        title,
        content,
        author: {
          connect: { id: authorId }, // Connect the news to the author using authorId
        },
      },
    });

    // Fetch all subscriptions from the database
    const subscriptions = await prisma.subscription.findMany();

    // Send push notifications to all subscribers
    subscriptions.forEach((subscription) => {
      sendNotification(subscription, {
        title: "New News Alert!",
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
      include: { author: true }, // Include the author details in the response
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createNews, getNews };