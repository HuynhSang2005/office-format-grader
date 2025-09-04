/**
 * @file cleanup.service.ts
 * @description Service dọn dẹp file tạm và tài nguyên không sử dụng
 * @author Nguyễn Huỳnh Sang
 */

import { logger } from '@core/logger';
import { cleanupTempFiles, cleanupOldMetadata } from '@services/storage.service';
import { CLEANUP_CONFIG, METADATA_CLEANUP_CONFIG } from '@/config/constants';
import type { run as runTempCleanup } from '../cron-jobs/temp-cleanup.job';
import type { run as runMetadataCleanup } from '../cron-jobs/metadata-cleanup.job';

let cleanupInterval: NodeJS.Timeout | null = null;

// Bắt đầu chu kỳ dọn dẹp tự động
export function startCleanupService(): void {
  if (cleanupInterval) {
    logger.warn('Cleanup service đã được khởi động trước đó');
    return;
  }
  
  logger.info(`Khởi động cleanup service với interval ${CLEANUP_CONFIG.INTERVAL}ms`);
  
  // Chạy ngay lập tức khi khởi động
  performCleanup();
  
  // Thiết lập chu kỳ dọn dẹp định kỳ
  cleanupInterval = setInterval(() => {
    performCleanup();
  }, CLEANUP_CONFIG.INTERVAL);
}

// Dừng chu kỳ dọn dẹp tự động
export function stopCleanupService(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('Đã dừng cleanup service');
  }
}

// Thực hiện dọn dẹp ngay lập tức
async function performCleanup(): Promise<void> {
  logger.info('Bắt đầu chu kỳ dọn dẹp');
  
  try {
    // Dọn dẹp file tạm cũ hơn 3 giờ được cấu hình
    await cleanupTempFiles(CLEANUP_CONFIG.OLDER_THAN_HOURS);
    
    // Dọn dẹp metadata files cũ hơn 14 ngày
    await cleanupOldMetadata();
    
    logger.info('Hoàn thành chu kỳ dọn dẹp');
  } catch (error) {
    logger.error('Lỗi trong quá trình dọn dẹp:', error);
  }
}

// Export để có thể call thủ công nếu cần
export { cleanupTempFiles, cleanupOldMetadata };

// Hàm tiện ích để dọn dẹp ngay lập tức
export async function cleanupNow(): Promise<void> {
  logger.info('Thực hiện dọn dẹp ngay lập tức');
  await performCleanup();
}

// Export cron job functions để tích hợp vào external scheduler
export { runTempCleanup, runMetadataCleanup };     