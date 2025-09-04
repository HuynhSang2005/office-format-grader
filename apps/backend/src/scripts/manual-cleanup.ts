/**
 * @file manual-cleanup.ts
 * @description Script dọn dẹp thủ công cả temp files và metadata files
 * @author Nguyễn Huỳnh Sang
 */

import { cleanupTempFiles, cleanupOldMetadata } from '@services/storage.service';
import { logger } from '@core/logger';
import { CLEANUP_CONFIG, METADATA_CLEANUP_CONFIG } from '@/config/constants';

interface CleanupOptions {
  tempOnly?: boolean;
  metadataOnly?: boolean;
}

async function runManualCleanup(options: CleanupOptions = {}): Promise<void> {
  try {
    logger.info('Bắt đầu script dọn dẹp thủ công');
    
    const { tempOnly = false, metadataOnly = false } = options;
    
    // Dọn dẹp temp files (trừ khi chỉ dọn metadata)
    if (!metadataOnly) {
      logger.info(`Dọn dẹp temp files cũ hơn ${CLEANUP_CONFIG.OLDER_THAN_HOURS} giờ`);
      await cleanupTempFiles(CLEANUP_CONFIG.OLDER_THAN_HOURS);
    }
    
    // Dọn dẹp metadata files (trừ khi chỉ dọn temp)
    if (!tempOnly) {
      logger.info(`Dọn dẹp metadata files cũ hơn ${METADATA_CLEANUP_CONFIG.RETENTION_DAYS} ngày`);
      await cleanupOldMetadata();
    }
    
    logger.info('Hoàn thành script dọn dẹp thủ công');
    process.exit(0);
  } catch (error) {
    logger.error('Lỗi khi chạy script dọn dẹp thủ công:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Script dọn dẹp thủ công cho Office Vibe Code

Usage: bun src/scripts/manual-cleanup.ts [options]

Options:
  --help, -h          Hiển thị trợ giúp này
  --temp-only         Chỉ dọn dẹp temp files
  --metadata-only     Chỉ dọn dẹp metadata files
  --all               Dọn dẹp cả temp files và metadata files (mặc định)

Description:
  Script này sẽ dọn dẹp các file theo cấu hình:
  - Temp files cũ hơn ${CLEANUP_CONFIG.OLDER_THAN_HOURS} giờ
  - Metadata files cũ hơn ${METADATA_CLEANUP_CONFIG.RETENTION_DAYS} ngày
  `);
  process.exit(0);
}

// Xác định options từ command line arguments
const options: CleanupOptions = {};
if (args.includes('--temp-only')) {
  options.tempOnly = true;
}
if (args.includes('--metadata-only')) {
  options.metadataOnly = true;
}

// Chạy nếu được gọi trực tiếp
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('manual-cleanup.ts')) {
  runManualCleanup(options);
}

export default runManualCleanup;