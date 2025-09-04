/**
 * @file job-runner.ts
 * @description Trình chạy các cron job với logging và xử lý lỗi chuẩn hóa
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';

/**
 * Chạy một cron job với xử lý lỗi và logging chuẩn hóa
 * @param jobName Tên của job để logging
 * @param jobFunction Hàm thực thi job
 * @returns Promise<void>
 */
export async function runJob(jobName: string, jobFunction: () => Promise<void>): Promise<void> {
  try {
    logger.info(`Bắt đầu chạy cron job: ${jobName}`);
    await jobFunction();
    logger.info(`Hoàn thành cron job: ${jobName}`);
  } catch (error) {
    logger.error(`Lỗi khi chạy cron job ${jobName}:`, error);
    throw error; // Re-throw để caller có thể xử lý thêm nếu cần
  }
}