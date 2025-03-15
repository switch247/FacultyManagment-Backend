const express = require('express');
const router = express.Router();
const { signup, login, getUsers } = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.get(
   '/users',
   authenticate,
   getUsers
 );
module.exports = router;