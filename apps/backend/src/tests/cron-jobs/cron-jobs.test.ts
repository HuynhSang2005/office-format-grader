/**
 * @file cron-jobs.test.ts
 * @description Unit tests cho cron jobs
 * @author Nguyễn Huỳnh Sang
 */

import { describe, it, expect } from 'vitest';
import { runJob } from '../../cron-jobs/job-runner';

describe('Cron Jobs', () => {
  it('should run job successfully', async () => {
    let jobExecuted = false;
    
    const testJob = async () => {
      jobExecuted = true;
    };
    
    await runJob('Test Job', testJob);
    expect(jobExecuted).toBe(true);
  });
  
  it('should handle job errors properly', async () => {
    const errorJob = async () => {
      throw new Error('Test error');
    };
    
    await expect(runJob('Error Job', errorJob)).rejects.toThrow('Test error');
  });
});