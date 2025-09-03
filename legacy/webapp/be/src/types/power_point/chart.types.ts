export interface ChartSeries {
  name: string;
  categories: (string | number)[];
  values: number[];
}

export interface ChartData {
  type: string; // 'bar', 'pie', 'line', etc.
  title?: string;
  series: ChartSeries[];
}