const prisma = require('../config/db');

const createNews = async (req, res) => {
  try {
    const news = await prisma.news.create({
      data: {
        ...req.body,
        authorId: req.user.id
      }
    });
    res.status(201).json(news);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getNews = async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      include: { author: true }
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createNews, getNews };