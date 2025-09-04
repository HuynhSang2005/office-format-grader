/**
 * @file cleanup-metadata.ts
 * @description Script dọn dẹp metadata files cũ
 * @author Nguyễn Huỳnh Sang
 */

import { cleanupOldMetadata } from '@services/storage.service';
import { logger } from '@core/logger';

async function runMetadataCleanup(): Promise<void> {
  try {
    logger.info('Bắt đầu script dọn dẹp metadata files');
    await cleanupOldMetadata();
    logger.info('Hoàn thành script dọn dẹp metadata files');
    process.exit(0);
  } catch (error) {
    logger.error('Lỗi khi chạy script dọn dẹp metadata:', error);
    process.exit(1);
  }
}

// Chạy nếu được gọi trực tiếp
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('cleanup-metadata.ts')) {
  runMetadataCleanup();
}

export default runMetadataCleanup;