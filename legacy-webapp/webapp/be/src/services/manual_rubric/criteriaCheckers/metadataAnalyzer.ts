import type { FormattedSlide } from "../../../types/power_point";

/**
 * Trích xuất metadata cơ bản từ slides và thông tin file
 * Hàm này được giữ lại cho tương lai nếu cần sử dụng
 */
export function extractAdvancedMetadata(slides: FormattedSlide[], fileInfo: any): any {
    // Trả về metadata cơ bản
    return {
        createdBy: fileInfo?.properties?.creator,
        lastModifiedBy: fileInfo?.properties?.lastModifiedBy,
        company: fileInfo?.properties?.company,
        creationDate: fileInfo?.properties?.created,
        lastModifiedDate: fileInfo?.properties?.modified,
        totalEditingTime: fileInfo?.properties?.totalTime
    };
}