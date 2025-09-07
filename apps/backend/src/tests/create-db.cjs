const { PrismaClient } = require('@prisma/client');

async function createDatabase() {
  const prisma = new PrismaClient();
  
  try {
    // Try to connect to the database
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // Try to query the users table
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in the database`);
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDatabase();