<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content" :style="{ width: '80%', height: '80%' }">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <div class="chart-link" @click="closeModal">关闭</div>
      </div>
      <div class="modal-body">
        <t-card :bordered="false" class="list-card-container">
          <t-form>
            <t-row justify="space-between">
              <t-col :span="10">
                <t-row :gutter="[16, 24]">
                  <t-col>
                    <t-form-item label="工单状态筛选" name="state">
                      <t-select
                          v-model="selectedState"
                          :options="STATE"
                          class="form-item-content"
                          @change="handleSelectChange"
                      />
                    </t-form-item>
                  </t-col>
                  <t-col>
                    <t-form-item label="工单类型筛选" name="type">
                      <t-select
                          v-model="selectedType"
                          :options="TYPE"
                          class="form-item-content"
                          @change="handleSelectChange"
                      />
                    </t-form-item>
                  </t-col>
                  <t-col>
                    <t-button variant="base" @click="handleBatchAccept">批量承接</t-button>
                  </t-col>
                  <t-col>
                    <t-button variant="base" @click="handleBatchComplete">批量完成</t-button>
                  </t-col>
                  <t-col>
                    <t-button variant="base" @click="handleBatchDelete">批量删除</t-button>
                  </t-col>
                </t-row>
              </t-col>
            </t-row>
          </t-form>
          <div class="table-container">
            <t-table
                :columns="columns"
                :data="data"
                :headerAffixedTop="true"
                :hover="hover"
                :loading="dataLoading"
                :pagination="pagination"
                :rowKey="rowKey"
                :selected-row-keys="selectedRowKeys"
                :verticalAlign="verticalAlign"
                @change="rehandleChange"
                @page-change="rehandlePageChange"
                @select-change="rehandleSelectChange"
            >
              <template #state="{ row }">
                <t-tag v-if="row.state === 0" theme="danger" variant="light">
                  <icon name="error-circle" style="margin-bottom: 3px"/>
                  未承接
                </t-tag>
                <t-tag v-if="row.state === 1" theme="success" variant="light">
                  <icon name="check-circle" style="margin-bottom: 3px"/>
                  已完成
                </t-tag>
                <t-tag v-if="row.state === 2" theme="primary" variant="light">
                  <icon name="help-circle" style="margin-bottom: 3px"/>
                  已承接但未完成
                </t-tag>
              </template>
              <!--              <template #priority="{ row }">-->
<!--                <t-tag v-if="row.priority === '紧急且重要'" theme="danger" variant="dark">紧急且重要</t-tag>-->
<!--                <t-tag v-if="row.priority === '高'" theme="warning" variant="dark">高</t-tag>-->
<!--                <t-tag v-if="row.priority === '中'" theme="primary" variant="dark">中</t-tag>-->
<!--                <t-tag v-if="row.priority === '低'" theme="success" variant="dark">低</t-tag>-->
<!--              </template>-->
              <template #op="slotProps">
                <t-popconfirm :on-confirm="() => handleUpdate(slotProps.row,'已承接但未完成')"
                              :popupProps="{ placement: 'top' }"
                              content="确认承接工单吗"
                              theme="default"
                >
                  <a class="t-button-link">承接</a>
                </t-popconfirm>
                <t-popconfirm :on-confirm="() => handleUpdate(slotProps.row,'已完成')"
                              :popupProps="{ placement: 'top' }"
                              content="确认工单完成吗"
                              theme="default"
                >
                  <a class="t-button-link">完成</a>
                </t-popconfirm>
                <t-popconfirm :on-confirm="() => handleDelete(slotProps.row)"
                              :popupProps="{ placement: 'top' }"
                              content="确认删除工单吗"
                              theme="danger"
                >
                  <a class="t-button-link" style="color: red">删除</a>
                </t-popconfirm>
              </template>
            </t-table>
          </div>
        </t-card>
      </div>
    </div>
  </div>
</template>


<script>
import {prefix} from "tdesign-vue/es/config";

