const prisma = require('../config/db');

const updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'education', 'communityId'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { updateProfile };