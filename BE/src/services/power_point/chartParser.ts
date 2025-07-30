import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import * as XLSX from 'xlsx';
import path from 'node:path';
import type { ChartData, ChartSeries } from "../../types/power_point/chart.types";

// Hàm helper để đọc dữ liệu từ file excel nhúng
function getExcelDataFromReference(workbook: XLSX.WorkBook, formula: string | undefined): any[] {
    // Nếu formula không tồn tại, trả về mảng rỗng
    if (!formula) return [];
    // formula có dạng 'Sheet1!$A$2:$A$5'
    const [sheetName, range] = formula.split('!');
    if (!sheetName || !range) return [];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];

    // Dùng SheetJS để decode range và lấy dữ liệu
    const decodedRange = XLSX.utils.decode_range(range);
    const data = [];
    for (let R = decodedRange.s.r; R <= decodedRange.e.r; ++R) {
        for (let C = decodedRange.s.c; C <= decodedRange.e.c; ++C) {
            const cellAddress = { c: C, r: R };
            const cellRef = XLSX.utils.encode_cell(cellAddress);
            const cell = worksheet[cellRef];
            data.push(cell ? cell.v : undefined);
        }
    }
    return data;
}


export async function parseChart(zip: AdmZip, chartPath: string): Promise<ChartData | undefined> {
    // 1. Đọc file chartN.xml
    const chartXmlRaw = zip.getEntry(chartPath)?.getData().toString("utf-8");
    if (!chartXmlRaw) return undefined;
    const chartXml = await parseStringPromise(chartXmlRaw);

    const plotArea = chartXml['c:chartSpace']['c:chart'][0]['c:plotArea'][0];
    const chartType = Object.keys(plotArea).find(k => k.endsWith('Chart'))?.replace('c:', '') || 'unknown';
    const title = chartXml['c:chartSpace']['c:chart'][0]['c:title']?.[0]?.['c:tx']?.[0]?.['c:rich']?.[0]?.['a:p']?.[0]?.['a:r']?.[0]?.['a:t']?.[0];

    // 2. Tìm file Excel nhúng
    const chartRelsPath = `ppt/charts/_rels/${path.basename(chartPath)}.rels`;
    const chartRelsXmlRaw = zip.getEntry(chartRelsPath)?.getData().toString('utf-8');
    if (!chartRelsXmlRaw) return undefined; // Không có dữ liệu nhúng

    const chartRelsXml = await parseStringPromise(chartRelsXmlRaw);
    const excelRel = chartRelsXml.Relationships.Relationship.find(
        (r: any) => r.$.Type.endsWith('/spreadsheetml/2006/main')
    );
    if (!excelRel) return undefined;

    // 3. Đọc file Excel từ bộ đệm (buffer)
    const excelPath = `ppt/embeddings/${path.basename(excelRel.$.Target)}`;
    const excelBuffer = zip.getEntry(excelPath)?.getData();
    if(!excelBuffer) return undefined;

    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });

    // 4. Phân tích các chuỗi dữ liệu (series)
    const seriesData: ChartSeries[] = [];
    const seriesElements = plotArea[Object.keys(plotArea).find(k => k.endsWith('Chart')) as string][0]['c:ser'];

    for (const ser of seriesElements) {
        const seriesNameFormula = ser['c:tx']?.[0]?.['c:strRef']?.[0]?.['c:f']?.[0];
        const categoriesFormula = ser['c:cat']?.[0]?.['c:strRef']?.[0]?.['c:f']?.[0];
        const valuesFormula = ser['c:val']?.[0]?.['c:numRef']?.[0]?.['c:f']?.[0];

        if (categoriesFormula && valuesFormula) {
            seriesData.push({
                name: seriesNameFormula ? getExcelDataFromReference(workbook, seriesNameFormula)[0] : 'Series',
                categories: getExcelDataFromReference(workbook, categoriesFormula),
                values: getExcelDataFromReference(workbook, valuesFormula),
            });
        }
    }

    return { type: chartType, title, series: seriesData };
}