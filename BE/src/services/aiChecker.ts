import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Khởi tạo model với API key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash-lite", generationConfig: { temperature: 0 } });

// 2. prompt chi tiết
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

export async function gradeSubmissionWithAI(rubricText: string, submissionJsonString: string): Promise<any> {
  // 3. Xây dựng prompt hoàn chỉnh bằng cách thay thế các placeholder
  const prompt = promptTemplate
    .replace('{rubric_text_placeholder}', rubricText)
    .replace('{submission_json_placeholder}', submissionJsonString);


  try {
    // 4. Gọi API của Google AI để tạo nội dung
    console.log("Đang gửi yêu cầu đến AI...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text(); 
    console.log("Đã nhận phản hồi từ AI.");

    // 5. Trích xuất chuỗi JSON từ phản hồi của AI
    // AI thường trả về JSON trong một khối mã markdown, ví dụ: ```json ... ```
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch && typeof jsonMatch[1] === 'string' ? jsonMatch[1] : text;

    // 6. Parse và trả về kết quả
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Lỗi khi gọi Google AI API:", error);
    throw new Error("Không thể nhận được phản hồi hợp lệ từ AI.");
  }
}