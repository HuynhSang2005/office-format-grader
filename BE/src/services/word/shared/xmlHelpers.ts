// Shared XML helpers for Word service

import { parseStringPromise } from 'xml2js';

export async function parseXmlString(xml: string): Promise<any> {
  return parseStringPromise(xml);
}
