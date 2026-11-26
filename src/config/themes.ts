/**
 * 模板 主题系统 —— 声明式 CSS 变量方案（主题为「视觉方向」、明暗为「模式」双维度）
 *
 * 设计原则：
 *   1. 【主题 = Reasonix 基础视觉方向，明暗 = 模式，二者解耦】
 *      - ThemeDef 是一个「视觉方向」（graphite / aurora / slate / carbon / nocturne / amber），
 *        每个方向自带 light / dark 两套原色（tokens.light / tokens.dark）——即「明暗各给一套原色」。
 *      - 模式（mode）只有 light / dark；偏好（pref）为 system / light / dark。
 *      - 实际皮肤 = 视觉方向 + 模式 → `body[data-theme-adt="{key}-{mode}"]` 变量块。
 *   2. 【语义色模型 = Reasonix 官方基础方向（desktop/frontend/src/styles.css 的
 *      :root[data-theme-style="..."] 明暗两套原样迁移）】
 *      每套方向定义 15 个语义色 token（bg/bgSoft/bgElev/panel/sidebar/chat/workspace/
 *      workspaceFiles/border/borderSoft/fg/fgDim/fgFaint/accent/accentFg），由主题块统一转成：
 *      - Arco 品牌链（--primary / --arcoblue 1..10，用 @arco-design/color 按明暗生成）
 *      - Arco 中性链（--color-bg-1..5 / --color-border-1..4 / --color-text-1..4）
 *      - 四区域背景渐变（--adt-*-bg，由 token 推导）
 *      - 语义变量（--adt-t-*，供组件样式引用）
 *   3. 【切换 = 改属性】applyTheme 只设 body 的 data-theme-adt 与 arco-theme(dark)；
 *      所有变量块在模块加载时一次性预生成注入，切换不再运行时重算。
 *
 * 状态模型（localStorage）：
 *   - adt-mode         : 'system' | 'light' | 'dark'（明暗偏好）
 *   - adt-theme-light  : 亮色模式下最近使用的方向 key（直接切明暗时回滚到此）
 *   - adt-theme-dark   : 暗色模式下最近使用的方向 key
 *   规则：选择主题（方向）会更新「当前模式」对应的存储并立即应用；
 *        直接切换明暗使用「该模式」已存主题，无则使用 DEFAULT_THEME_KEY。
 */
import { reactive } from 'vue';

// @arco-design/color 无内置类型声明，这里补一个模块声明后导入 generate。
declare module '@arco-design/color' {
  export function generate(
    color: string,
    options?: { list?: boolean; dark?: boolean }
  ): string[];
}
import { generate } from '@arco-design/color';

export type ResolvedMode = 'light' | 'dark';
export type ModePref = 'system' | 'light' | 'dark';

/**
 * 一套「原色」：某模式下的语义色集合。
 * 语义与 Reasonix 基础方向 token 一一对应（styles.css data-theme-style 明暗两套迁移）：
 *   - bg / bgSoft / bgElev  ：底色三层（最深 → 浮起）
 *   - panel / sidebar / chat / workspace / workspaceFiles ：区域色
 *   - border / borderSoft   ：边框两层
 *   - fg / fgDim / fgFaint  ：文字三层
 *   - accent / accentFg     ：品牌主色 / 主色上的前景文字
 *   - ok / warn / err       ：状态色（成功 / 警告 / 危险），驱动 Arco 状态色链
 */
export interface SkinTokens {
  bg: string;
  bgSoft: string;
  bgElev: string;
  panel: string;
  sidebar: string;
  chat: string;
  workspace: string;
  workspaceFiles: string;
  border: string;
  borderSoft: string;
  fg: string;
  fgDim: string;
  fgFaint: string;
  accent: string;
  accentFg: string;
  ok: string;
  warn: string;
  err: string;
}

/** 一套「原色皮肤」：唯一的色源 = 语义 tokens（梯度全部由 tokens 推导，无人工调色） */
export interface Skin {
  tokens: SkinTokens;
}

/**
 * 主题 = 视觉方向（Reasonix 基础风格），自含 light / dark 两套原色。
 * 来自 Reasonix 桌面端 6 个基础方向：graphite / aurora / slate / carbon / nocturne / amber。
 */
