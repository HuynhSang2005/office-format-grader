/**
 * @file export.controller.test.ts
 * @description Unit tests cho export controller
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { exportExcelController } from '@controllers/export.controller';

describe('exportExcelController', () => {
  it('nên có hàm exportExcelController', () => {
    expect(exportExcelController).toBeDefined();
    expect(typeof exportExcelController).toBe('function');
  });
});