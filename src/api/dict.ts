import axios from 'axios';
import { appConfig } from '@/config/app-config';

/** 字典项（与后端 DictService.DictOption 对齐）。 */
export interface DictOption {
  /** 存储值：业务表落库的就是它 */
  itemCode: string;
  /** 展示文案 */
  itemLabel: string;
  /** Arco 语义色名（green / orange / red …），可能为 null */
  tagColor: string | null;
  sort: number;
  enabled: boolean;
  builtin: boolean;
}

/** 应用标识（sys_app.code），默认取自 app-config。 */
export const DEFAULT_DICT_APP: string = appConfig.dictApp;

/**
 * 拉取字典选项（APP 优先、GLOBAL 兜底）。
 *
 * 走 `/api/dicts/**` 而不是 `/api/admin/dicts/**`：前者只要登录即可读，
 * 后者需要 dict:view 权限——业务表单的下拉不该要求管理权限。
 */
export async function fetchDictOptions(
  code: string,
  app = DEFAULT_DICT_APP
): Promise<DictOption[]> {
  const { data } = await axios.get<DictOption[]>('/api/dicts/options', {
    params: { app, code },
  });
  return data ?? [];
}

/** 批量拉取：{ dictCode: options }，一次往返拿完表单需要的全部词表。 */
export async function fetchDictOptionsBatch(
  codes: string[],
  app = DEFAULT_DICT_APP
): Promise<Record<string, DictOption[]>> {
  if (!codes.length) return {};
  // 后端收的是 List<String> code（?code=a&code=b）；
  // axios 默认把数组序列化成 code[]=a，Spring 接不到，这里手拼重复参数名。
  const qs = codes.map((c) => `code=${encodeURIComponent(c)}`).join('&');
  const { data } = await axios.get<Record<string, DictOption[]>>(
    `/api/dicts/options/batch?app=${encodeURIComponent(app)}&${qs}`
  );
  return data ?? {};
}
