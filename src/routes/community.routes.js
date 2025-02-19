const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getAllCommunities, joinCommunity } = require('../controllers/community.controller');

router.get('/', getAllCommunities);
router.patch('/:communityId/join', authenticate, joinCommunity);

module.exports = router;