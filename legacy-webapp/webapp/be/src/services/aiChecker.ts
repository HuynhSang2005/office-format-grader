import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateContentResult } from "@google/generative-ai";
import { logger } from "../utils/logger";
import type { GradingResult, GradingDetail } from "../types/grading.types";



const AI_CONFIG = {
  apiKey: process.env.GOOGLE_API_KEY,
  model: process.env.GOOGLE_AI_MODEL || "models/gemini-2.5-flash-lite",
  temperature: Number(process.env.GOOGLE_AI_TEMPERATURE) || 0,
  maxRetries: Number(process.env.GOOGLE_AI_MAX_RETRIES) || 3,
  retryDelayMs: Number(process.env.GOOGLE_AI_RETRY_DELAY_MS) || 1000,
};

// Top-level throw removed. Use lazy init instead.
// Khởi tạo model
// const genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);
// const model = genAI.getGenerativeModel({ 
//   model: AI_CONFIG.model, 
//   generationConfig: { temperature: AI_CONFIG.temperature } 
// });

// Lazy init Gemini model to avoid crashing at startup if envs are missing
let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
function getModel() {
  if (!AI_CONFIG.apiKey) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables");
  }
  if (!model) {
    const genAI = new GoogleGenerativeAI(AI_CONFIG.apiKey);
    model = genAI.getGenerativeModel({
      model: AI_CONFIG.model,
      generationConfig: { temperature: AI_CONFIG.temperature },
    });
    logger.info("AI model initialized", { model: AI_CONFIG.model, temperature: AI_CONFIG.temperature });
  }
  return model;
}

// Prompt template
const promptTemplate = `
Bạn là một trợ lý ảo chuyên nghiệp chuyên chấm điểm các bài làm Word và PowerPoint dựa trên một bộ tiêu chí và dữ liệu cấu trúc file đã được phân tích.

Dựa vào hai phần thông tin dưới đây:
1. ### TIÊU CHÍ CHẤM ĐIỂM ###
2. ### DỮ LIỆU BÀI NỘP DẠNG JSON ###

Hãy thực hiện các yêu cầu sau:
1.  Duyệt qua từng mục trong [TIÊU CHÍ CHẤM ĐIỂM].
2.  Đối chiếu từng tiêu chí với thông tin có trong [DỮ LIỆU BÀI NỘP DẠNG JSON].
3.  Cho điểm cho từng tiêu chí một cách hợp lý và đưa ra một lời giải thích ngắn gọn, súc tích tại sao lại cho điểm như vậy.
4.  **Tổng điểm tối đa (totalMaxScore) luôn là 10. Hãy phân bổ điểm cho các tiêu chí sao cho tổng maxScore của tất cả tiêu chí đúng bằng 10.**

QUAN TRỌNG: Vui lòng trả về kết quả dưới dạng một đối tượng JSON duy nhất, nằm trong một khối mã markdown (\`\`\`json ... \`\`\`). Không có bất kỳ văn bản giải thích nào khác bên ngoài khối mã JSON. Cấu trúc JSON phải như sau:

{
  "totalAchievedScore": <tổng điểm đạt được>,
  "totalMaxScore": 10,
  "details": [
    {
      "criterion": "<tên tiêu chí>",
      "maxScore": <điểm tối đa của tiêu chí>,
      "achievedScore": <điểm đạt được>,
      "reason": "<lý do chấm điểm>"
    }
  ]
}

---
### TIÊU CHÍ CHẤM ĐIỂM ###
{rubric_text_placeholder}

---
### DỮ LIỆU BÀI NỘP DẠNG JSON ###
{submission_json_placeholder}
`;