export interface ThemeDef {
  key: string; // 方向标识，如 'graphite'
  name: string; // 中文名（如：石墨）
  en: string; // 英文名（如：Graphite）
  note: string; // 情感标签（如：利落）
  description: string; // 中文描述
  light: Skin;
  dark: Skin;
}

/** 默认方向：Reasonix 桌面默认 Graphite */
export const DEFAULT_THEME_KEY = 'graphite';

/**
 * 旧版色系 key → 新版 key 兼容映射（历史 localStorage 迁移）。
 * 按 Reasonix 官方主题包的 baseStyle 归并到 6 个基础视觉方向。
 */
const LEGACY_THEME_MAP: Record<string, string> = {
  blue: 'slate', // Arco 经典蓝 → 冷灰品牌蓝
  green: 'slate', // sage-breeze → slate
  sage: 'slate',
  purple: 'nocturne', // violet-starlight → nocturne
  violet: 'nocturne',
  orange: 'amber', // fortune-forge → amber
  fortune: 'amber',
  cyan: 'carbon', // cyan-stage → carbon
  spark: 'aurora', // spark-notebook → aurora
  crimson: 'graphite', // crimson-horizon → graphite
  rose: 'graphite', // rose-dawn → graphite
  noir: 'carbon', // noir-gold → carbon
};

/** 校验 key 是否可用，未知/旧 key 归一到当前色系 */
export function normalizeThemeKey(key: string | null): string {
  if (!key) return DEFAULT_THEME_KEY;
  if (LEGACY_THEME_MAP[key]) return LEGACY_THEME_MAP[key];
  if (THEMES.some((t) => t.key === key)) return key;
  return DEFAULT_THEME_KEY;
}

/**
 * 主题预设 —— 6 个 Reasonix 基础视觉方向，色值严格取自
 * Reasonix desktop/frontend/src/styles.css 的 :root[data-theme-style="..."] 明暗两套
 * （--bg/--bg-soft/--bg-elev/--surface/--sidebar-bg/--chat-bg/--workspace-preview-bg/
 *  --workspace-files-bg/--border/--border-soft/--fg/--fg-dim/--fg-faint/--accent/--accent-fg）。
 */
