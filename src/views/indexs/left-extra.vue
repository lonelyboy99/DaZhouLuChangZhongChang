<template>
  <div
      v-if="pageflag"
      class="left_extra_wrap beautify-scroll-def"
      :class="{ 'overflow-y-auto': !sbtxSwiperFlag }"
  >
    <component :is="components" :data="list" :class-option="defaultOption">
      <ul class="left_extra">
        <li class="left_extra_item" v-for="(item, i) in list" :key="i">
          <div class="inner_right">
            <div class="dibu"></div>
            <div class="flex">
              <div class="info">
                <span class="labels">设备名称：</span>
                <span class="contents zhuyao doudong wangguan">
                  {{ deviceName }}</span>
              </div>
              <div class="info">
                <span class="labels">更新时间：</span>
                <span class="contents " style="font-size: 12px">
                  {{ updateTime }}</span>
              </div>
              <span
                  class="types doudong"
                  :class="{
                typeRed: item.status === '异常',
                typeGreen: item.status === '正常',
              }"
              >
              {{ item.status }}
              <span v-if="item.trend === 'up'">⬆️</span>
              <span v-if="item.trend === 'down'">⬇️</span>
            </span>
            </div>
            <div class="flex">
              <div class="info addresswrap">
                <span class="labels">数据类型：</span>
                <span class="contents zhuyao doudong wangguan">
                  {{ item.name }}
                </span>
              </div>
              <div class="info addresswrap">
                <span class="labels">当前值：</span>
                <span class="contents zhuyao doudong wangguan" style="font-size: 20px">
                  {{ item.value }}
                </span>
              </div>
              <div class="info addresswrap">
                <span class="labels">上次值：</span>
                <span class="contents ciyao" style="font-size: 12px">
                  {{ item.previousValue }}
                </span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </component>
  </div>

  <Reacquire v-else @onclick="fetchDeviceData" style="line-height: 200px"/>
</template>

<script>
import axios from "axios";
import vueSeamlessScroll from "vue-seamless-scroll"; // vue2引入方式
import Kong from "../../components/kong.vue";