/**
 * Thực hiện retry cho một async function
 */
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number, 
  delayMs: number
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`);
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
}

/**
 * Trích xuất JSON từ phản hồi AI
 */
function extractJsonFromAiResponse(text: string): string {
  // More robust fence matching (handles \r\n and optional spaces)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && typeof jsonMatch[1] === 'string') {
    return jsonMatch[1].trim();
  }
  const jsonStartIndex = text.indexOf('{');
  const jsonEndIndex = text.lastIndexOf('}');
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    return text.substring(jsonStartIndex, jsonEndIndex + 1).trim();
  }
  return text.trim();
}

/**
 * Xác thực kết quả JSON có đúng cấu trúc không
 */
function validateGradingResult(result: any): result is GradingResult {
  return (
    result &&
    typeof result.totalAchievedScore === 'number' &&
    typeof result.totalMaxScore === 'number' &&
    Array.isArray(result.details) &&
    result.details.every((detail: any) => 
      typeof detail.criterion === 'string' &&
      typeof detail.maxScore === 'number' &&
      typeof detail.achievedScore === 'number' &&
      typeof detail.reason === 'string'
    )
  );
}

/**
 * Xác thực và điều chỉnh kết quả JSON để đảm bảo tính nhất quán của điểm
 */
function validateAndCorrectGradingResult(result: any): GradingResult {
  if (!validateGradingResult(result)) {
    logger.error("Invalid grading result structure", { result });
    throw new Error("AI returned invalid grading result structure");
  }

  // Clamp/normalize each detail
  result.details = result.details.map((d: GradingDetail) => {
    const max = Number.isFinite(d.maxScore) ? d.maxScore : 0;
    let achieved = Number.isFinite(d.achievedScore) ? d.achievedScore : 0;
    // clamp achieved to [0, max]
    achieved = Math.max(0, Math.min(max, achieved));
    // round to 2 decimals
    achieved = Math.round(achieved * 100) / 100;
    return { ...d, maxScore: max, achievedScore: achieved };
  });

  // Recalculate totals
  const recalculatedTotalScore = result.details.reduce(
    (sum: number, detail: GradingDetail) => sum + detail.achievedScore,
    0
  );
  const sumMaxScore = result.details.reduce(
    (sum: number, detail: GradingDetail) => sum + detail.maxScore,
    0
  );

  // Round totals
  const roundedRecalculated = Math.round(recalculatedTotalScore * 100) / 100;
  const roundedOriginal = Math.round(result.totalAchievedScore * 100) / 100;

  if (roundedRecalculated !== roundedOriginal) {
    logger.warn("Inconsistent total score detected", {
      original: result.totalAchievedScore,
      recalculated: recalculatedTotalScore,
    });
    result.totalAchievedScore = roundedRecalculated;
  }

  // Ensure totalMaxScore reflects declared design (AI is instructed to use 10)
  if (typeof result.totalMaxScore !== 'number' || result.totalMaxScore !== 10) {
    logger.warn("totalMaxScore adjusted to 10", {
      original: result.totalMaxScore,
      sumMaxScore,
    });
    result.totalMaxScore = 10;
  }

  return result;
}

/**
 * Chấm điểm bài nộp sử dụng AI
 * @param rubricText Văn bản mô tả tiêu chí chấm điểm
 * @param submissionJsonString Dữ liệu bài nộp dưới dạng chuỗi JSON
 * @returns Kết quả chấm điểm
 */
export async function gradeSubmissionWithAI(
  rubricText: string,
  submissionJsonString: string
): Promise<GradingResult> {
  const prompt = promptTemplate
    .replace('{rubric_text_placeholder}', rubricText)
    .replace('{submission_json_placeholder}', submissionJsonString);

  logger.debug("AI Prompt", {
    promptLength: prompt.length,
    rubricLength: rubricText.length,
    submissionLength: submissionJsonString.length,
  });

  try {
    // Use lazy model init
    const result = await withRetry<GenerateContentResult>(
      () => getModel().generateContent(prompt),
      AI_CONFIG.maxRetries,
      AI_CONFIG.retryDelayMs
    );

    const response = await result.response;
    const text = await response.text();

    logger.info("Received AI response", { responseLength: text.length });

    const jsonString = extractJsonFromAiResponse(text);

    try {
      const parsedResult = JSON.parse(jsonString);
      const validatedResult = validateAndCorrectGradingResult(parsedResult);
      return validatedResult;
    } catch (parseError) {
      logger.error("Failed to parse AI response as JSON", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        jsonPreview: jsonString.slice(0, 300),
      });
      throw new Error("AI response is not valid JSON");
    }
  } catch (error) {
    logger.error("AI grading failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      `Không thể nhận được phản hồi hợp lệ từ AI: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}