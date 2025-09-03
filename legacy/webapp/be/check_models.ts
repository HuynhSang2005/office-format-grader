import dotenv from 'dotenv';
dotenv.config();

async function listAvailableModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Lỗi: Biến môi trường GOOGLE_API_KEY chưa được thiết lập.");
    return;
  }

  // Endpoint của Google AI để liệt kê các model
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log("Đang gọi đến Google AI API để lấy danh sách model...");
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      models: Array<{
        name: string;
        displayName?: string;
        description?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    console.log("\nDanh sách các model AI có sẵn hỗ trợ 'generateContent':");
    console.log("=========================================================");

    for (const model of data.models) {
      if (model.supportedGenerationMethods?.includes("generateContent")) {
        console.log(`- Tên Model (sử dụng trong code): ${model.name}`);
        console.log(`  - Tên hiển thị: ${model.displayName}`);
        console.log(`  - Mô tả: ${model.description}`);
        console.log("---------------------------------------------------------");
      }
    }
  } catch (error) {
    console.error("Không thể lấy danh sách model:", error);
  }
}

listAvailableModels();