<template>
  <div>
      <t-form>
        <t-space>
          <t-button variant="base" @click="handleBatchAccept">批量承接</t-button>
          <t-button variant="base" @click="handleBatchComplete">批量完成</t-button>
          <t-button variant="base" @click="handleBatchDelete">批量删除</t-button>
        </t-space>
      </t-form>
    <t-card :bordered="false" class="list-card-container">
      <div class="table-container">
        <t-table
            :columns="columns"
            :data="data"
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
          <template #op="slotProps">
            <t-popconfirm :on-confirm="() => handleUpdate(slotProps.row,'2')"
                          :popupProps="{ placement: 'top' }"
                          content="确认承接工单吗"
                          theme="default"
            >
              <a class="t-button-link op-btn" style="color: blue">承接</a>
            </t-popconfirm>
            <t-popconfirm :on-confirm="() => handleUpdate(slotProps.row,'1')"
                          :popupProps="{ placement: 'top' }"
                          content="确认工单完成吗"
                          theme="default"
            >
              <a class="t-button-link op-btn" style="color: blue">完成</a>
            </t-popconfirm>
            <t-popconfirm :on-confirm="() => handleDelete(slotProps.row)"
                          :popupProps="{ placement: 'top' }"
                          content="确认删除工单吗"
                          theme="danger"
            >
              <a class="t-button-link op-btn delete-btn">删除</a>
            </t-popconfirm>
          </template>
        </t-table>
      </div>
    </t-card>
  </div>
</template>
<script>
import axios from 'axios'; // 导入 Axios 库
import {Icon} from 'tdesign-icons-vue';
import {prefix} from "tdesign-vue/es/config";

export default {
  name: 'list-table',
  visible: true,
  components: {
    Icon,
  },
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
        { colKey: 'row-select', type: 'multiple', width: 60 },
        { title: '工单号', colKey: 'id', width: 100 },
        { title: '故障日期', colKey: 'time', width: 200, align: 'center' },
        { title: '车间号', colKey: 'workshop_id', width: 100, align: 'center' },
        { title: '状态', colKey: 'state', width: 120, align: 'center' },
        { title: '故障原因', colKey: 'fault_description', width: 200, align: 'center' },
        { title: '操作', colKey: 'op', width: 200, align: 'center' },
      ],
      pagination: {
        defaultPageSize: 10,
        total: 0,
        defaultCurrent: 1,
      },
      rowKey: 'id',
      tableLayout: 'fixed',
      verticalAlign: 'middle',
      hover: true,
      rowClassName: (rowKey) => `${rowKey}-class`,
      // 与pagination对齐
      confirmVisible: false,
      deleteIdx: -1,
    };
  },
  watch: {},
  computed: {
    offsetTop() {
      return this.$store.state.setting.isUseTabsRouter ? 48 : 0;
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
        const response1 = await this.$axios.get('/api/work_order');

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

    async deleteItem(id) {
      try {
        await this.$axios.delete(`/api/work_order/delete/${id}`);
        await this.fetchData();
        console.log('工单删除成功', id);
      } catch (error) {
        console.error('Error deleting item', error);
      }
    },
    async updateItem(id, status) {
      try {
        await this.$axios.put(`/api/work_order/put/${id}`, {data: {state: status}});
        await this.fetchData();
        console.log('状态修改成功', id);
      } catch (error) {
        console.error('Error updating item', error);
      }
    },
    handleUpdate(row, status) {
      console.log('正在修改行', row);
      const {id} = row;
      this.updateItem(id, status);
    },
    handleDelete(row) {
      console.log('正在删除行:', row);
      // 处理删除操作
      const {id} = row;
      this.deleteItem(id);
    },
    handleSelectChange() {
      // 在项目选择更改时触发数据获取
      this.dataLoading = true;
      this.fetchData();
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    // 批量承接
    handleBatchAccept() {
      if (this.selectedRowKeys.length === 0) {
        this.$message.warning('请选择要承接的工单');
        return;
      }

      // 遍历 selectedRowKeys 数组，对每个选中的行执行批量承接操作
      this.selectedRowKeys.forEach(key => {
        const selectedRow = this.data.find(row => row[this.rowKey] === key);

        if (selectedRow) {
          // 调用单个承接操作函数
          this.handleUpdate(selectedRow, 2);
        }
      });

      // 批量承接完成后，清空选中的行
      this.selectedRowKeys = [];
    },

    // 批量完成
    handleBatchComplete() {
      if (this.selectedRowKeys.length === 0) {
        this.$message.warning('请选择要完成的工单');
        return;
      }

      // 遍历 selectedRowKeys 数组，对每个选中的行执行批量完成操作
      this.selectedRowKeys.forEach(key => {
        const selectedRow = this.data.find(row => row[this.rowKey] === key);
        if (selectedRow) {
          // 调用单个完成操作函数
          this.handleUpdate(selectedRow, 1);
        }
      });

      // 批量完成完成后，清空选中的行
      this.selectedRowKeys = [];
    },

    // 批量删除
    handleBatchDelete() {
      if (this.selectedRowKeys.length === 0) {
        this.$message.warning('请选择要删除的工单');
        return;
      }

      // 遍历 selectedRowKeys 数组，对每个选中的行执行批量删除操作
      this.selectedRowKeys.forEach(key => {
        const selectedRow = this.data.find(row => row[this.rowKey] === key);
        if (selectedRow) {
          // 调用单个删除操作函数
          this.handleDelete(selectedRow);
        }
      });

      // 批量删除完成后，清空选中的行
      this.selectedRowKeys = [];
    },
    getContainer() {
      return document.querySelector('.tdesign-starter-layout');
    },
    onReset(data) {
      console.log(data);
    },
    onSubmit(data) {
      console.log(data);
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
    onConfirmDelete() {
      // 真实业务请发起请求
      this.data.splice(this.deleteIdx, 1);
      this.pagination.total = this.data.length;
      this.confirmVisible = false;
      this.$message.success('删除成功');
      this.resetIdx();
    },
    onCancel() {
      this.resetIdx();
    },
    resetIdx() {
      this.deleteIdx = -1;
    },
    beforeDestroy() {
      clearInterval(this.timerId);
    },
  },
};
</script>

<style>

.list-common-table {
  background-color: var(--td-bg-color-container);
  padding: 30px 32px;
  border-radius: var(--td-radius-default);
}

.form-item-content {
  width: 100%;
}

.operation-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.payment-col {
  display: flex;

  .trend-container {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }
}
.op-btn {
  margin-right: 8px; /* 添加右侧间距 */
}

.delete-btn {
  color: red; /* 删除按钮保持红色 */
  margin-left: 8px; /* 防止删除按钮和其他按钮紧贴 */
}

.t-button + .t-button {
  margin-left: var(--td-comp-margin-s);
}
.table-container {
  width: 100%;
  max-height: 60vh;
  overflow: auto;
}

.t-table {
  width: 100%;
}

.dialog-body {
  max-height: 80vh;
  overflow-y: auto;
  padding: 16px;
}
.table-container {
  flex: 1;
  overflow: auto;
  max-height: calc(80vh - 50px); /* 动态计算表格高度 */
}

</style>