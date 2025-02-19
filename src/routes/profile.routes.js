const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { updateProfile } = require('../controllers/profile.controller');

// Update profile (authenticated users only)
router.patch('/', authenticate, updateProfile);

module.exports = router;