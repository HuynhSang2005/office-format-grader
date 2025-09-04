/**
 * @file createInitialUsers.ts
 * @description Script tạo 3 user ban đầu trong database
 * @author Nguyễn Huỳnh Sang
 */

import { PrismaClient } from "@prisma/client";
// import bcrypt from 'bcrypt';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Thông tin 3 user cần tạo
const initialUsers = [
  {
    email: "admin@example.com",
    password: "admin123",
  },
  {
    email: "teacher@example.com",
    password: "teacher123",
  },
  {
    email: "student@example.com",
    password: "student123",
  },
];

async function createInitialUsers() {
  console.log("[INFO] Bắt đầu tạo users ban đầu...");

  try {
    // Kiểm tra xem đã có users trong database chưa
    const existingUsers = await prisma.user.findMany();
    if (existingUsers.length > 0) {
      console.log("[WARN] Đã tồn tại users trong database, bỏ qua tạo mới");
      return;
    }

    // Tạo users với password đã hash
    for (const userData of initialUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
        },
      });

      console.log(`[INFO] Đã tạo user: ${user.email} (ID: ${user.id})`);
    }

    console.log("[INFO] Hoàn thành tạo users ban đầu");
  } catch (error) {
    console.error("[ERROR] Lỗi khi tạo users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  createInitialUsers();
}

export default createInitialUsers;
