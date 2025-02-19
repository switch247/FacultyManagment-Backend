const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { 
  createDiscussion, 
  sendMessage,
  getDiscussionById,
  updateMessage,
  deleteMessage,
  searchDiscussions
} = require('../controllers/discussion.controller');

// Create discussion
router.post('/', authenticate, createDiscussion);

// Get discussion with messages
router.get('/:discussionId', authenticate, getDiscussionById);

// Send message to discussion
router.post('/:discussionId/messages', authenticate, sendMessage);

// Update message
router.put('/messages/:messageId', authenticate, updateMessage);

// Delete message
router.delete('/messages/:messageId', authenticate, deleteMessage);

// Search discussions
router.get('/search/all', authenticate, searchDiscussions);

module.exports = router;