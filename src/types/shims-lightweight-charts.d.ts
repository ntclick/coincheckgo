declare module 'lightweight-charts' {
  export type IChartApi = any;
  export type ISeriesApi<T = any> = any;
  export type CandlestickData = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  };
  export function createChart(container: HTMLElement, options?: any): IChartApi;
}


