import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import type { SmartArtData, SmartArtNode } from "../../../types/power_point/powerpointFormat.types";

export async function parseSmartArt(zip: AdmZip, dataPath: string): Promise<SmartArtData | undefined> {
    const dataXmlRaw = zip.getEntry(dataPath)?.getData().toString("utf-8");
    if (!dataXmlRaw) return undefined;

    const dataXml = await parseStringPromise(dataXmlRaw);

    // Dữ liệu của SmartArt là một danh sách phẳng các "điểm" (pt)
    const pointList = dataXml['dgm:dataModel']?.['dgm:ptLst']?.[0]?.['dgm:pt'] || [];
    if (pointList.length === 0) return { nodes: [] };

    const rootNodes: SmartArtNode[] = [];
    const nodeMap = new Map<string, SmartArtNode>(); // Dùng để tra cứu node cha
    const parentStack: SmartArtNode[] = []; // Dùng để theo dõi node cha ở các cấp độ

    for (const pt of pointList) {
        // Trích xuất text và cấp độ (level)
        const text = pt['dgm:t']?.[0]?.['a:p']?.[0]?.['a:r']?.[0]?.['a:t']?.[0] || '';
        const level = parseInt(pt['dgm:prSet']?.[0]?.$?.lvl || '0', 10);

        const newNode: SmartArtNode = { text, children: [] };

        // Logic xây dựng lại cây dựa trên cấp độ
        if (level === 0) {
            rootNodes.push(newNode);
            parentStack.length = 0; // Reset stack
            parentStack[0] = newNode;
        } else {
            const parent = parentStack[level - 1];
            if (parent) {
                parent.children.push(newNode);
            } else {
                // Trường hợp bất thường, coi như là node gốc
                rootNodes.push(newNode);
            }
            parentStack[level] = newNode;
        }
    }

    return { nodes: rootNodes };
}