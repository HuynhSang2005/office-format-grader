/**
 * @file dashboard.types.ts
 * @description TypeScript types for dashboard components
 * @author Nguyễn Huỳnh Sang
 */

export interface ChartDataPoint {
  date: string
  [key: string]: number | string
}

export interface BarChartDataPoint {
  'Loại tệp': string
  'Số lượng': number
}