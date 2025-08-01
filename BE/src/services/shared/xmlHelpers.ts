import { parseStringPromise } from 'xml2js';

export async function parseXmlString(xml: string): Promise<any> {
  return parseStringPromise(xml);
}