export default {
  data() {
    return {
      prefix,
      timerId: null,
      selectedRowKeys: [],
      CUSTOMER: [],
      STATE: [],
      TYPE: [],
      selectedCustomer: '全部客户',
      selectedState: '全部状态',
      selectedType: '全部类型',
      data: [],
      dataLoading: true,
      deleteLoading: true,
      value: 'first',
      columns: [
        {colKey: 'row-select', type: 'multiple', width: 20, fixed: 'left'},
        {
          title: '工单号',
          width: 330,
          ellipsis: true,
          colKey: 'id',
          fixed: 'left',
          attrs: {
            style: {
              fontWeight: 600,
            },
          },
        },
        {
          title: '创建日期',
          align: 'center',
          width: 150,
          ellipsis: true,
          colKey: 'time',
        },
        {
          title: '车间号',
          align: 'center',
          width: 100,
          ellipsis: true,
          colKey: 'workshop_id',
        },
        {
          title: '状态',
          align: 'center',
          width: 160,
          ellipsis: true,
          colKey: 'state',
        },
        {
          title: '优先级',
          align: 'center',
          width: 110,
          ellipsis: true,
          colKey: 'fault_description',
        },
        // {
        //   title: '工单类型',
        //   align: 'center',
        //   width: 100,
        //   ellipsis: true,
        //   colKey: 'type',
        // },
        {
          align: 'center',
          fixed: 'right',
          width: 300,
          colKey: 'op',
          title: '操作',
        },
      ],
      rowKey: 'id',
      tableLayout: 'auto',
      verticalAlign: 'middle',
      hover: true,
      rowClassName: (rowKey) => `${rowKey}-class`,
      // 与pagination对齐
      pagination: {
        defaultPageSize: 10,
        total: 1,
        defaultCurrent: 1,
      },
      confirmVisible: false,
      deleteIdx: -1,
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '弹窗标题',
    },
    width: {
      type: String,
      default: '100%', // 默认宽度
    },
    height: {
      type: String,
      default: '100%', // 默认高度
    },
  },
  computed: {
    modalWidth() {
      return this.width;
    },
    modalHeight() {
      return this.height;
    },
  },
  mounted() {
    this.dataLoading = true;
    this.fetchData();
    this.timerId = setInterval(() => {
      this.fetchData();
    }, 1000);
  },
  methods: {
    async fetchData() {
      try {
        const response1 = await this.$axios.get('/api/work');

        // 将响应数据的 list 赋值给 data
        this.data = response1.data.data.list;

        // 更新 pagination.total 属性
        this.pagination.total = this.data.length;

        // 加载完成
        this.dataLoading = false;
      } catch (error) {
        console.error('获取数据时出错', error);
      }
    },

    closeModal() {
      this.$emit('close');
    },
    rehandlePageChange(curr, pageInfo) {
      console.log('分页变化', curr, pageInfo);
    },
    rehandleChange(changeParams, triggerAndData) {
      console.log('统一Change', changeParams, triggerAndData);
    },
    rehandleClickOp({text, row}) {
      console.log(text, row);
    },
    rehandleSelectChange(value, {selectedRowData}) {
      this.selectedRowKeys = value;
      console.log(value, selectedRowData);
    },
    handleClickDelete(row) {
      this.deleteIdx = row.rowIndex;
      this.confirmVisible = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* 50% 透明的黑色背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: rgba(34, 34, 34, 0.9); /* 深色背景，90% 不透明度 */
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #ffffff; /* 白色文字 */
}

h3 {
  font-size: 30px;
}

.chart-link { /* 放大查看图表的文字链接样式 */
  bottom: 7px; /* 距离底部10px */
  right: 10px; /* 距离右边10px */
  color: #FFFFFF; /* 文字颜色 */
  cursor: pointer; /* 鼠标悬停时显示指针 */
  font-size: 20px; /* 文字大小 */

  &:hover {
    color: #2980b9; /* 悬停时的颜色 */
  }
}

.modal-body {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  color: #ffffff; /* 白色文字 */
}
.table-container {
  width: 100%; /* 将宽度改为 100% */
  max-height: 70vh; /* 添加一个最大高度限制 */
  overflow: auto; /* 如果内容过多，添加滚动条 */
}

.table-container {
  width: 90%;
}
</style>
