<template>
  <a-card :bordered="false" class="crud-card">
    <div class="crud-toolbar">
      <a-space wrap>
        <a-input
          v-model="keyword"
          :placeholder="searchPlaceholder"
          allow-clear
          style="width: 240px"
          @press-enter="reload"
          @clear="reload"
        >
          <template #prefix><icon-search /></template>
        </a-input>
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          {{ $t('crud.create') }}
        </a-button>
        <a-button @click="reload">
          <template #icon><icon-refresh /></template>
          {{ $t('crud.refresh') }}
        </a-button>
      </a-space>
    </div>

    <a-table
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      :scroll="{ x: 900 }"
      @page-change="onPageChange"
    >
      <template #columns>
        <a-table-column
          v-for="col in columns"
          :key="col.dataIndex"
          :title="col.title"
          :data-index="col.dataIndex"
          :width="col.width"
          :align="col.align"
        >
          <template v-if="col.tag" #cell="{ record }">
            <a-tag :color="tagColor(record[col.dataIndex])">
              {{ record[col.dataIndex] }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column :title="$t('crud.operation')" :width="160" fixed="right" align="center">
          <template #cell="{ record }">
            <a-space>
              <a-link @click="openEdit(record)">{{ $t('crud.edit') }}</a-link>
              <a-popconfirm :content="$t('crud.deleteConfirm')" @ok="remove(record.id)">
                <a-link status="danger">{{ $t('crud.delete') }}</a-link>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <a-modal
      v-model:visible="modalVisible"
      :title="editingId ? $t('crud.edit') : $t('crud.create')"
      :confirm-loading="saving"
      @ok="save"
      @cancel="resetDraft"
    >
      <a-form :model="draft" layout="vertical" ref="formRef" :rules="rules">
        <a-form-item
          v-for="field in fields"
          :key="field.key"
          :field="field.key"
          :label="field.label"
          :rules="field.required ? [{ required: true, message: `${field.label}不能为空` }] : undefined"
        >
          <a-select
            v-if="field.type === 'select'"
            v-model="draft[field.key]"
            :placeholder="`请选择${field.label}`"
            allow-clear
          >
            <a-option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</a-option>
          </a-select>
          <a-input-number
            v-else-if="field.type === 'number'"
            v-model="draft[field.key]"
            :min="1"
            style="width: 100%"
          />
          <a-textarea
            v-else-if="field.type === 'textarea'"
            v-model="draft[field.key]"
            :placeholder="`请输入${field.label}`"
            :auto-size="{ minRows: 3, maxRows: 6 }"
          />
          <a-switch
            v-else-if="field.type === 'switch'"
            v-model="draft[field.key]"
          />
          <a-input
            v-else
            v-model="draft[field.key]"
            :placeholder="`请输入${field.label}`"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import axios from 'axios';

  export interface CrudColumn {
    title: string;
    dataIndex: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    /** 值以彩色标签展示 */
    tag?: boolean;
  }

  export interface CrudField {
    key: string;
    label: string;
    type?: 'input' | 'select' | 'number' | 'textarea' | 'switch';
    options?: string[];
    required?: boolean;
  }

  const props = defineProps<{
    endpoint: string;
    columns: CrudColumn[];
    fields: CrudField[];
    searchPlaceholder?: string;
  }>();

  interface Row {
    id: number;
    [key: string]: any;
  }

  const rows = ref<Row[]>([]);
  const keyword = ref('');
  const loading = ref(false);
  const saving = ref(false);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const modalVisible = ref(false);
  const editingId = ref<number | null>(null);
  const draft = reactive<Record<string, any>>({});
  const formRef = ref<FormInstance>();
  const rules = computed(() => ({}));

  const pagination = computed(() => ({
    current: page.value,
    pageSize: pageSize.value,
    total: total.value,
    showTotal: true,
  }));

  function tagColor(value: unknown) {
    if (value === '启用' || value === true || value === '是') return 'green';
    if (value === '停用' || value === false || value === '否') return 'red';
    return 'blue';
  }

  async function reload() {
    loading.value = true;
    try {
      const res = await axios.get<any>(props.endpoint, {
        params: { keyword: keyword.value, page: page.value - 1, size: pageSize.value },
      });
      const data = res.data;
      // 兼容两种分页协议：{content,totalElements} 与裸数组
      rows.value = Array.isArray(data) ? data : data.content || [];
      total.value = Array.isArray(data) ? data.length : data.totalElements || 0;
    } finally {
      loading.value = false;
    }
  }

  function onPageChange(next: number) {
    page.value = next;
    reload();
  }

  function resetDraft() {
    editingId.value = null;
    Object.keys(draft).forEach((key) => delete draft[key]);
    props.fields.forEach((field) => {
      draft[field.key] = field.type === 'switch' ? true : field.type === 'number' ? 1 : '';
    });
    modalVisible.value = false;
    formRef.value?.resetFields();
  }

  function openCreate() {
    resetDraft();
    modalVisible.value = true;
  }

  function openEdit(record: Row) {
    resetDraft();
    editingId.value = record.id;
    props.fields.forEach((field) => {
      draft[field.key] = record[field.key] ?? (field.type === 'switch' ? true : '');
    });
    modalVisible.value = true;
  }

  async function save() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (valid === false) return;
    saving.value = true;
    try {
      if (editingId.value) {
        await axios.put(`${props.endpoint}/${editingId.value}`, { ...draft });
      } else {
        await axios.post(props.endpoint, { ...draft });
      }
      Message.success('保存成功');
      modalVisible.value = false;
      await reload();
    } finally {
      saving.value = false;
    }
  }

  async function remove(id: number) {
    await axios.delete(`${props.endpoint}/${id}`);
    Message.success('删除成功');
    if (rows.value.length === 1 && page.value > 1) page.value -= 1;
    await reload();
  }

  onMounted(reload);
  defineExpose({ reload });
</script>

<style scoped lang="less">
  .crud-card {
    min-height: 420px;
  }

  .crud-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }
</style>
