/**
 * @file user.service.ts
 * @description Dịch vụ quản lý người dùng
 * @author Nguyễn Huỳnh Sang
 */

import { PrismaClient } from "@prisma/client";
// import bcrypt from 'bcrypt';
import bcrypt from "bcryptjs";
import { logger } from "@core/logger";

const prisma = new PrismaClient();

export const userService = {
  findByEmail: async (email: string) => {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error("[USER] Lỗi khi tìm user theo email:", error);
      throw error;
    }
  },

  validatePassword: async (password: string, hashedPassword: string) => {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error("[USER] Lỗi khi xác thực mật khẩu:", error);
      return false;
    }
  },
};
