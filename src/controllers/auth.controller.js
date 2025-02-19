const prisma = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'student'
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
// Add to auth.controller.js
const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const roleFilter = role ? { role } : {};
    
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: roleFilter,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          community: true
        }
      }),
      prisma.user.count({ where: roleFilter })
    ]);

    res.json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update exports
module.exports = { signup, login, getUsers };