export const THEMES: ThemeDef[] = [
  {
    key: 'graphite',
    name: '石墨',
    en: 'Graphite',
    note: '利落',
    description: '纸面白配石墨文字与橙色强调，利落、克制，贴近编辑器工作台。',
    light: {
      tokens: {
        bg: '#f4f3ef',
        bgSoft: '#f0efe9',
        bgElev: '#ffffff',
        panel: '#ffffff',
        sidebar: '#ffffff',
        chat: '#f4f3ef',
        workspace: '#ffffff',
        workspaceFiles: '#ffffff',
        border: 'rgba(20,22,28,0.12)',
        borderSoft: 'rgba(20,22,28,0.08)',
        fg: '#16181d',
        fgDim: '#4a4d56',
        fgFaint: '#85888f',
        accent: '#ff5a2c',
        accentFg: '#ffffff',
        ok: '#1f9d57',
        warn: '#d98a1f',
        err: '#d83a2a',
      },
    },
    dark: {
      tokens: {
        bg: '#0c0d10',
        bgSoft: '#101115',
        bgElev: '#15161a',
        panel: '#15161a',
        sidebar: '#15161a',
        chat: '#0c0d10',
        workspace: '#101115',
        workspaceFiles: '#15161a',
        border: 'rgba(255,255,255,0.10)',
        borderSoft: 'rgba(255,255,255,0.07)',
        fg: '#f1f1ef',
        fgDim: '#a7a8ad',
        fgFaint: '#6c6e74',
        accent: '#ff6a3d',
        accentFg: '#0c0d10',
        ok: '#3ad17e',
        warn: '#e3a23a',
        err: '#f0573f',
      },
    },
  },
  {
    key: 'aurora',
    name: '柔雾极光',
    en: 'Aurora',
    note: '温润',
    description: '柔紫底色融合极光蓝绿，半透明面板与弹性圆角，更轻盈、有呼吸感。',
    light: {
      tokens: {
        bg: '#f6f3fb',
        bgSoft: '#efeaf8',
        bgElev: '#fdfcff',
        panel: '#fdfcff',
        sidebar: '#fdfcff',
        chat: '#f6f3fb',
        workspace: '#fdfcff',
        workspaceFiles: '#fdfcff',
        border: 'rgba(40,22,84,0.09)',
        borderSoft: 'rgba(40,22,84,0.065)',
        fg: '#1c1830',
        fgDim: '#574f70',
        fgFaint: '#8c84a2',
        accent: '#6d5efc',
        accentFg: '#ffffff',
        ok: '#1fb877',
        warn: '#e8a33d',
        err: '#e5604d',
      },
    },
    dark: {
      tokens: {
        bg: '#0e0d18',
        bgSoft: '#121120',
        bgElev: '#17162a',
        panel: '#17162a',
        sidebar: '#17162a',
        chat: '#0e0d18',
        workspace: '#121120',
        workspaceFiles: '#17162a',
        border: 'rgba(255,255,255,0.07)',
        borderSoft: 'rgba(255,255,255,0.055)',
        fg: '#ecebf7',
        fgDim: '#a9a4c6',
        fgFaint: '#726c8c',
        accent: '#8b7cff',
        accentFg: '#0e0d18',
        ok: '#34d399',
        warn: '#f0b84e',
        err: '#f0795f',
      },
    },
  },
  {
    key: 'slate',
    name: '精炼',
    en: 'Slate',
    note: '原生',
    description: '冷灰工作台配品牌蓝，发丝边框清晰，适合高密度扫描与专业操作。',
    light: {
      tokens: {
        bg: '#f5f6f9',
        bgSoft: '#eef0f4',
        bgElev: '#ffffff',
        panel: '#ffffff',
        sidebar: '#f9f9f9',
        chat: '#f5f6f9',
        workspace: '#ffffff',
        workspaceFiles: '#ffffff',
        border: 'rgba(20,28,46,0.10)',
        borderSoft: 'rgba(20,28,46,0.07)',
        fg: '#15181f',
        fgDim: '#4a5160',
        fgFaint: '#828a99',
        accent: '#2f6fe0',
        accentFg: '#ffffff',
        ok: '#1f9d57',
        warn: '#d98a1f',
        err: '#d83a2a',
      },
    },
    dark: {
      tokens: {
        bg: '#0d0f12',
        bgSoft: '#0f1216',
        bgElev: '#15181d',
        panel: '#15181d',
        sidebar: '#15181d',
        chat: '#0d0f12',
        workspace: '#0f1216',
        workspaceFiles: '#15181d',
        border: 'rgba(255,255,255,0.08)',
        borderSoft: 'rgba(255,255,255,0.06)',
        fg: '#e7eaf0',
        fgDim: '#9aa2b1',
        fgFaint: '#646c7a',
        accent: '#4d8df6',
        accentFg: '#061129',
        ok: '#34d399',
        warn: '#f0b84e',
        err: '#f0795f',
      },
    },
  },
  {
    key: 'carbon',
    name: '深邃',
    en: 'Carbon',
    note: '高级',
    description: '暖炭黑与米灰表面配青绿强调，质感更厚、对比更足，适合长时间专注。',
    light: {
      tokens: {
        bg: '#f6f4f0',
        bgSoft: '#efece6',
        bgElev: '#ffffff',
        panel: '#ffffff',
        sidebar: '#ffffff',
        chat: '#f6f4f0',
        workspace: '#ffffff',
        workspaceFiles: '#ffffff',
        border: 'rgba(30,26,20,0.10)',
        borderSoft: 'rgba(30,26,20,0.07)',
        fg: '#1a1714',
        fgDim: '#544e46',
        fgFaint: '#8a8378',
        accent: '#0d9488',
        accentFg: '#ffffff',
        ok: '#1f9d57',
        warn: '#c47f1a',
        err: '#d83a2a',
      },
    },
    dark: {
      tokens: {
        bg: '#0e0d0c',
        bgSoft: '#100f0e',
        bgElev: '#171614',
        panel: '#171614',
        sidebar: '#171614',
        chat: '#0e0d0c',
        workspace: '#100f0e',
        workspaceFiles: '#171614',
        border: 'rgba(255,250,240,0.08)',
        borderSoft: 'rgba(255,250,240,0.06)',
        fg: '#ede9e3',
        fgDim: '#a59f95',
        fgFaint: '#6f6a61',
        accent: '#2dd4bf',
        accentFg: '#001a16',
        ok: '#34d399',
        warn: '#e3a23a',
        err: '#f0795f',
      },
    },
  },
  {
    key: 'nocturne',
    name: '柔和',
    en: 'Nocturne',
    note: '呼吸',
    description: '柔紫夜色和云白表面配大圆角留白，阅读更安静，节奏更舒缓。',
    light: {
      tokens: {
        bg: '#f6f5fb',
        bgSoft: '#efedf7',
        bgElev: '#fdfcff',
        panel: '#fdfcff',
        sidebar: '#fdfcff',
        chat: '#f6f5fb',
        workspace: '#fdfcff',
        workspaceFiles: '#fdfcff',
        border: 'rgba(40,30,80,0.09)',
        borderSoft: 'rgba(40,30,80,0.065)',
        fg: '#1b1830',
        fgDim: '#544f6e',
        fgFaint: '#8a85a0',
        accent: '#6366f1',
        accentFg: '#ffffff',
        ok: '#1fb877',
        warn: '#e8a33d',
        err: '#e5604d',
      },
    },
    dark: {
      tokens: {
        bg: '#101019',
        bgSoft: '#13131e',
        bgElev: '#191a27',
        panel: '#191a27',
        sidebar: '#191a27',
        chat: '#101019',
        workspace: '#13131e',
        workspaceFiles: '#191a27',
        border: 'rgba(255,255,255,0.08)',
        borderSoft: 'rgba(255,255,255,0.06)',
        fg: '#eceaf3',
        fgDim: '#a6a2bd',
        fgFaint: '#6e6a85',
        accent: '#818cf8',
        accentFg: '#0d1024',
        ok: '#34d399',
        warn: '#f0b84e',
        err: '#f0795f',
      },
    },
  },
  {
    key: 'amber',
    name: '琥珀',
    en: 'Amber',
    note: '暖阳',
    description: '暖橙强调色，明亮亲和（含深色变体）。',
    light: {
      tokens: {
        // Amber 官方仅覆盖 accent / sidebar，基面继承 :root 默认（styles.css light 全局）
        bg: '#f7f8fb',
        bgSoft: '#eef2f7',
        bgElev: '#ffffff',
        panel: '#ffffff',
        sidebar: '#f3f6fa',
        chat: '#ffffff',
        workspace: '#ffffff',
        workspaceFiles: '#f6f8fb',
        border: 'rgba(20,28,46,0.10)',
        borderSoft: 'rgba(20,28,46,0.07)',
        fg: '#111827',
        fgDim: '#4b5563',
        fgFaint: '#8a94a6',
        accent: '#dd5b28',
        accentFg: '#ffffff',
        ok: '#15803d',
        warn: '#b45309',
        err: '#dc2626',
      },
    },
    dark: {
      tokens: {
        // Amber 暗色仅覆盖 accent，基面继承 :root 默认（styles.css dark 全局）
        bg: '#090a0c',
        bgSoft: '#111319',
        bgElev: '#191b22',
        panel: '#191b22',
        sidebar: '#0c0e12',
        chat: '#090a0c',
        workspace: '#090a0c',
        workspaceFiles: '#111319',
        border: 'rgba(255,255,255,0.08)',
        borderSoft: 'rgba(255,255,255,0.06)',
        fg: '#f4f5f7',
        fgDim: '#c0c4cc',
        fgFaint: '#858b96',
        accent: '#d4632f',
        accentFg: '#1a0a04',
        ok: '#74b87a',
        warn: '#d9a441',
        err: '#e0696a',
      },
    },
  },
];