export default {
  components: { vueSeamlessScroll, Kong },
  data() {
    return {
      list: [],
      pageflag: true,
      updateTime: "", // 用于存储接口调用时间
      deviceName: "", // 当前显示设备名称
      components: vueSeamlessScroll,
      defaultOption: {
        ...this.$store.state.setting.defaultOption,
        singleHeight: 240,
        limitMoveNum: 5,
        step: 0,
      },
      currentIndex: 0, // 当前请求设备的索引
      previousDataMap: {}, // 用于存储每个设备的上次数据
      apiList: [
        { url: "/api/devices", name: "7号楼断路器" },
        { url: "/api/devices1", name: "4号楼探测器" },
        { url: "/api/devices2", name: "6号楼探测器" },
        { url: "/api/devices3", name: "4号楼断路器" },
        { url: "/api/devices4", name: "3号楼断路器" },
        { url: "/api/devices5", name: "3号楼探测器" },
        { url: "/api/devices6", name: "2号楼断路器" },
        { url: "/api/devices7", name: "2号楼探测器" },
        { url: "/api/devices8", name: "6号楼断路器" },
      ],
    };
  },

  computed: {
    sbtxSwiperFlag() {
      let sbtxSwiper = this.$store.state.setting.sbtxSwiper;
      if (sbtxSwiper) {
        this.components = vueSeamlessScroll;
      } else {
        this.components = Kong;
      }
      return sbtxSwiper;
    },
  },

  mounted() {
    this.fetchDeviceData();
    this.getDataHandle = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.apiList.length;
      this.fetchDeviceData();
    }, 10000);
  },
  beforeDestroy() {
    clearInterval(this.getDataHandle);
  },

  methods: {
    fetchDeviceData() {
      this.pageflag = true;
      const { url, name } = this.apiList[this.currentIndex];
      this.deviceName = name;

      this.$axios.get(url).then((res) => {
        if (res.data.success) {
          const snap = res.data.data.list[0]; // 获取最新的数据
          const currentTime = new Date().toLocaleString();
          this.updateTime = currentTime;

          // 获取或初始化该设备的 previousData
          if (!this.previousDataMap[url]) {
            this.previousDataMap[url] = [];
          }
          const previousData = this.previousDataMap[url];

          // 创建新的数据列表
          const newList = [
            { name: "A相电压", value: parseFloat(snap.a_voltage) },
            { name: "B相电压", value: parseFloat(snap.b_voltage) },
            { name: "C相电压", value: parseFloat(snap.c_voltage) },
            { name: "A相电流", value: parseFloat(snap.a_current) },
            { name: "B相电流", value: parseFloat(snap.b_current) },
            { name: "C相电流", value: parseFloat(snap.c_current) },
            { name: "剩余电流", value: parseFloat(snap.remaindeRelectric) },
          ];

          // 更新 list 并计算趋势和状态
          this.list = newList.map((item, index) => {
            const previousValue = previousData[index] ? previousData[index].value : item.value;
            const trend = this.calculateTrend(item.value, previousValue);
            const status = this.calculateStatus(item.value, previousValue);

            return {
              ...item,
              previousValue,
              trend,
              status,
            };
          });

          // 更新 previousDataMap 中的当前设备数据
          this.previousDataMap[url] = [...this.list];

          // 将异常项目移到顶部
          this.list.sort((a, b) => (a.status === "异常" ? -1 : 1));

          let timer = setTimeout(() => {
            clearTimeout(timer);
            this.defaultOption.step = this.$store.state.setting.defaultOption.step;
          }, this.$store.state.setting.defaultOption.waitTime);
        } else {
          this.pageflag = false;
          this.$Message({
            text: res.data.msg,
            type: "warning",
          });
        }
      }).catch(error => {
        console.error("接口请求失败:", error);
        this.pageflag = false;
      });
    },

    calculateTrend(currentValue, previousValue) {
      if (currentValue > previousValue) {
        return "up";
      } else if (currentValue < previousValue) {
        return "down";
      }
      return "normal";
    },

    calculateStatus(currentValue, previousValue) {
      const threshold = 0.2; // 波动阈值，超过则为异常
      if (Math.abs(currentValue - previousValue) / (previousValue || 1) > threshold) {
        return "异常";
      }
      return "正常";
    },
  },
};
</script>

<style lang='scss' scoped>
.left_extra_wrap {
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.doudong {
  overflow: hidden;
  -webkit-backface-visibility: hidden;
  -moz-backface-visibility: hidden;
  -ms-backface-visibility: hidden;
  backface-visibility: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

.left_extra {
  width: 100%;
  height: 100%;

  .left_extra_item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    font-size: 14px;
    margin: 10px 0;

    .orderNum {
      margin: 0 16px 0 -20px;
    }

    .info {
      margin-right: 10px;
      display: flex;
      align-items: center;
      color: #fff;

      .labels {
        flex-shrink: 0;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
      }

      .zhuyao {
        color: #1890ff;
        font-size: 12px;
      }

      .ciyao {
        color: rgba(255, 255, 255, 0.8);
      }

      .warning {
        color: #e6a23c;
        font-size: 15px;
      }
    }

    .inner_right {
      position: relative;
      height: 100%;
      width: 380px;
      flex-shrink: 0;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;

      .dibu {
        position: absolute;
        height: 2px;
        width: 104%;
        background-image: url("../../assets/img/zuo_xuxian.png");
        bottom: -10px;
        left: -2%;
        background-size: cover;
      }

      .addresswrap {
        width: 100%;
        display: flex;
        margin-top: 8px;
      }
    }

    .wangguan {
      color: #1890ff;
      font-weight: 900;
      font-size: 15px;
      width: 80px;
      flex-shrink: 0;
    }

    .types {
      width: 50px;
      flex-shrink: 0;
      text-align: center;
    }

    .typeRed {
      color: #fc1a1a;
    }

    .typeGreen {
      color: #29fc29;
    }
  }
}
</style>
