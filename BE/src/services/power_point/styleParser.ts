import { parseStringPromise } from "xml2js";
import type { PlaceholderStyle, SlideLayoutData } from "../../types/power_point/powerpointStyles";

// helper để parse một node style (ví dụ: <p:titleStyle> hoặc <p:bodyStyle>)
function parseTextStyleNode(styleNode: any): PlaceholderStyle[] {

    return [];
}

export async function parseMasterOrLayout(zip: any, filePath: string): Promise<SlideLayoutData> {
    const xmlRaw = zip.getEntry(filePath)?.getData().toString("utf-8");
    if (!xmlRaw) return { styles: [] };

    const xml = await parseStringPromise(xmlRaw);
    const styles: PlaceholderStyle[] = [];

    // Tìm định nghĩa style trong file master hoặc layout
    const txStyles = xml['p:sldMaster']?.['p:txStyles']?.[0] || xml['p:sldLayout']?.['p:txStyles']?.[0];

    if (txStyles) {
        if (txStyles['p:titleStyle']) {
        }
        if (txStyles['p:bodyStyle']) {
        }
        if (txStyles['p:otherStyle']) {
        }
    }

    return { styles };
}