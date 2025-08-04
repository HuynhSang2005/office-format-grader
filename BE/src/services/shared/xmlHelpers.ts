
import { parseStringPromise } from 'xml2js';
import type { ParserOptions } from 'xml2js';

const defaultXmlOptions: ParserOptions = {
  explicitChildren: true,
  preserveChildrenOrder: true,
  explicitRoot: false, 
};

export async function parseXmlString(xmlString: string): Promise<any> {
  return parseStringPromise(xmlString, defaultXmlOptions);
}