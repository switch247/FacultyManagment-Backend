const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNotification = async (data) => {
  return prisma.notification.create({
    data: {
      ...data,
      users: { connect: data.users.map(id => ({ id })) }
    }
  });
};

module.exports = {
  createNotification
};