/** hex -> "r, g, b" RGB 分量串（Arco 变量值要求格式） */
function toRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/** 由 10 阶色板生成品牌变量：同时覆盖 --primary 与 --arcoblue 两条链 */
function brandVars(list: string[]): string {
  return list
    .map((c, i) => `--primary-${i + 1}: ${toRgb(c)}; --arcoblue-${i + 1}: ${toRgb(c)};`)
    .join(' ');
}

/** 由 10 阶色板生成状态色链变量（--success / --warning / --danger），Arco 组件按 rgb(var(--success-N)) 消费 */
function statusChainVars(color: string, cssPrefix: 'success' | 'warning' | 'danger', dark: boolean): string {
  const list = generate(color, { list: true, dark }) as string[];
  return list
    .map((c, i) => `--${cssPrefix}-${i + 1}: ${toRgb(c)};`)
    .join(' ');
}

/** hex 线性插值（t=0 => a，t=1 => b） */
function mixHex(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * 中性灰阶 --gray-1..10（Arco 大量组件直接引用）。
 * 跟随主题明暗：light 由 bgElev(浅) → fg(深)；dark 由 bg(深) → fg(亮)，纯灰无色彩漂移。
 */
function grayChainVars(t: SkinTokens, dark: boolean): string {
  const from = dark ? t.bg : t.bgElev;
  const to = dark ? t.fg : t.fg;
  const parts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const c = mixHex(from, to, (i + 1) / 12); // 1..10 落在 (0, 1) 区间，两端留安全余量
    parts.push(`--gray-${i + 1}: ${toRgb(c)};`);
  }
  return parts.join(' ');
}

