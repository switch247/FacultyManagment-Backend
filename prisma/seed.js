const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const communities = [
  { name: 'AI & Machine Learning', description: 'Artificial Intelligence enthusiasts' },
  { name: 'Web Development', description: 'Frontend and backend developers' },
  { name: 'Cybersecurity', description: 'Security experts community' },
  { name: 'Data Science', description: 'Data analysis and visualization' },
  { name: 'Mobile Development', description: 'iOS and Android developers' },
  { name: 'Cloud Computing', description: 'AWS, Azure, GCP experts' },
  { name: 'Game Development', description: 'Game designers and developers' },
  { name: 'Open Source', description: 'Open source contributors' }
];

async function main() {
  // Create communities
  await Promise.all(communities.map(async community => {
    await prisma.community.upsert({
      where: { name: community.name },
      update: {},
      create: community
    });
  }));
  
  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@faculty.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@faculty.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });