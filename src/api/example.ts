import axios from 'axios';

/**
 * 示例 CRUD 接口 —— 演示「业务页面 → API 层 → mock adapter」的完整链路。
 * 接真实后端时只需实现同名端点，本文件与页面均不需要改动。
 */
export interface ExampleRow {
  id: number;
  name: string;
  code: string;
  status: '启用' | '停用';
  updatedAt: string;
}

export function listExamples() {
  return axios.get<ExampleRow[]>('/api/examples').then((r) => r.data);
}

export function createExample(data: Omit<ExampleRow, 'id' | 'updatedAt'>) {
  return axios.post<ExampleRow>('/api/examples', data).then((r) => r.data);
}

export function updateExample(
  id: number,
  data: Omit<ExampleRow, 'id' | 'updatedAt'>
) {
  return axios.put<ExampleRow>(`/api/examples/${id}`, data).then((r) => r.data);
}

export function deleteExample(id: number) {
  return axios.delete(`/api/examples/${id}`);
}
