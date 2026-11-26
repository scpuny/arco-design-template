import { ref } from 'vue';
import { getUnreadCount } from '@/api/message';

// 跨组件共享的「站内信未读数」单例：顶栏角标与消息盒子共用，避免重复拉取。
const unread = ref(0);

export function useMessageUnread() {
  async function refresh(channel = 'IN_APP') {
    try {
      const { data } = await getUnreadCount(channel);
      unread.value = data?.count ?? 0;
    } catch {
      unread.value = 0;
    }
  }
  return { unread, refresh };
}
