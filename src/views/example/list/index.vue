<template>
  <div class="example-list">
    <a-card :bordered="false">
      <template #title>
        <a-space>
          <span>示例列表</span>
          <a-tag color="arcoblue">Mock 接口 · /api/examples</a-tag>
        </a-space>
      </template>
      <template #extra>
        <a-space>
          <a-input
            v-model="keyword"
            placeholder="搜索名称"
            allow-clear
            style="width: 200px"
          >
            <template #prefix><icon-search /></template>
          </a-input>
          <a-button type="primary" @click="openCreate">
            <template #icon><icon-plus /></template>新建
          </a-button>
        </a-space>
      </template>

      <!-- ★ Arco a-table 的列定义必须放在 #columns 具名插槽内 -->
      <a-table
        :data="filteredRows"
        :loading="loading"
        :pagination="{ pageSize: 8 }"
        row-key="id"
      >
        <template #columns>
          <a-table-column title="名称" data-index="name" />
          <a-table-column title="编码" data-index="code" />
          <a-table-column title="状态" data-index="status" :width="120">
            <template #cell="{ record }">
              <a-tag :color="record.status === '启用' ? 'green' : 'gray'">
                {{ record.status }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="更新时间" data-index="updatedAt" />
          <a-table-column title="操作" :width="160">
            <template #cell="{ record }">
              <a-space>
                <a-link @click="openEdit(record)">编辑</a-link>
                <a-popconfirm title="确定删除？" @confirm="remove(record.id)">
                  <a-link status="danger">删除</a-link>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      :title="editingId ? '编辑' : '新建'"
      @ok="save"
      @cancel="modalVisible = false"
    >
      <a-form :model="draft" layout="vertical">
        <a-form-item label="名称" required>
          <a-input v-model="draft.name" placeholder="请输入名称" />
        </a-form-item>
        <a-form-item label="编码" required>
          <a-input v-model="draft.code" placeholder="请输入编码" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model="draft.status">
            <a-radio>启用</a-radio>
            <a-radio>停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import {
    listExamples,
    createExample,
    updateExample,
    deleteExample,
  } from '@/api/example';
  import type { ExampleRow as Row } from '@/api/example';

  const rows = ref<Row[]>([]);
  const loading = ref(false);
  const keyword = ref('');
  const filteredRows = computed(() =>
    rows.value.filter(
      (r) =>
        !keyword.value ||
        r.name.includes(keyword.value) ||
        r.code.toLowerCase().includes(keyword.value.toLowerCase())
    )
  );

  async function load() {
    loading.value = true;
    try {
      rows.value = await listExamples();
    } catch {
      rows.value = [];
    } finally {
      loading.value = false;
    }
  }
  onMounted(load);

  const modalVisible = ref(false);
  const editingId = ref<number | null>(null);
  const draft = reactive({ name: '', code: '', status: '启用' as Row['status'] });

  function resetDraft() {
    draft.name = '';
    draft.code = '';
    draft.status = '启用';
  }

  function openCreate() {
    editingId.value = null;
    resetDraft();
    modalVisible.value = true;
  }

  function openEdit(record: Row) {
    editingId.value = record.id;
    Object.assign(draft, {
      name: record.name,
      code: record.code,
      status: record.status,
    });
    modalVisible.value = true;
  }

  async function save() {
    if (!draft.name.trim() || !draft.code.trim()) {
      Message.warning('名称与编码不能为空');
      return;
    }
    const payload = {
      name: draft.name.trim(),
      code: draft.code.trim(),
      status: draft.status,
    };
    try {
      if (editingId.value) {
        await updateExample(editingId.value, payload);
      } else {
        await createExample(payload);
      }
      modalVisible.value = false;
      Message.success('已保存');
      await load();
    } catch {
      /* 请求拦截器已给出全局提示 */
    }
  }

  async function remove(id: number) {
    try {
      await deleteExample(id);
      Message.success('已删除');
      await load();
    } catch {
      /* 请求拦截器已给出全局提示 */
    }
  }
</script>

<style scoped lang="less">
  .example-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
