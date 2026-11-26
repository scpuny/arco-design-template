<template>
  <div>
    <FormPageHeader
      title="表单详情"
      description="表单除了提交数据，有时也用于显示只读信息。"
    />

    <a-card v-if="!detail" :bordered="false" :loading="true" style="min-height: 200px" />

    <template v-else>
      <!-- 基本信息 / 其它信息：分组块内 label-value 对（两列排布，状态/认证按语义色） -->
      <a-card
        v-for="block in [
          { key: 'basic', title: '基本信息', pairs: detail.basic },
          { key: 'other', title: '其它信息', pairs: detail.other },
        ]"
        :key="block.key"
        :bordered="false"
        class="detail-block"
      >
        <div class="detail-block__title">{{ block.title }}</div>
        <a-row :gutter="[24, 18]">
          <a-col v-for="pair in block.pairs" :key="pair.label" :span="12">
            <div class="kv">
              <span class="kv__label">{{ pair.label }}</span>
              <span class="kv__value" :class="{ [`is-${pair.tone}`]: pair.tone }">
                {{ pair.value }}
              </span>
            </div>
          </a-col>
        </a-row>
      </a-card>

      <!-- 表格信息 -->
      <a-card :bordered="false" class="detail-block">
        <div class="detail-block__title">表格信息</div>
        <a-table :data="detail.records" :pagination="false" row-key="id">
          <template #columns>
            <a-table-column title="姓名" data-index="name" />
            <a-table-column title="性别" data-index="gender" :width="90" align="center" />
            <a-table-column title="城市" data-index="city" :width="110" align="center" />
            <a-table-column title="生日" data-index="birthday" :width="130" align="center" />
            <a-table-column title="操作" :width="160" align="center">
              <template #cell="{ record }">
                <a-space>
                  <a-button
                    size="small"
                    status="danger"
                    @click="removeRow(record)"
                  >
                    删除
                  </a-button>
                  <a-button
                    type="primary"
                    size="small"
                    @click="viewRow(record)"
                  >
                    查看
                  </a-button>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-card>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { getFormDetail, type FormDetail, type FormDetailRecord } from '@/api/form';

  const detail = ref<FormDetail | null>(null);

  async function load() {
    detail.value = await getFormDetail();
  }

  function removeRow(record: FormDetailRecord) {
    if (!detail.value) return;
    detail.value.records = detail.value.records.filter((r) => r.id !== record.id);
    Message.success(`已删除「${record.name}」`);
  }

  function viewRow(record: FormDetailRecord) {
    Message.info(`${record.name} · ${record.city} · ${record.birthday}`);
  }

  load();
</script>

<style scoped lang="less">
  .detail-block {
    margin-bottom: 16px;
    border-radius: 10px;

    &__title {
      font-weight: 600;
      font-size: 15px;
      color: var(--color-text-1);
      margin-bottom: 18px;
    }
  }

  .kv {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;

    &__label {
      flex: 0 0 84px;
      color: var(--color-text-3);
    }

    &__value {
      flex: 1;
      color: var(--color-text-1);

      &.is-success {
        color: rgb(var(--success-6));
        font-weight: 500;
      }

      &.is-primary {
        color: rgb(var(--primary-6));
      }
    }
  }
</style>
