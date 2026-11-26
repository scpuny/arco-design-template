<template>
  <div>
    <FormPageHeader
      title="高级表单"
      description="当一次性填写大量数据时，可使用高级表单，根据自身情况选择是否使用 BasicForm 组件。以下布局支持自适应多组合（单页面）演示：Hi，你好！"
    />

    <a-form :model="form" :rules="rules" layout="vertical" ref="formRef" class="advanced-form">
      <template v-for="group in groups" :key="group.key">
        <a-card
          :bordered="false"
          class="adv-group"
          :class="{ 'is-active': activeGroup === group.key }"
          :body-style="{ paddingTop: group.key === activeGroup ? '0px' : '0px' }"
        >
          <div class="adv-group__head" @click="toggle(group.key)">
            <span class="adv-group__title">{{ group.title }}</span>
            <icon-up v-if="activeGroup === group.key" class="adv-group__caret" />
          </div>
          <div v-show="activeGroup === group.key" class="adv-group__body">
            <a-row :gutter="[20, 18]">
              <a-col v-for="field in group.fields" :key="field.field" :span="6">
                <a-form-item :field="field.field" :label="field.label">
                  <!-- 输入 -->
                  <a-input
                    v-if="field.control === undefined"
                    v-model="form[field.field]"
                    :placeholder="field.placeholder"
                    allow-clear
                  />
                  <!-- 下拉 -->
                  <a-select
                    v-else-if="field.control === 'select'"
                    v-model="form[field.field]"
                    :placeholder="field.placeholder"
                    allow-clear
                  >
                    <a-option
                      v-for="opt in field.options"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </a-option>
                  </a-select>
                  <!-- 日期 -->
                  <a-date-picker
                    v-else-if="field.control === 'date'"
                    v-model="form[field.field]"
                    show-time
                    :placeholder="field.placeholder"
                    style="width: 100%"
                  />
                  <!-- 单选 -->
                  <a-radio-group
                    v-else-if="field.control === 'radio'"
                    v-model="form[field.field]"
                  >
                    <a-radio v-for="opt in field.options" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </a-radio>
                  </a-radio-group>
                </a-form-item>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </template>

      <a-space class="adv-actions">
        <a-button type="primary" :loading="loading" @click="submit">提交</a-button>
        <a-button @click="reset">重置</a-button>
      </a-space>
    </a-form>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import axios from 'axios';
  import FormPageHeader from '../components/form-page-header.vue';

  interface AdvField {
    field: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    control?: 'select' | 'date' | 'radio';
    options?: { label: string; value: string }[];
  }

  interface AdvGroup {
    key: string;
    title: string;
    fields: AdvField[];
  }

  const groups: AdvGroup[] = [
    {
      key: 'booking',
      title: '预约信息',
      fields: [
        { field: 'name', label: '预约姓名', placeholder: '输入姓名', required: true },
        { field: 'phone', label: '预约号码', placeholder: '电话号码', required: true },
        { field: 'time', label: '预约时间', placeholder: '选择日期时间', control: 'date', required: true },
        {
          field: 'doctor',
          label: '预约医生',
          placeholder: '请选择预约的医生',
          control: 'select',
          required: true,
          options: [
            { label: '张伟医生', value: 'zhang' },
            { label: '李娜医生', value: 'li' },
          ],
        },
        {
          field: 'item',
          label: '预约事项',
          placeholder: '请选择预约事项',
          control: 'select',
          required: true,
          options: [
            { label: '常规体检', value: 'checkup' },
            { label: '疫苗接种', value: 'vaccine' },
            { label: '复查随访', value: 'followup' },
          ],
        },
        { field: 'remark', label: '预约备注', placeholder: '请输入预约备注', required: true },
        { field: 'birthday', label: '出生日期', placeholder: '选择日期', control: 'date' },
        {
          field: 'gender',
          label: '性别',
          control: 'radio',
          options: [
            { label: '男', value: '男' },
            { label: '女', value: '女' },
          ],
        },
      ],
    },
    {
      key: 'visit',
      title: '就诊信息',
      fields: [
        { field: 'allergy', label: '过敏史', placeholder: '请输入过敏史' },
        { field: 'history', label: '既往史', placeholder: '请输入既往史' },
        { field: 'infectious', label: '传染病史', placeholder: '请输入传染病史' },
        { field: 'idNo', label: '身份证号', placeholder: '请输入身份证号' },
        { field: 'referrer', label: '介绍人', placeholder: '请输入介绍人' },
        {
          field: 'visitDoctor',
          label: '就诊医生',
          placeholder: '请选择就诊医生',
          control: 'select',
          options: [
            { label: '张伟医生', value: 'zhang' },
            { label: '李娜医生', value: 'li' },
          ],
        },
        { field: 'firstVisit', label: '初诊日期', placeholder: '选择日期时间', control: 'date' },
        { field: 'recentVisit', label: '近诊记录', placeholder: '选择日期时间', control: 'date' },
      ],
    },
  ];

  const form = reactive<Record<string, string>>({
    name: '',
    phone: '',
    time: '',
    doctor: '',
    item: '',
    remark: '',
    birthday: '',
    gender: '男',
    allergy: '',
    history: '',
    infectious: '',
    idNo: '',
    referrer: '',
    visitDoctor: '',
    firstVisit: '',
    recentVisit: '',
  });

  const rules: Record<string, { required: boolean; message: string }[]> = {};
  groups.forEach((g) =>
    g.fields.forEach((f) => {
      if (f.required) rules[f.field] = [{ required: true, message: `请输入${f.label}` }];
    }),
  );

  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const activeGroup = ref('booking');

  function toggle(key: string) {
    activeGroup.value = activeGroup.value === key ? '' : key;
  }

  async function submit() {
    const ok = await formRef.value?.validate().catch(() => false);
    if (ok === false) return;
    loading.value = true;
    try {
      await axios.post('/api/form/submit', { ...form });
      Message.success('提交成功');
      reset();
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    formRef.value?.resetFields();
  }
</script>

<style scoped lang="less">
  .advanced-form {
    max-width: 1180px;
    margin: 0 auto;
  }

  .adv-group {
    margin-bottom: 14px;
    border-radius: 10px;

    &.is-active {
      box-shadow: 0 6px 20px rgba(24, 36, 60, 0.06);
    }

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      font-weight: 600;
      font-size: 15px;
      color: var(--color-text-1);
      padding: 2px 2px 12px;
    }

    &__caret {
      color: var(--color-text-3);
    }
  }

  .adv-actions {
    margin-top: 6px;
    padding-left: 2px;
  }
</style>
