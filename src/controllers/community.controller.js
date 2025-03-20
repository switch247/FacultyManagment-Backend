const prisma = require("../config/db");

const getAllCommunities = async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      include: { members: true },
    });
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await prisma.community.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const joinCommunity = async (req, res) => {
  try {
    console.log("does user exist:", req.user);
    const { userId } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { communityId: req.params.communityId },
      include: { community: true },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if the community name already exists
    const existingCommunity = await prisma.community.findUnique({
      where: { name },
    });

    if (existingCommunity) {
      return res
        .status(400)
        .json({ error: "Community with this name already exists" });
    }

    // Create the new community
    const newCommunity = await prisma.community.create({
      data: {
        name,
        description,
        // Optionally, you can set the creator as the first member
      },
      include: { members: true },
    });

    res.status(201).json(newCommunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCommunityDiscussions = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await prisma.community.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    const discussions = await prisma.discussion.findMany({
      where: {
        communityId: id,
      },
    });

    res.json(discussions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllCommunities,
  joinCommunity,
  getCommunityById,
  createCommunity,
  getCommunityDiscussions,
};
