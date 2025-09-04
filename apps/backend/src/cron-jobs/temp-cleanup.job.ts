/**
 * @file temp-cleanup.job.ts
 * @description Cron job dọn dẹp file tạm
 * @author Nguyễn Huỳnh Sang
 */

import { cleanupTempFiles } from '@services/storage.service';
import { CLEANUP_CONFIG } from '@/config/constants';
import { runJob } from './job-runner';

// Lịch chạy mặc định: mỗi giờ
export const schedule = process.env.TEMP_CLEANUP_SCHEDULE || '0 * * * *';

/**
 * Chạy job dọn dẹp file tạm
 */
export async function run(): Promise<void> {
  await runJob('Temp Cleanup', () => cleanupTempFiles(CLEANUP_CONFIG.OLDER_THAN_HOURS));
}