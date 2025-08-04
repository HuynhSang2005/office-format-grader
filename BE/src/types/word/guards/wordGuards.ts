import type { Paragraph, Table, TextRun } from "../wordFormat.types";

export function isTextRun(run: any): run is TextRun {
    return run.type === 'text';
}

export function isParagraph(block: any): block is Paragraph {
    return 'runs' in block;
}

export function isTable(block: any): block is Table {
    return block.type === 'table';
}