/** 基础状态色板 --red / --green / --orange（部分组件直接引用，与状态链保持一致） */
function statusBaseChainVars(color: string, cssPrefix: 'red' | 'green' | 'orange', dark: boolean): string {
  const list = generate(color, { list: true, dark }) as string[];
  return list
    .map((c, i) => `--${cssPrefix}-${i + 1}: ${toRgb(c)};`)
    .join(' ');
}

/**
 * 将语义 token 转成「Arco 中性链」与「--adt-t-* 语义变量」，让全局组件跟随主题色系。
 * 参照 Reasonix：tokens 派生到完整的控制链（bg 层 / fill 悬浮层 / border / text / secondary / overlay），
 * 暗色下不再残留 Arco 默认死灰。
 */
function semanticVars(t: SkinTokens, mode: ResolvedMode): string {
  const dark = mode === 'dark';
  // fill 悬浮/填充层：亮色用黑半透，暗色用白半透（Reasonix fill 体系）
  const fill1 = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)';
  const fill2 = dark ? 'rgba(255,255,255,.09)' : t.bgSoft;
  const fill3 = dark ? 'rgba(255,255,255,.13)' : 'rgba(0,0,0,.07)';
  const fill4 = dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.10)';
  // 次级控件/弹层（Arco dark 默认 #3f3f3f/#313132 死灰 → 主题化）
  const secondary = dark ? t.bgElev : 'rgba(0,0,0,.04)';
  const overlay = dark ? t.bgElev : t.bgElev;
  const mask = dark ? 'rgba(0,0,0,.55)' : 'rgba(29,29,31,.6)';
  // 表格/Spin 加载蒙层单独走 spinMask：浅色主题下卡片为白底（panel/bgElev=#fff），
  // 用深灰蒙层会发黑割裂；改用与主题面一致的浅色半透明（亮=白底、暗=浮起底）。
  // 全屏弹窗遮罩 --color-mask-bg 仍用 mask（需要压暗内容，深一点才协调）。
  const spinMask = dark ? 'rgba(21,22,26,.62)' : 'rgba(255,255,255,.62)';
  // 卡片阴影（亮色轻盈、暗色厚重）+ 主题圆点描边（彩色圆点上的中性描边）
  const cardShadow = dark
    ? '0 1px 2px rgba(0,0,0,.5), 0 4px 12px rgba(0,0,0,.45)'
    : '0 1px 2px rgba(0,0,0,.03), 0 4px 12px rgba(0,0,0,.04)';
  const cardShadowHover = dark
    ? '0 2px 4px rgba(0,0,0,.55), 0 8px 24px rgba(0,0,0,.5)'
    : '0 2px 4px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)';
  return (
    `--color-bg-1: ${t.bg};` +
    `--color-bg-2: ${t.panel};` +
    `--color-bg-3: ${t.bgElev};` +
    `--color-bg-4: ${t.bgSoft};` +
    `--color-bg-5: ${t.bgElev};` +
    `--color-bg-white: ${t.bgElev};` +
    `--color-bg-popup: ${t.bgElev};` +
    `--color-fill-1: ${fill1};` +
    `--color-fill-2: ${fill2};` +
    `--color-fill-3: ${fill3};` +
    `--color-fill-4: ${fill4};` +
    `--color-border: ${t.border};` +
    `--color-border-1: ${t.borderSoft};` +
    `--color-border-2: ${t.border};` +
    `--color-border-3: ${t.border};` +
    `--color-border-4: ${t.border};` +
    // Arco 卡片头/抽屉头等组件直接用 --color-neutral-3 画分隔线，
    // 默认值 #c5c5c7 在浅色主题下太显眼；统一降到更淡的 borderSoft，
    // 暗色下也用主题自带的低对比边框，避免死灰硬线。
    `--color-neutral-3: ${t.borderSoft};` +
    `--color-text-1: ${t.fg};` +
    `--color-text-2: ${t.fgDim};` +
    `--color-text-3: ${t.fgFaint};` +
    `--color-text-4: ${t.fgFaint};` +
    `--color-secondary: ${secondary};` +
    `--color-secondary-hover: ${dark ? t.workspace : 'rgba(0,0,0,.08)'};` +
    `--color-secondary-active: ${dark ? t.bgSoft : 'rgba(0,0,0,.02)'};` +
    `--color-secondary-light: ${dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.05)'};` +
    `--color-secondary-light-hover: ${dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.08)'};` +
    `--color-secondary-light-active: ${dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.11)'};` +
    // Arco tooltip 的文字被硬编码成 #fff → 背景必须始终为深色。
    // 亮色：用深灰（等价 Arco 默认 rgb(var(--gray-10))，深浅方向正确）；
    // 暗色：用浮起面 bgElev（注意不可用 --gray-10——暗色下它是浅色，会造成白字白底隐形）。
    `--color-tooltip-bg: ${dark ? t.bgElev : 'rgb(var(--gray-10))'};` +
    `--color-menu-light-bg: ${t.bgElev};` +
    `--color-menu-dark-bg: ${t.bgElev};` +
    `--color-spin-layer-bg: ${spinMask};` +
    `--color-overlay-bg: ${overlay};` +
    `--color-mask-bg: ${mask};` +
    `${statusChainVars(t.ok, 'success', dark)} ` +
    `${statusChainVars(t.warn, 'warning', dark)} ` +
    `${statusChainVars(t.err, 'danger', dark)} ` +
    `${statusBaseChainVars(t.err, 'red', dark)} ` +
    `${statusBaseChainVars(t.ok, 'green', dark)} ` +
    `${statusBaseChainVars(t.warn, 'orange', dark)} ` +
    `${grayChainVars(t, dark)} ` +
    `--adt-t-bg: ${t.bg};` +
    `--adt-t-bgsoft: ${t.bgSoft};` +
    `--adt-t-bgelev: ${t.bgElev};` +
    `--adt-t-panel: ${t.panel};` +
    `--adt-t-sidebar: ${t.sidebar};` +
    `--adt-t-chat: ${t.chat};` +
    `--adt-t-border: ${t.border};` +
    `--adt-t-bordersoft: ${t.borderSoft};` +
    `--adt-t-fg: ${t.fg};` +
    `--adt-t-fgdim: ${t.fgDim};` +
    `--adt-t-fgfaint: ${t.fgFaint};` +
    `--adt-t-accent: ${t.accent};` +
    `--adt-t-accentfg: ${t.accentFg};` +
    `--adt-t-ok: ${t.ok};` +
    `--adt-t-warn: ${t.warn};` +
    `--adt-t-err: ${t.err};` +
    `--adt-t-card-shadow: ${cardShadow};` +
    `--adt-t-card-shadow-hover: ${cardShadowHover};` +
    `--adt-t-ring: rgba(255,255,255,.45);`
  );
}

