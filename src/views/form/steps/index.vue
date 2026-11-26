<template>
  <div>
    <FormPageHeader
      title="分步表单"
      description="将一个冗长或用户不熟悉的表单任务分成多个步骤，指导用户完成。"
    />

    <a-card :bordered="false" class="steps-card">
      <a-steps :current="step" class="steps-bar">
        <a-step title="填写转账信息" description="确保填写正确" />
        <a-step title="确认转账信息" description="核对转账信息" />
        <a-step title="完成转账" description="恭喜你，转账成功" />
      </a-steps>

      <div class="steps-body">
        <!-- 第 1 步：填写转账信息 -->
        <a-form
          v-show="step === 0"
          :model="transfer"
          :rules="transferRules"
          layout="horizontal"
          :label-col-props="{ span: 4 }"
          :wrapper-col-props="{ span: 16 }"
          ref="transferRef"
          class="steps-form"
        >
          <a-form-item field="payer" label="付款账户">
            <a-select v-model="transfer.payer" placeholder="请选择付款账户">
              <a-option value="alipay">支付宝（尾号 8821）</a-option>
              <a-option value="icbc">工商银行（尾号 0096）</a-option>
              <a-option value="cmb">招商银行（尾号 3320）</a-option>
            </a-select>
          </a-form-item>
          <a-form-item field="receiver" label="收款账户">
            <a-input-group style="width: 100%">
              <a-select v-model="transfer.rectype" style="width: 108px; flex: none">
                <a-option value="email">邮箱</a-option>
                <a-option value="alipay">支付宝</a-option>
              </a-select>
              <a-input v-model="transfer.receiver" placeholder="xiaoma@qq.com" allow-clear />
            </a-input-group>
          </a-form-item>
          <a-form-item field="payee" label="收款人姓名">
            <a-input v-model="transfer.payee" placeholder="输入收款人姓名" allow-clear />
          </a-form-item>
          <a-form-item field="amount" label="转账金额">
            <a-input-number v-model="transfer.amount" :min="1" style="width: 100%">
              <template #prefix>¥</template>
              <template #suffix>元</template>
            </a-input-number>
          </a-form-item>
        </a-form>

        <!-- 第 2 步：确认转账信息 -->
        <div v-show="step === 1" class="confirm-box">
          <a-descriptions title="转账信息核对" :column="1" :data="confirmRows" />
        </div>

        <!-- 第 3 步：完成转账 -->
        <div v-show="step === 2" class="done-box">
          <a-result status="success" title="转账成功" sub-title="请妥善保存转账凭证，我们会尽快到账。" />
        </div>
      </div>

      <div class="steps-actions">
        <a-button v-if="step > 0 && step < 2" @click="step -= 1">上一步</a-button>
        <a-space>
          <a-button v-if="step < 1" type="primary" @click="next">下一步</a-button>
          <a-button v-else-if="step === 1" :loading="loading" @click="submit">确认转账</a-button>
          <a-button v-if="step === 2" @click="resetAll">再转一笔</a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue';
  import axios from 'axios';
  import FormPageHeader from '../components/form-page-header.vue';

  const step = ref(0);
  const loading = ref(false);
  const transferRef = ref<FormInstance>();

  const transfer = reactive({
    payer: '',
    rectype: 'email',
    receiver: '',
    payee: '',
    amount: undefined as number | undefined,
  });

  const transferRules: Record<string, { required: boolean; message: string }[]> = {
    payer: [{ required: true, message: '请选择付款账户' }],
    receiver: [{ required: true, message: '请输入收款账户' }],
    payee: [{ required: true, message: '请输入收款人姓名' }],
    amount: [{ required: true, message: '请输入转账金额' }],
  };

  const payerLabel: Record<string, string> = {
    alipay: '支付宝（尾号 8821）',
    icbc: '工商银行（尾号 0096）',
    cmb: '招商银行（尾号 3320）',
  };

  const confirmRows = computed(() => [
    { label: '付款账户', value: payerLabel[transfer.payer] || '-' },
    { label: '收款账户', value: transfer.rectype === 'email' ? `${transfer.receiver}` : transfer.receiver },
    { label: '收款人姓名', value: transfer.payee || '-' },
    { label: '转账金额', value: transfer.amount != null ? `¥ ${transfer.amount.toLocaleString()} 元` : '-' },
  ]);

  async function next() {
    const ok = await transferRef.value?.validate().catch(() => false);
    if (ok === false) return;
    step.value = 1;
  }

  async function submit() {
    loading.value = true;
    try {
      await axios.post('/api/form/submit', { ...transfer });
      Message.success('转账成功');
      step.value = 2;
    } finally {
      loading.value = false;
    }
  }

  function resetAll() {
    Object.assign(transfer, { payer: '', rectype: 'email', receiver: '', payee: '', amount: undefined });
    transferRef.value?.resetFields();
    step.value = 0;
  }
</script>

<style scoped lang="less">
  .steps-card {
    max-width: 860px;
    margin: 0 auto;
  }

  .steps-bar {
    margin-bottom: 32px;
  }

  .steps-body {
    min-height: 160px;
  }

  .steps-form {
    max-width: 560px;
    margin: 0 auto;

    :deep(.arco-form-label) {
      text-align: right;
    }
  }

  .confirm-box,
  .done-box {
    padding: 16px 8px;
  }

  .steps-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
  }
</style>
