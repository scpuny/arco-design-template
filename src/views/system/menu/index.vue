<template>
  <div>
    <a-typography-title :heading="5" style="margin: 0 0 16px">
      {{ $t('menu.system.menu') }}
    </a-typography-title>

    <a-card :bordered="false">
      <div class="menu-toolbar">
        <a-space>
          <a-button type="primary" @click="openCreate()">
            <template #icon><icon-plus /></template>新增顶级菜单
          </a-button>
          <a-button @click="load">
            <template #icon><icon-refresh /></template>刷新
          </a-button>
        </a-space>
      </div>

      <a-table
        :data="tree"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :tree="true"
        :tree-props="{ children: 'children' }"
        v-model:expanded-keys="expandedKeys"
      >
        <template #columns>
          <a-table-column title="菜单名称" :width="240">
            <template #cell="{ record }">
              <a-space>
                <component :is="record.icon || 'icon-menu'"></component>
                <span>{{ record.name }}</span>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="标识" data-index="code" :width="200" />
          <a-table-column title="类型" :width="100" align="center">
            <template #cell="{ record }">
              <a-tag :color="typeColor(record.type)" size="small">{{ typeLabel(record.type) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="路由" data-index="path" :width="180" />
          <a-table-column title="排序" data-index="sort" :width="80" align="center" />
          <a-table-column title="状态" :width="90" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.status === '启用' ? 'green' : 'gray'">{{ record.status }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="220" align="center" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-link @click="openCreate(record.id)">{{ hasChildren(record.id) ? '新增子菜单' : '新增' }}</a-link>
                <a-link @click="openEdit(record)">编辑</a-link>
                <a-popconfirm content="确定删除该菜单？" @ok="remove(record.id)" :disabled="hasChildren(record.id)">
                  <a-link status="danger">删除</a-link>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- 增改抽屉 -->
    <a-drawer
      :visible="drawerVisible"
      :width="480"
      :title="editingId ? '编辑菜单' : '新增菜单'"
      :mask-closable="false"
      @cancel="drawerVisible = false"
      @before-ok="save"
    >
      <a-form :model="draft" layout="vertical" ref="formRef">
        <a-form-item label="上级菜单">
          <a-tree-select
            v-model="draft.parentId"
            :data="parentTree"
            :field-names="{ key: 'id', title: 'name', children: 'children' }"
            allow-search
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="菜单类型" field="type">
          <a-radio-group v-model="draft.type">
            <a-radio value="directory">目录</a-radio>
            <a-radio value="menu">菜单</a-radio>
            <a-radio value="button">按钮</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="名称" field="name" :rules="{ required: true, message: '请输入名称' }">
          <a-input v-model="draft.name" placeholder="请输入名称" />
        </a-form-item>
        <a-form-item label="标识 code" field="code" :rules="{ required: true, message: '请输入 code' }">
          <a-input v-model="draft.code" placeholder="如 system.menu" />
        </a-form-item>
        <a-form-item v-if="draft.type !== 'button'" label="路由 path">
          <a-input v-model="draft.path" placeholder="如 /system/menu" />
        </a-form-item>
        <a-form-item v-if="draft.type !== 'button'" label="图标">
          <a-input v-model="draft.icon" placeholder="Arco 图标名，如 icon-user" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model="draft.sort" :min="0" style="width: 120px" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model="draft.status">
            <a-radio value="启用">启用</a-radio>
            <a-radio value="停用">停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    createMenu,
    deleteMenu,
    listMenus,
    updateMenu,
    type MenuNode,
    type MenuType,
  } from '@/api/menu';

  const loading = ref(false);
  const flat = ref<MenuNode[]>([]);
  const expandedKeys = ref<number[]>([]);
  const drawerVisible = ref(false);
  const editingId = ref<number | null>(null);
  const formRef = ref();

  interface TreeItem extends MenuNode {
    children?: TreeItem[];
  }
  const tree = computed<any[]>(() => buildTree(flat.value));

  const draft = reactive({
    parentId: 0,
    type: 'menu' as MenuType,
    name: '',
    code: '',
    path: '',
    icon: '',
    sort: 1,
    status: '启用' as '启用' | '停用',
  });

  function buildTree(list: MenuNode[]): TreeItem[] {
    const map = new Map<number, TreeItem>();
    list.forEach((n) => map.set(n.id, { ...n, children: [] }));
    const roots: TreeItem[] = [];
    list.forEach((n) => {
      const item = map.get(n.id)!;
      const parent = map.get(n.parentId);
      if (parent && n.parentId !== 0) parent.children!.push(item);
      else roots.push(item);
    });
    const sortFn = (a: TreeItem, b: TreeItem) => a.sort - b.sort;
    const sortEach = (arr: TreeItem[]): void =>
      arr.sort(sortFn).forEach((c) => c.children && c.children.length && sortEach(c.children));
    sortEach(roots);
    return roots;
  }

  /** 用于「上级菜单」选择器：编辑时不能选到自己或后代 */
  const parentTree = computed<any[]>(() => {
    const base = buildTree(flat.value);
    if (editingId.value == null) return base;
    const prune = (arr: TreeItem[]): TreeItem[] =>
      arr
        .filter((n) => n.id !== editingId.value)
        .map((n) => ({ ...n, children: prune(n.children || []) }));
    return prune(base);
  });

  function hasChildren(id: number) {
    return flat.value.some((m) => m.parentId === id);
  }

  function typeLabel(type: MenuType) {
    return type === 'directory' ? '目录' : type === 'button' ? '按钮' : '菜单';
  }
  function typeColor(type: MenuType) {
    return type === 'directory' ? 'arcoblue' : type === 'button' ? 'orangered' : 'green';
  }

  async function load() {
    loading.value = true;
    try {
      flat.value = await listMenus();
      // 默认展开所有「有子节点」的行（用户仍可手动折叠）
      const parentIds = new Set(flat.value.filter((m) => flat.value.some((c) => c.parentId === m.id)).map((m) => m.id));
      expandedKeys.value = [...parentIds];
    } finally {
      loading.value = false;
    }
  }

  function openCreate(parentId = 0) {
    editingId.value = null;
    Object.assign(draft, { parentId, type: 'menu', name: '', code: '', path: '', icon: '', sort: 1, status: '启用' });
    drawerVisible.value = true;
  }

  function openEdit(record: MenuNode) {
    editingId.value = record.id;
    Object.assign(draft, {
      parentId: record.parentId,
      type: record.type,
      name: record.name,
      code: record.code,
      path: record.path,
      icon: record.icon,
      sort: record.sort,
      status: record.status,
    });
    drawerVisible.value = true;
  }

  async function save() {
    if (!draft.name.trim() || !draft.code.trim()) {
      Message.warning('名称与 code 必填');
      return false;
    }
    const payload = {
      parentId: draft.parentId,
      type: draft.type,
      name: draft.name.trim(),
      code: draft.code.trim(),
      path: draft.type === 'button' ? '' : draft.path.trim(),
      icon: draft.type === 'button' ? '' : draft.icon.trim(),
      sort: draft.sort,
      status: draft.status,
    };
    try {
      if (editingId.value) {
        await updateMenu(editingId.value, payload);
      } else {
        await createMenu(payload);
      }
      drawerVisible.value = false;
      Message.success('已保存');
      await load();
      return true;
    } catch {
      Message.error('保存失败');
      return false;
    }
  }

  async function remove(id: number) {
    try {
      await deleteMenu(id);
      Message.success('已删除');
      await load();
    } catch {
      /* 拦截器已提示 */
    }
  }

  onMounted(load);
</script>

<style scoped lang="less">
  .menu-toolbar {
    margin-bottom: 12px;
  }

  :deep(.arco-table-tr-expand-icon) {
    color: var(--color-text-3);
  }
</style>
