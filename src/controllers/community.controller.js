const prisma = require('../config/db');

const getAllCommunities = async (req, res) => {
  try {
    const communities = await prisma.community.findMany({
      include: { members: true }
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
      include: { members: true }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const joinCommunity = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { communityId: req.params.communityId },
      include: { community: true }
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllCommunities,
  joinCommunity,
  getCommunityById
};