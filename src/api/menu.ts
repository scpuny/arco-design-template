import axios from 'axios';

/**
 * 菜单管理接口 —— 全部由 mock 提供（平铺节点，前端组装树）。
 * 接真实后端时实现同名端点即可，页面零改动。
 */
export type MenuType = 'directory' | 'menu' | 'button';

export interface MenuNode {
  id: number;
  parentId: number;
  name: string;
  code: string;
  type: MenuType;
  path: string;
  icon: string;
  sort: number;
  status: '启用' | '停用';
}

export function listMenus() {
  return axios.get<MenuNode[]>('/api/system/menus').then((r) => r.data);
}

export function createMenu(data: Omit<MenuNode, 'id'>) {
  return axios.post<MenuNode>('/api/system/menus', data).then((r) => r.data);
}

export function updateMenu(id: number, data: Partial<MenuNode>) {
  return axios.put<MenuNode>(`/api/system/menus/${id}`, data).then((r) => r.data);
}

export function deleteMenu(id: number) {
  return axios.delete(`/api/system/menus/${id}`);
}