/**
 * 四区域背景渐变 —— 全部由语义 tokens 推导（唯一色源 = Reasonix 色系，无人工调色）：
 *   content : bg → bgSoft（最底 → 次层）
 *   sider   : light = sidebar → bg（浅色同族）；dark = bgElev → bg（浮起 → 最底，配白字菜单）
 *   login   : accent → 同 hue 深端（恒用亮色板第 9 阶；Arco dark 色板后段是"高亮"色，不能当深端）
 *   navbar  : bgElev 纯色（不渐变，与浮起面一致）
 */
function deriveGradients(t: SkinTokens, mode: ResolvedMode): {
  sider: string;
  content: string;
  login: string;
  navbar: string;
} {
  const deep = generate(t.accent, { list: true, dark: false }) as string[];
  const deepEnd = deep[8] || t.accent;
  return {
    sider:
      mode === 'light'
        ? `linear-gradient(180deg, ${t.sidebar} 0%, ${t.bg} 100%)`
        : `linear-gradient(180deg, ${t.bgElev} 0%, ${t.bg} 100%)`,
    content: `linear-gradient(180deg, ${t.bg} 0%, ${t.bgSoft} 100%)`,
    login: `linear-gradient(135deg, ${t.accent} 0%, ${deepEnd} 100%)`,
    navbar: t.bgElev,
  };
}

