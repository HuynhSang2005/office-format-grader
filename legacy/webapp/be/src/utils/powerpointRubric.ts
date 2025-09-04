import type { RubricCriterion } from "../types/grading.types";
import { convertJsonRubricToTypescript, defaultRubric } from "./rubricConverter";
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

// Khởi tạo với giá trị mặc định
export let powerpointRubric: RubricCriterion[] = [...defaultRubric];

// Event emitter để thông báo khi rubric được cập nhật
export const rubricEvents = new EventEmitter();

// Hàm để cập nhật rubric từ file JSON
export async function updateRubricFromJson(): Promise<void> {
  try {
    const updatedRubric = await convertJsonRubricToTypescript();
    const oldRubric = [...powerpointRubric];
    powerpointRubric = updatedRubric;
    console.log("PowerPoint rubric updated from JSON file successfully");
    
    // Phát sự kiện cập nhật, truyền cả rubric cũ và mới
    rubricEvents.emit('rubric-updated', {
      oldRubric,
      newRubric: updatedRubric
    });
  } catch (error) {
    console.error("Failed to update PowerPoint rubric from JSON:", error);
  }
}

/**
 * Theo dõi thay đổi file JSON và cập nhật khi có thay đổi
 */
export function watchRubricFile(): void {
  try {
    const rubricPath = path.resolve(__dirname, '../shared/rubric.json');
    
    // Kiểm tra xem file tồn tại không
    if (!fs.existsSync(rubricPath)) {
      console.warn(`Rubric file not found at ${rubricPath}`);
      return;
    }
    
    // Để tránh cập nhật nhiều lần cho cùng một thay đổi (some systems emit multiple events)
    let debounceTimeout: NodeJS.Timeout | null = null;
    const debounceTime = 300; // 300ms debounce
    
    // Theo dõi thay đổi
    console.log(`Watching for changes in rubric file at ${rubricPath}`);
    fs.watch(rubricPath, async (eventType) => {
      if (eventType === 'change') {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        
        debounceTimeout = setTimeout(async () => {
          console.log("Rubric file changed, updating...");
          try {
            await updateRubricFromJson();
          } catch (err) {
            console.error("Failed to update rubric after file change:", err);
          }
        }, debounceTime);
      }
    });
  } catch (error) {
    console.error("Error setting up file watcher:", error);
  }
}

// Cập nhật rubric khi module được load
updateRubricFromJson().catch(err => {
  console.error("Initial rubric update failed:", err);
});

// Bắt đầu theo dõi file
try {
  watchRubricFile();
} catch (err) {
  console.error("Failed to set up rubric file watcher:", err);
}

/**
 * Lấy rubric mới nhất từ bộ nhớ cache
 * @returns Rubric hiện tại
 */
export function getRubric(): RubricCriterion[] {
  return [...powerpointRubric];
}

/**
 * Lấy rubric mới nhất từ file JSON hoặc từ bộ nhớ cache
 * @returns Promise với rubric mới nhất
 */
export async function getLatestRubric(): Promise<RubricCriterion[]> {
  try {
    // Thử lấy từ JSON trực tiếp
    return await convertJsonRubricToTypescript();
  } catch (error) {
    // Fallback về phiên bản đã cached
    console.warn("Using cached rubric due to error:", error);
    return powerpointRubric;
  }
}

/**
 * Tìm tiêu chí theo ID
 * @param criterionId ID của tiêu chí cần tìm
 * @returns Tiêu chí tìm thấy hoặc undefined nếu không tìm thấy
 */
export function findCriterionById(criterionId: string): RubricCriterion | undefined {
  return powerpointRubric.find(c => c.id === criterionId);
}

/**
 * Đăng ký callback khi rubric thay đổi
 * @param callback Hàm callback được gọi khi rubric thay đổi
 * @returns Hàm để hủy đăng ký
 */
export function onRubricUpdated(
  callback: (data: { oldRubric: RubricCriterion[], newRubric: RubricCriterion[] }) => void
): () => void {
  rubricEvents.on('rubric-updated', callback);
  
  // Trả về hàm để hủy đăng ký
  return () => {
    rubricEvents.off('rubric-updated', callback);
  };
}
