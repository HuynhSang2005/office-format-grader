/**
 * @file runInitialSetup.ts
 * @description Script chạy setup ban đầu cho hệ thống
 * @author Nguyễn Huỳnh Sang
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

async function runInitialSetup() {
  console.log('[INFO] Bắt đầu chạy setup ban đầu...');
  
  try {
    // Kiểm tra database đã được tạo chưa
    const dbPath = join(process.cwd(), 'prisma', 'dev.db');
    if (!existsSync(dbPath)) {
      console.log('[INFO] Tạo database bằng Prisma migrate...');
      execSync('bunx prisma migrate dev --name init', { stdio: 'inherit' });
    } else {
      console.log('[INFO] Database đã tồn tại, bỏ qua migrate');
    }
    
    // Tạo initial users
    console.log('[INFO] Tạo initial users...');
    const createUsersScript = join(process.cwd(), 'initialScript', 'createInitialUsers.ts');
    
    if (existsSync(createUsersScript)) {
      execSync(`bun ${createUsersScript}`, { stdio: 'inherit' });
    } else {
      console.log('[WARN] Script tạo users không tồn tại');
    }
    
    console.log('[INFO] Hoàn thành setup ban đầu');
  } catch (error) {
    console.error('[ERROR] Lỗi khi chạy setup ban đầu:', error);
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  runInitialSetup();
}

export default runInitialSetup;