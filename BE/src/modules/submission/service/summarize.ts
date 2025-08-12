/**
 * @note Hàm này cần được triển khai đầy đủ để phân tích bài nộp.
 */
export async function summarize(submissionFile: File, rubricFile?: File) {
  return {
    submission: {
      filename: submissionFile.name,
      rubric: rubricFile ? rubricFile.name : undefined,
    },
  };
}
