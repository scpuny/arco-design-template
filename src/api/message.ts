import axios from 'axios';

export interface MessageItem {
  id: number; // 投递/接收人记录 id
  messageId: number;
  channelCode: string;
  category: string;
  title: string;
  content: string;
  sender: string | null;
  priority: string;
  bizId: string | null;
  link: string | null;
  status: string; // PENDING/DELIVERED/FAILED/READ
  read: boolean;
  createdAt: string | null;
  readAt: string | null;
}

export interface MessagePage {
  content: MessageItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface MessagePageParams {
  channel?: string;
  category?: string;
  read?: boolean;
  page?: number;
  size?: number;
}

// 平台消息中心：对接真实后端 /api/messages（事件驱动 + 应用隔离）。PC 走 /api（原始响应体）。
export function queryMessagePage(params: MessagePageParams) {
  return axios.get<MessagePage>('/api/messages', { params });
}

export function getUnreadCount(channel = 'IN_APP') {
  return axios.get<{ count: number }>('/api/messages/unread-count', {
    params: { channel },
  });
}

/** 分类聚合：筛选项由数据反推，前端不维护分类清单。 */
export interface MessageCategoryStat {
  category: string;
  total: number;
  unread: number;
}

export function getMessageCategories(channel = 'IN_APP') {
  return axios.get<MessageCategoryStat[]>('/api/messages/categories', {
    params: { channel },
  });
}

export function markRead(ids: number[]) {
  return axios.post<{ count: number }>('/api/messages/read', { ids });
}

export function markReadAll(channel = 'IN_APP') {
  return axios.post<{ count: number }>('/api/messages/read-all', { channel });
}

// ---------------- M2 管理端：模板 / 配置 / 发送记录 ----------------

export interface MsgTemplateRow {
  id: number;
  code: string;
  appKey: string;
  name: string;
  category: string;
  titleTemplate: string;
  contentTemplate: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MsgTemplateRendered {
  title: string;
  content: string;
}

export function listMessageTemplates(appKey?: string) {
  return axios.get<MsgTemplateRow[]>('/api/admin/message-templates', {
    params: appKey ? { appKey } : {},
  }).then((r) => r.data);
}

export function getMessageTemplate(id: number) {
  return axios.get<MsgTemplateRow>(`/api/admin/message-templates/${id}`).then((r) => r.data);
}

export function createMessageTemplate(data: Partial<MsgTemplateRow>) {
  return axios.post<MsgTemplateRow>('/api/admin/message-templates', data).then((r) => r.data);
}

export function updateMessageTemplate(id: number, data: Partial<MsgTemplateRow>) {
  return axios.put<MsgTemplateRow>(`/api/admin/message-templates/${id}`, data).then((r) => r.data);
}

export function deleteMessageTemplate(id: number) {
  return axios.delete(`/api/admin/message-templates/${id}`).then((r) => r.data);
}

export function previewMessageTemplate(id: number, params: Record<string, unknown>) {
  return axios.post<MsgTemplateRendered>(`/api/admin/message-templates/${id}/preview`, params)
    .then((r) => r.data);
}

export interface MessageRecord {
  id: number;
  appKey: string;
  category: string;
  title: string;
  content: string;
  sender: string | null;
  priority: string;
  bizId: string | null;
  link: string | null;
  status: string;
  createdAt: string;
}

export interface MessageRecordPage {
  content: MessageRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export function listMessageRecords(params: {
  appKey?: string;
  category?: string;
  page?: number;
  size?: number;
}) {
  return axios.get<MessageRecordPage>('/api/admin/messages', { params }).then((r) => r.data);
}

export interface AdminSendRequest {
  appKey?: string;
  category?: string;
  title?: string;
  content?: string;
  sender?: string;
  priority?: string;
  bizId?: string;
  link?: string;
  channels?: string[];
  targets?: Array<{ type: string; id: string }>;
  templateCode?: string;
  params?: Record<string, unknown>;
}

export function sendAdminMessage(data: AdminSendRequest) {
  return axios.post<{ message: string }>('/api/admin/messages/send', data).then((r) => r.data);
}
