const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  getAllCommunities,
  joinCommunity,
  getCommunityById,
  createCommunity,
  getCommunityDiscussions,
} = require("../controllers/community.controller");

router.get("/", getAllCommunities);
router.get("/:id", getCommunityById);
router.get("/:id/discussions", getCommunityDiscussions);

router.post("/", createCommunity); // New route for creating a community
router.patch("/:communityId/join", authenticate, joinCommunity);

module.exports = router;
