/**
 * @file metadata-cleanup.job.ts
 * @description Cron job dọn dẹp metadata files
 * @author Nguyễn Huỳnh Sang
 */

import { cleanupOldMetadata } from '@services/storage.service';
import { METADATA_CLEANUP_CONFIG } from '@/config/constants';
import { runJob } from './job-runner';

// Lịch chạy mặc định: hàng ngày lúc 2AM
export const schedule = METADATA_CLEANUP_CONFIG.SCHEDULE;

/**
 * Chạy job dọn dẹp metadata files
 */
export async function run(): Promise<void> {
  await runJob('Metadata Cleanup', () => cleanupOldMetadata());
}