/**
 * @file user.service.test.ts
 * @description Unit tests cho user service
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { userService } from '@services/user.service';

describe('User Service', () => {
  describe('Module Import', () => {
    it('nên import userService thành công', () => {
      expect(userService).toBeDefined();
      expect(typeof userService.findByEmail).toBe('function');
      expect(typeof userService.validatePassword).toBe('function');
    });
  });
});
