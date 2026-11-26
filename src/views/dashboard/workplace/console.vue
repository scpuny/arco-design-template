<template>
  <div class="console">
    <a-row :gutter="16">
      <a-col v-for="stat in stats" :key="stat.key" :xs="24" :sm="12" :xl="6">
        <a-card class="console-stat" :bordered="false">
          <div class="console-stat__head">
            <span class="console-stat__icon" :style="{ background: stat.color }">
              <component :is="stat.icon" />
            </span>
            <span class="console-stat__title">{{ stat.title }}</span>
            <a-link class="console-stat__detail" :hoverable="false">详情</a-link>
          </div>
          <div class="console-stat__value">{{ stat.value }}</div>
          <div class="console-stat__foot">
            <span :class="['console-stat__change', stat.change >= 0 ? 'up' : 'down']">
              <icon-arrow-rise v-if="stat.change >= 0" />
              <icon-arrow-fall v-else />
              {{ stat.change }}%
            </span>
            <span class="console-stat__compare">{{ stat.compare }}</span>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="console-row">
      <a-col :xs="24" :xl="16" class="console-col">
        <a-card title="订单来源" :bordered="false" class="console-card">
          <Chart :options="chartOption" height="300px" />
        </a-card>
      </a-col>
      <a-col :xs="24" :xl="8" class="console-col">
        <a-card title="用户分析" :bordered="false" class="console-card">
          <div v-for="user in users" :key="user.id" class="user-item">
            <a-avatar :size="38" :style="{ background: user.avatarColor, fontSize: '15px' }">
              {{ user.name.slice(0, 1) }}
            </a-avatar>
            <div class="user-item__main">
              <div class="user-item__line">
                <span class="user-item__name">{{ user.name }}</span>
                <span class="user-item__role">{{ user.role }}</span>
              </div>
              <div class="user-item__line">
                <a-progress
                  :percent="user.progress"
                  size="small"
                  :show-text="false"
                  :stroke="{ color: user.avatarColor }"
                  style="flex: 1"
                />
                <span class="user-item__percent">{{ user.progress }}%</span>
                <a-link :hoverable="false">查看</a-link>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="console-row">
      <a-col :xs="24" :xl="16" class="console-col">
        <a-card title="最新订单" :bordered="false" class="console-card">
          <a-table :data="orders" :pagination="false" row-key="id" :scroll="{ x: 900 }">
            <template #columns>
              <a-table-column title="序号" data-index="id" :width="60" align="center" />
              <a-table-column title="下单用户" :width="120">
                <template #cell="{ record }">
                  <a-space :size="6">
                    <a-avatar :size="24" :style="{ background: record.userColor, fontSize: '11px' }">
                      {{ record.user.slice(0, 1) }}
                    </a-avatar>
                    <span>{{ record.user }}</span>
                  </a-space>
                </template>
              </a-table-column>
              <a-table-column title="商品名称" data-index="product" :width="120" />
              <a-table-column title="商品库存" data-index="stock" :width="90" align="center" />
              <a-table-column title="订单金额" :width="100">
                <template #cell="{ record }">￥{{ record.amount.toFixed(2) }}</template>
              </a-table-column>
              <a-table-column title="商品图片" :width="90" align="center">
                <template #cell="{ record }">
                  <span class="product-thumb" :style="{ background: record.imageColor }">
                    <icon-image />
                  </span>
                </template>
              </a-table-column>
              <a-table-column title="付款状态" :width="100" align="center">
                <template #cell="{ record }">
                  <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="客户标签" :width="90" align="center">
                <template #cell="{ record }">
                  <span :class="['customer-tag', record.tag === '老客户' ? 'old' : 'new']">
                    {{ record.tag }}
                  </span>
                </template>
              </a-table-column>
              <a-table-column title="购买日期" data-index="date" :width="110" align="center" />
            </template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :xs="24" :xl="8" class="console-col">
        <a-card title="消费排行" :bordered="false" class="console-card rank-card">
          <div v-for="item in rank" :key="item.id" class="rank-item">
            <a-avatar :size="36" :style="{ background: item.avatarColor, fontSize: '14px' }">
              {{ item.name.slice(0, 1) }}
            </a-avatar>
            <div class="rank-item__main">
              <div class="rank-item__name">{{ item.name }}</div>
              <div class="rank-item__location">IP归属地：{{ item.location }}</div>
            </div>
            <span class="rank-item__amount">￥{{ item.amount.toFixed(2) }}</span>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { EChartsOption } from 'echarts';
  import useChartOption from '@/hooks/chart-option';
  import {
    getConsoleStats,
    getConsumptionRank,
    getLatestOrders,
    getOrderSource,
    getUserAnalysis,
    type ConsumptionRank,
    type ConsoleStat,
    type LatestOrder,
    type OrderSource,
    type PaymentStatus,
    type UserAnalysis,
  } from '@/api/dashboard';

  const stats = ref<ConsoleStat[]>([]);
  const users = ref<UserAnalysis[]>([]);
  const orders = ref<LatestOrder[]>([]);
  const rank = ref<ConsumptionRank[]>([]);
  const source = ref<OrderSource>({ districts: [], completed: [], total: [], conversion: [] });

  const { chartOption: baseOption } = useChartOption((isDark) => {
    const axisColor = isDark ? '#86909c' : '#4e5969';
    const splitColor = isDark ? '#33383e' : '#e5e6eb';
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['成交订单(个)', '总订单(个)', '转化率(%)'], top: 0, right: 0 },
      grid: { left: 48, right: 48, top: 44, bottom: 28 },
      xAxis: {
        type: 'category',
        data: source.value.districts,
        axisLine: { lineStyle: { color: splitColor } },
        axisLabel: { color: axisColor, fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: { color: axisColor, formatter: '{value}' },
          splitLine: { lineStyle: { color: splitColor, type: 'dashed' } },
        },
        {
          type: 'value',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: { color: axisColor, formatter: '{value}%' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '成交订单(个)',
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { color: '#165dff', borderRadius: [3, 3, 0, 0] },
          data: source.value.completed,
        },
        {
          name: '总订单(个)',
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { color: '#94bfff', borderRadius: [3, 3, 0, 0] },
          data: source.value.total,
        },
        {
          name: '转化率(%)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#165dff', width: 2 },
          itemStyle: { color: '#165dff' },
          areaStyle: { color: 'rgba(22,93,255,0.08)' },
          data: source.value.conversion,
        },
      ],
    } as EChartsOption;
  });
  const chartOption = computed(() => baseOption.value);

  function statusColor(status: PaymentStatus) {
    if (status === '已付款') return 'green';
    if (status === '未付款') return 'orange';
    return 'red';
  }

  onMounted(async () => {
    const [statsRes, sourceRes, usersRes, ordersRes, rankRes] = await Promise.all([
      getConsoleStats(),
      getOrderSource(),
      getUserAnalysis(),
      getLatestOrders(),
      getConsumptionRank(),
    ]);
    stats.value = statsRes.data;
    source.value = sourceRes.data;
    users.value = usersRes.data;
    orders.value = ordersRes.data;
    rank.value = rankRes.data;
  });
