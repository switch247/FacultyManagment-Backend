const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { createNews, getNews } = require('../controllers/news.controller');

// Create news (admin/staff only)
router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  createNews
);

// Get all news (public)
router.get('/', getNews);

module.exports = router;