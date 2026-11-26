import { computed, reactive, ref, type ComputedRef, type Ref } from 'vue';
import {
  fetchDictOptionsBatch,
  DEFAULT_DICT_APP,
  type DictOption,
} from '@/api/dict';

/**
 * 数据字典前端缓存层。
 *
 * <p>设计要点：
 * <ol>
 *   <li><b>全局缓存</b>：同一个字典只请求一次，多个组件共享，避免每个下拉各发一次请求；</li>
 *   <li><b>同步读取</b>：{@link dictLabel} / {@link dictTagColor} 是同步函数——渲染表格时
 *       不可能为每个单元格 await；缓存未命中就<b>回退原值</b>，字典到位后响应式自动刷新；</li>
 *   <li><b>code 与中文都能命中</b>：存量数据可能是中文文案，两者都做索引，
 *       这样"半迁移"状态下也不会显示空白。</li>
 * </ol>
 */

/** key = `${app}|${dictCode}` */
const store = reactive<Record<string, DictOption[]>>({});
const requested = new Set<string>();
let inflight: Promise<void> | null = null;

function keyOf(app: string, code: string): string {
  return `${app}|${code}`;
}

/**
 * 预加载字典（幂等，重复调用不会重复请求）。
 *
 * 页面/组件挂载时调用即可，渲染用 {@link dictLabel} 同步取。
 */
export function ensureDicts(codes: string[], app = DEFAULT_DICT_APP): void {
  const missing = codes.filter((c) => !requested.has(keyOf(app, c)));
  if (!missing.length) return;
  missing.forEach((c) => requested.add(keyOf(app, c)));
  const task = fetchDictOptionsBatch(missing, app)
    .then((map) => {
      for (const [code, options] of Object.entries(map)) {
        store[keyOf(app, code)] = options ?? [];
      }
    })
    .catch(() => {
      // 拉不到就留空：调用方回退原值，不至于白屏
    });
  inflight = inflight ? inflight.then(() => task) : task;
}

/** 字典是否已加载（需要区分"空字典"和"没加载"时用）。 */
export function dictReady(code: string, app = DEFAULT_DICT_APP): boolean {
  return Array.isArray(store[keyOf(app, code)]);
}

/** 字典选项（响应式；未加载时为空数组）。 */
export function useDictOptions(
  code: string,
  app = DEFAULT_DICT_APP
): ComputedRef<DictOption[]> {
  ensureDicts([code], app);
  return computed(() => store[keyOf(app, code)] ?? []);
}

/** 下拉用：{ label, value }，只含启用项。 */
export function useDictSelectOptions(
  code: string,
  app = DEFAULT_DICT_APP
): ComputedRef<{ label: string; value: string }[]> {
  const options = useDictOptions(code, app);
  return computed(() =>
    options.value
      .filter((o) => o.enabled)
      .map((o) => ({ label: o.itemLabel, value: o.itemCode }))
  );
}

/** 找到字典项（itemCode 或 itemLabel 命中都算）。 */
function findOption(
  dictCode: string,
  value: string,
  app: string
): DictOption | undefined {
  const list = store[keyOf(app, dictCode)];
  if (!list || !value) return undefined;
  return (
    list.find((o) => o.itemCode === value) ??
    list.find((o) => o.itemLabel === value)
  );
}

/**
 * 翻译：存储值 → 展示文案。
 *
 * 未命中（字典没加载、或值确实不在词表里）返回原值，保证界面永不空白。
 */
export function dictLabel(
  dictCode: string,
  value?: string | null,
  app = DEFAULT_DICT_APP
): string {
  if (!value) return '';
  return findOption(dictCode, value, app)?.itemLabel ?? value;
}

/**
 * 标签配色：取字典项的 tag_color。
 *
 * 未命中返回 null，调用方自行兜底（默认兜 'gray'）。
 */
export function dictTagColor(
  dictCode: string,
  value?: string | null,
  app = DEFAULT_DICT_APP
): string | null {
  if (!value) return null;
  return findOption(dictCode, value, app)?.tagColor ?? null;
}

/** 一次拿到「文案 + 配色」，表格与详情的状态 tag 都用它。 */
export function dictTag(
  dictCode: string,
  value?: string | null,
  app = DEFAULT_DICT_APP
): { label: string; color: string } {
  return {
    label: dictLabel(dictCode, value, app),
    color: dictTagColor(dictCode, value, app) ?? 'gray',
  };
}

/** 已加载字典数量（调试/自测用）。 */
export function dictCacheSize(): number {
  return Object.keys(store).length;
}

/** 清空缓存（切换账号/权限变化时用）。 */
export function resetDictCache(): void {
  Object.keys(store).forEach((k) => delete store[k]);
  requested.clear();
  inflight = null;
}

/** 等待在途请求完成（自测用）。 */
export function dictsSettled(): Promise<void> {
  return inflight ?? Promise.resolve();
}

export type { DictOption };
export { DEFAULT_DICT_APP };
export type DictRef = Ref<DictOption[]>;
