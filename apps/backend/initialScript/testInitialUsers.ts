/**
 * @file testInitialUsers.ts
 * @description Script kiểm tra việc tạo users ban đầu
 * @author Nguyễn Huỳnh Sang
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testInitialUsers() {
  console.log('[INFO] Kiểm tra users trong database...');
  
  try {
    // Lấy tất cả users
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log('[INFO] Chưa có users trong database');
      return;
    }
    
    console.log(`[INFO] Tìm thấy ${users.length} users:`);
    
    for (const user of users) {
      console.log(`- ID: ${user.id}, Email: ${user.email}`);
      
      // Kiểm tra password có được hash không
      const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$');
      console.log(`  Password hashed: ${isHashed ? 'Có' : 'Không'}`);
    }
  } catch (error) {
    console.error('[ERROR] Lỗi khi kiểm tra users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testInitialUsers();
}

export default testInitialUsers;