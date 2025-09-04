/**
 * @file cleanup-temp.ts
 * @description Script dọn dẹp temp files cũ
 * @author Nguyễn Huỳnh Sang
 */

import { cleanupTempFiles } from '@services/storage.service';
import { logger } from '@core/logger';
import { CLEANUP_CONFIG } from '@/config/constants';

async function runTempCleanup(): Promise<void> {
  try {
    logger.info('Bắt đầu script dọn dẹp temp files');
    await cleanupTempFiles(CLEANUP_CONFIG.OLDER_THAN_HOURS);
    logger.info('Hoàn thành script dọn dẹp temp files');
    process.exit(0);
  } catch (error) {
    logger.error('Lỗi khi chạy script dọn dẹp temp files:', error);
    process.exit(1);
  }
}

// Chạy nếu được gọi trực tiếp
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('cleanup-temp.ts')) {
  runTempCleanup();
}

export default runTempCleanup;