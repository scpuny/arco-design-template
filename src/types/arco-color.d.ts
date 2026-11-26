// @arco-design/color 官方暂无 TS 声明，此处补充
declare module '@arco-design/color' {
  export interface GenerateOptions {
    list?: boolean;
    dark?: boolean;
    index?: number;
  }
  export function generate(color: string, options?: GenerateOptions): string | string[];
  export function getRgbStr(color: string): string;
  export function getPresetColors(): Record<string, { light: string; dark: string }>;
}