/** 背景渐变变量（侧边栏 / 内容区 / 登录页 / 顶栏） */
function bgVars(g: { sider: string; content: string; login: string; navbar: string }): string {
  return (
    `--adt-sider-bg: ${g.sider};` +
    `--adt-content-bg: ${g.content};` +
    `--adt-login-bg: ${g.login};` +
    `--adt-navbar-bg: ${g.navbar};`
  );
}

/** 暗色模式侧边栏配色：深色品牌渐变 + 白字 + 白色系填充（原全局方案） */
const SIDER_DARK_VARS = `
  --color-menu-light-bg: transparent;
  --color-menu-light-text: rgba(255,255,255,.86);
  --color-menu-light-hover-bg: rgba(255,255,255,.12);
  --color-menu-light-hover-text: #fff;
  --color-menu-light-active-bg: rgba(255,255,255,.18);
  --color-menu-light-active-text: #fff;
  --color-menu-light-sub-menu-bg: rgba(0,0,0,.08);
  --color-text-1: #fff;
  --color-text-2: rgba(255,255,255,.86);
  --color-text-3: rgba(255,255,255,.64);
  --color-text-4: rgba(255,255,255,.4);
  --color-fill-1: rgba(255,255,255,.1);
  --color-fill-2: rgba(255,255,255,.14);
  --color-fill-3: rgba(255,255,255,.2);
  --color-bg-5: rgba(255,255,255,.18);
`;

/** 亮色模式侧边栏配色（随主题生成）：浅色底 + 主题深色文字 + 品牌色 hover/active */
function siderLightVars(t: SkinTokens): string {
  const a = toRgb(t.accent);
  return (
    `--color-menu-light-bg: transparent;` +
    `--color-menu-light-text: ${t.fg};` +
    `--color-menu-light-hover-bg: rgba(${a},.08);` +
    `--color-menu-light-hover-text: ${t.fg};` +
    `--color-menu-light-active-bg: rgba(${a},.14);` +
    `--color-menu-light-active-text: ${t.accent};` +
    `--color-menu-light-sub-menu-bg: rgba(${a},.05);` +
    `--color-text-1: ${t.fg};` +
    `--color-text-2: ${t.fgDim};` +
    `--color-text-3: ${t.fgFaint};` +
    `--color-text-4: ${t.fgFaint};` +
    `--color-fill-1: rgba(${a},.06);` +
    `--color-fill-2: rgba(${a},.10);` +
    `--color-fill-3: rgba(${a},.12);` +
    `--color-bg-5: rgba(${a},.12);`
  );
}

/**
 * 预生成【所有 视觉方向 × 明暗】的 CSS 变量声明块（模块加载时一次性执行）。
 * 每个皮肤一个 `body[data-theme-adt="{key}-{mode}"] { ... }` 块，切换时只改属性即可生效。
 */
function buildThemeStyleText(): string {
  const blocks: string[] = [];
  for (const t of THEMES) {
    const lightList = generate(t.light.tokens.accent, { list: true, dark: false }) as string[];
    const darkList = generate(t.dark.tokens.accent, { list: true, dark: true }) as string[];
    blocks.push(
      `body[data-theme-adt="${t.key}-light"]{${brandVars(lightList)} ${semanticVars(t.light.tokens, 'light')} ${bgVars(deriveGradients(t.light.tokens, 'light'))}}`
    );
    blocks.push(
      `body[data-theme-adt="${t.key}-light"] .layout-sider{${siderLightVars(t.light.tokens)}}`
    );
    blocks.push(
      `body[data-theme-adt="${t.key}-dark"]{${brandVars(darkList)} ${semanticVars(t.dark.tokens, 'dark')} ${bgVars(deriveGradients(t.dark.tokens, 'dark'))}}`
    );
    blocks.push(`body[data-theme-adt="${t.key}-dark"] .layout-sider{${SIDER_DARK_VARS}}`);
  }
  return blocks.join('\n');
}

let styleInjected = false;
function ensureThemeStyle() {
  if (styleInjected) return;
  const style = document.createElement('style');
  style.id = 'adt-theme-css';
  style.textContent = buildThemeStyleText();
  document.head.appendChild(style); // 在 Arco 样式表之后注入，品牌色优先级胜出
  styleInjected = true;
}

