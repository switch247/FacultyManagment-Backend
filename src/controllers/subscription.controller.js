const prisma = require('../config/db');

const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    // Save the subscription to the database
    await prisma.subscription.create({
      data: {
        endpoint,
        keys,
      },
    });

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { subscribe };