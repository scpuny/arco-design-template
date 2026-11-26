export interface TagProps {
  title: string;
  name: string;
  fullPath: string;
  query?: any;
  ignoreCache?: boolean;
  /** 页签图标（Arco 图标名，如 icon-dashboard）；为空时页签不显示图标 */
  icon?: string;
}

export interface TabBarState {
  tagList: TagProps[];
  cacheTabList: Set<string>;
}