// ---------- 状态读写 ----------
const K_MODE = 'adt-mode';
const K_THEME_LIGHT = 'adt-theme-light';
const K_THEME_DARK = 'adt-theme-dark';

export function getModePref(): ModePref {
  const v = localStorage.getItem(K_MODE);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}
export function setModePref(pref: ModePref) {
  localStorage.setItem(K_MODE, pref);
}

/** 解析偏好为实际模式；system 跟随系统配色 */
export function resolveMode(pref: ModePref): ResolvedMode {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

/** 取某模式下已存的主题（方向）；无则默认主题（含旧 key 兼容） */
export function getThemeForMode(mode: ResolvedMode): string {
  const k = mode === 'dark' ? K_THEME_DARK : K_THEME_LIGHT;
  return normalizeThemeKey(localStorage.getItem(k));
}

export interface ThemeState {
  pref: ModePref;
  mode: ResolvedMode;
  themeKey: string;
}

export function getState(): ThemeState {
  const pref = getModePref();
  const mode = resolveMode(pref);
  return { pref, mode, themeKey: getThemeForMode(mode) };
}

/** 全局响应式主题状态，navbar / global-setting 共享，保证两处控件联动 */
export const themeState = reactive<ThemeState>(getState());

// ---------- 应用 / 切换 ----------
/**
 * 应用具体皮肤：设置 body 属性并持久化「当前模式」对应的主题。
 * - data-theme-adt="{key}-{mode}"：驱动品牌色板 / 中性链 / 背景渐变
 * - arco-theme=dark：仅暗色设置，激活 Arco 暗色容器
 */
export function applyTheme(themeKey: string, mode: ResolvedMode): ThemeState {
  const def = THEMES.find((t) => t.key === themeKey) || THEMES.find((t) => t.key === DEFAULT_THEME_KEY) || THEMES[0];
  ensureThemeStyle();
  const body = document.body;
  body.setAttribute('data-theme-adt', `${def.key}-${mode}`);
  if (mode === 'dark') {
    body.setAttribute('arco-theme', 'dark');
  } else {
    body.removeAttribute('arco-theme');
  }
  // 持久化：当前模式使用的主题（直接切明暗时回滚用）
  if (mode === 'dark') localStorage.setItem(K_THEME_DARK, def.key);
  else localStorage.setItem(K_THEME_LIGHT, def.key);
  localStorage.setItem('arco-theme', mode);
  localStorage.setItem('adt-theme', def.key); // 兼容旧 key
  // 同步响应式状态
  themeState.pref = getModePref();
  themeState.mode = mode;
  themeState.themeKey = def.key;
  return { pref: themeState.pref, mode, themeKey: def.key };
}

/** 切换明暗偏好（跟随系统 / 浅色 / 深色）。使用对应模式的已存主题，无则默认主题。 */
export function setMode(pref: ModePref): ThemeState {
  setModePref(pref);
  const mode = resolveMode(pref);
  const themeKey = getThemeForMode(mode);
  return applyTheme(themeKey, mode);
}

/** 选择主题（视觉方向）。仅更新「当前模式」下的主题并立即应用（明暗共用该方向的原色）。 */
export function selectTheme(themeKey: string): ThemeState {
  const mode = resolveMode(getModePref());
  return applyTheme(themeKey, mode);
}

/** 恢复持久化状态，返回应用的 state（main.ts 启动时调用） */
export function restoreTheme(): ThemeState {
  const { pref, mode, themeKey } = getState();
  setModePref(pref);
  return applyTheme(themeKey, mode);
}

/** 监听系统配色变化（仅当偏好为 system 时回应用），返回取消函数 */
export function watchSystemMode(cb: (mode: ResolvedMode) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    if (getModePref() === 'system') cb(e.matches ? 'dark' : 'light');
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

/** 取当前（或指定模式）的展示主色，供控件色点使用 */
export function currentColor(mode?: ResolvedMode): string {
  const def = THEMES.find((t) => t.key === themeState.themeKey) || THEMES[0];
  return def[mode || themeState.mode].tokens.accent;
}

/** 画廊卡片 accent 渐变（accent → 亮色板第 8 阶，对应 Reasonix accent-strong 方向） */
export function themeAccentGradient(t: SkinTokens): string {
  const deep = generate(t.accent, { list: true, dark: false }) as string[];
  return `linear-gradient(120deg, ${t.accent}, ${deep[7] || t.accent})`;
}