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
router.post('/', createDiscussion);

// Get discussion with messages
router.get('/:discussionId', getDiscussionById);

// Send message to discussion
router.post('/:discussionId/messages', sendMessage);

// Update message
router.put('/messages/:messageId', updateMessage);

// Delete message
router.delete('/messages/:messageId', deleteMessage);

// Search discussions
router.get('/search/all', searchDiscussions);

module.exports = router;