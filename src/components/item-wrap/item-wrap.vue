<template>
  <dv-border-box-13 class="lr_titles">
    <div class="item_title" v-if="title !== ''">
      <div class="zuo"></div>
      <span class="title-inner"> &nbsp;&nbsp;{{ title }}&nbsp;&nbsp; </span>
      <div class="you"></div>
    </div>
    <div :class="title !== '' ? 'item_title_content' : 'item_title_content_def'">
      <slot></slot>
      <!-- 只有在 disableZoom 为 false 时才显示放大按钮 -->
      <div v-if="!disableZoom" @click="visible = true" class="zoom-button">日志操作</div>
    </div>
    <t-dialog
        :visible.sync="visible"
        :confirmBtn="null"
        header="日志操作"
        top="4%"
        width=1400
    >
      <div class="dialog-body">
        <WorkOrder />
      </div>
    </t-dialog>
  </dv-border-box-13>
</template>

<script>
import TransparentModal from '../item-wrap/TransparentModal.vue'; // 引入弹窗组件
import WorkOrder from '../item-wrap/work-order.vue';
export default {
  components: {TransparentModal,WorkOrder},
  props: {
    title: {
      type: String,
      default: "",
    },
    disableZoom: {
      type: Boolean,
      default: false, // 默认不禁用放大功能
    },
  },
  data() {
    return {
      visible: false, // 控制弹窗的显示
    };
  },
};
</script>

<style lang='scss' scoped>
$item-title-height: 38px;
$item_title_content-height: calc(100% - 38px);

.lr_titles {
  box-sizing: border-box;

  :deep(.border-box-content) {
    box-sizing: border-box;
    padding: 6px 16px 0px;
  }

  .item_title {
    height: $item-title-height;
    line-height: $item-title-height;
    width: 100%;
    color: #31abe3;
    text-align: center;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .zuo,
    .you {
      width: 58px;
      height: 14px;
      background-image: url("../../assets/img/titles/zuo.png");
    }

    .you {
      transform: rotate(180deg);
    }

    .title-inner {
      font-weight: 900;
      letter-spacing: 2px;
      background: linear-gradient(
              92deg,
              #0072ff 0%,
              #00eaff 48.8525390625%,
              #01aaff 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .item_title_content {
    height: $item_title_content-height;
    position: relative;
  }

  .item_title_content_def {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .zoom-button {
    position: absolute;
    bottom: 10px; /* 距离底部10px */
    right: -10px; /* 距离右边10px */
    color: #e0e5e8; /* 文字颜色 */
    cursor: pointer; /* 鼠标悬停时显示指针 */
    font-size: 20px; /* 文字大小 */

    &:hover {
      color: #e8dbdf;
    }
  }
}
.dialog-body {
  display: flex;
  flex-direction: column;
  max-height: 80vh; /* 最大高度占屏幕 80% */
  overflow: hidden; /* 隐藏溢出 */
}

</style>
