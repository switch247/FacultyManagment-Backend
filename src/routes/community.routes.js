const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { 
  getAllCommunities, 
  joinCommunity,
  getCommunityById 
} = require('../controllers/community.controller');

router.get('/', getAllCommunities);
router.get('/:id', getCommunityById);
router.patch('/:communityId/join', authenticate, joinCommunity);

module.exports = router;