import type { RouteRecordNormalized } from 'vue-router';

export interface AppState {
  theme: string;
  colorWeak: boolean;
  navbar: boolean;
  menu: boolean;
  /** @deprecated 由 menuMode 取代，仅兼容旧配置读取 */
  topMenu: boolean;
  /**
   * 菜单模式（取值见 config/settings.json 与 config/apps.ts）：
   * - `side` 左侧单栏（全量菜单树在左侧）
   * - `mix`  混合菜单（顶部应用导航 + 左侧当前应用菜单）—— 默认
   * - `top`  纯顶部（全部菜单横向在顶部，不渲染左侧）
   * 注：声明为 string 以兼容 JSON 配置导入的字面量类型宽化。
   */
  menuMode: string;
  hideMenu: boolean;
  menuCollapse: boolean;
  footer: boolean;
  themeColor: string;
  menuWidth: number;
  globalSettings: boolean;
  device: string;
  tabBar: boolean;
  menuFromServer: boolean;
  serverMenu: RouteRecordNormalized[];
  [key: string]: unknown;
}
