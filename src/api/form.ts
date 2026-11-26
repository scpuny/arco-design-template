import axios from 'axios';

/**
 * 表单页接口 —— 全部由 mock 提供。接真实后端时实现同名端点即可，页面零改动。
 */
export interface FormDetailPair {
  label: string;
  value: string;
  /** 值为强调色（如「已到账」「已认证」）时指定 tone，详情页按语义色渲染 */
  tone?: 'success' | 'primary' | 'warning' | 'danger';
}
export interface FormDetailRecord {
  id: number;
  name: string;
  gender: string;
  city: string;
  birthday: string;
}
export interface FormDetail {
  /** 基本信息：label-value 对（详情页按参考以两列对排布） */
  basic: FormDetailPair[];
  /** 其它信息：label-value 对 */
  other: FormDetailPair[];
  /** 表格信息 */
  records: FormDetailRecord[];
}

export function getFormDetail() {
  return axios.get<FormDetail>('/api/form/detail').then((r) => r.data);
}
