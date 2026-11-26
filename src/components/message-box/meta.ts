import type { Component } from 'vue';
import {
  IconFile,
  IconSettings,
  IconStamp,
} from '@arco-design/web-vue/es/icon';

/**
 * 消息分类的展示元数据（图标 / 文案 / 配色）。
 *
 * <p>分类码由后端各业务域自由定义（approval / system / 业务自定义 …），
 * 前端不能硬编码一份穷举表来「认识」它们，所以这里做「已知映射 + 前缀兜底」：
 * 已知分类给精准图标，其它分类统一走兜底，
 * 完全陌生的分类也不至于渲染成空白 —— 显式降级成「通用消息」。
 *
 * <p>配色一律用 Arco 主题变量（`rgb(var(--blue-6))`），暗色主题下会自动适配，
 * 不写死十六进制色值。
 */
export interface CategoryMeta {
  key: string;
  label: string;
  icon: Component;
  /** 图标前景色 */
  color: string;
  /** 图标底底色（浅色块） */
  bg: string;
}

const KNOWN: Record<string, CategoryMeta> = {
  approval: {
    key: 'approval',
    label: '审批',
    icon: IconStamp,
    color: 'rgb(var(--arcoblue-6))',
    bg: 'rgb(var(--arcoblue-1))',
  },
  system: {
    key: 'system',
    label: '系统',
    icon: IconSettings,
    color: 'rgb(var(--gray-7))',
    bg: 'var(--color-fill-2)',
  },
};

const FALLBACK: CategoryMeta = {
  key: '',
  label: '通用消息',
  icon: IconFile,
  color: 'rgb(var(--gray-7))',
  bg: 'var(--color-fill-2)',
};

/** 分类码 → 展示元数据。未知分类不返回 null，而是降级成通用消息。 */
export function catMeta(key: string | null | undefined): CategoryMeta {
  if (!key) return FALLBACK;
  const hit = KNOWN[key];
  if (hit) return hit;
  return { ...FALLBACK, key, label: key };
}

/**
 * 时间展示：近的给相对时间，远的给日期。
 *
 * <p>消息列表里「2026/11/9 09:13:04」这种全量时间戳信息密度太低，
 * 而只给「2 分钟前」又会让昨天的消息失去锚点，所以分段处理。
 */
export function relTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return hm;

  const yesterday = new Date(now.getTime() - 86_400_000);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `昨天 ${hm}`;

  if (d.getFullYear() === now.getFullYear()) {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