</script>

<style scoped lang="less">
  .console-row {
    margin-top: 16px;
    align-items: stretch;
  }

  // a-col 默认不拉伸，作为 flex 容器才能让内部 height:100% 的卡片真正等高
  .console-col {
    display: flex;
  }

  .console-stat {
    height: 100%;

    &__head {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    &__icon {
      display: inline-flex;
      width: 34px;
      height: 34px;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #fff;
      font-size: 17px;
    }

    &__title {
      flex: 1;
      color: var(--color-text-2);
      font-size: 13px;
    }

    &__detail {
      font-size: 12px;
    }

    &__value {
      margin: 18px 0 10px;
      color: var(--color-text-1);
      font-size: 26px;
      font-weight: 600;
    }

    &__foot {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }

    &__change {
      display: inline-flex;
      align-items: center;
      font-weight: 600;

      &.up {
        color: rgb(var(--green-6));
      }

      &.down {
        color: rgb(var(--red-6));
      }
    }

    &__compare {
      color: var(--color-text-3);
    }
  }

  .console-card {
    width: 100%;
    height: 100%;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border-1);

    &:last-child {
      border-bottom: 0;
    }

    &__main {
      flex: 1;
      min-width: 0;
    }

    &__line {
      display: flex;
      align-items: center;
      gap: 10px;

      & + & {
        margin-top: 8px;
      }
    }

    &__name {
      color: var(--color-text-1);
      font-size: 13px;
      font-weight: 500;
    }

    &__role {
      color: var(--color-text-3);
      font-size: 12px;
    }

    &__percent {
      min-width: 34px;
      color: var(--color-text-2);
      font-size: 12px;
      text-align: right;
    }
  }

  .product-thumb {
    display: inline-flex;
    width: 28px;
    height: 28px;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: #fff;
    font-size: 14px;
  }

  .customer-tag {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;

    &.old {
      background: rgb(var(--primary-1));
      color: rgb(var(--primary-6));
    }

    &.new {
      background: rgb(var(--green-1));
      color: rgb(var(--green-6));
    }
  }

  .rank-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border-1);

    &:last-child {
      border-bottom: 0;
    }

    &__main {
      flex: 1;
      min-width: 0;
    }

    &__name {
      color: var(--color-text-1);
      font-size: 13px;
      font-weight: 500;
    }

    &__location {
      overflow: hidden;
      color: var(--color-text-3);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__amount {
      color: rgb(var(--green-6));
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
  }
</style>
