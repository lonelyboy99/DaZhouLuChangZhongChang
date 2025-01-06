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
            <!--            <div class="dibu"></div>-->
            <div class="flex">
              <div class="info addresswrap">
                <span class="contents zhuyao doudong wangguan">
                  {{ item.deviceName }}</span>
              </div>
              <div class="info addresswrap">
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
                <span class="labels">正常范围：</span>
                <span class="contents ciyao" style="font-size: 17px">
                  {{ item.previousValue }}
                </span>
              </div>
            </div>
            <div class="flex">

              <div class="info">
                <span class="labels">更新时间：</span>
                <span class="contents " style="font-size: 20px">
                  {{ updateTime }}</span>
              </div>
              <span
                  class="types doudong"
                  style="font-size: 20px"
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
      list: [], // 所有设备数据
      pageflag: true,
      updateTime: "", // 用于存储接口调用时间
      components: vueSeamlessScroll,
      defaultOption: {
        ...this.$store.state.setting.defaultOption,
        singleHeight: 240,
        limitMoveNum: 5,
        step: 0,
      },
      previousDataMap: {}, // 用于存储每个设备的上次数据
      deviceNames: ["2# 断路器", "2# 探测器", "3# 断路器", "3# 探测器", "4# 断路器", "4# 探测器", "6# 断路器", "6# 探测器", "7# 断路器", "7# 探测器"], // 所有设备名称
      apiUrls: [
        "/api/devices6", "/api/devices7", "/api/devices4", "/api/devices5",
        "/api/devices3", "/api/devices1", "/api/devices8", "/api/devices2",
        "/api/devices", "/api/devices9"
      ], // 所有设备的API接口
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
    this.fetchDeviceData(); // 页面加载时调用一次获取所有设备数据
    this.getDataHandle = setInterval(() => {
      this.fetchDeviceData(); // 每10秒钟重新获取所有数据
    }, 10000);
  },

  beforeDestroy() {
    clearInterval(this.getDataHandle);
  },

  methods: {
    fetchDeviceData() {
      this.pageflag = true;
      const currentTime = new Date().toLocaleString();
      this.updateTime = currentTime;

      // 清空 list
      let allData = [];

      // 遍历所有设备并发起请求
      const apiRequests = this.apiUrls.map((url, index) => {
        return this.$axios.get(url).then((res) => {
          if (res.data.success) {
            const snap = res.data.data.list[0]; // 获取最新的数据
            const deviceName = this.deviceNames[index];

            // 获取或初始化该设备的 previousData
            if (!this.previousDataMap[url]) {
              this.previousDataMap[url] = [];
            }
            const previousData = this.previousDataMap[url];

            // 创建新的数据列表
            const newList = [
              { name: "A相电压", value: parseFloat(snap.a_voltage), deviceName },
              { name: "B相电压", value: parseFloat(snap.b_voltage), deviceName },
              { name: "C相电压", value: parseFloat(snap.c_voltage), deviceName },
              { name: "A相电流", value: parseFloat(snap.a_current), deviceName },
              { name: "B相电流", value: parseFloat(snap.b_current), deviceName },
              { name: "C相电流", value: parseFloat(snap.c_current), deviceName },
              { name: "剩余电流", value: parseFloat(snap.remaindeRelectric), deviceName },
            ];

            // 更新 list 并计算趋势和状态
            allData = [...allData, ...newList.map((item, index) => {
              const previousValue = previousData[index] ? previousData[index].value : item.value;
              const trend = this.calculateTrend(item.value, previousValue);
              const status = this.calculateStatus(item.value, previousValue);

              return {
                ...item,
                previousValue,
                trend,
                status,
              };
            })];

            // 更新 previousDataMap 中的当前设备数据
            this.previousDataMap[url] = [...allData];

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
      });

      // 等待所有设备的请求完成
      Promise.all(apiRequests).then(() => {
        // 更新 list 并将异常项排在前面
        this.list = allData.sort((a, b) => (a.status === "异常" ? -1 : 1));

        let timer = setTimeout(() => {
          clearTimeout(timer);
          this.defaultOption.step = this.$store.state.setting.defaultOption.step;
        }, this.$store.state.setting.defaultOption.waitTime);
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
        font-size: 20px;
        color: rgba(255, 255, 255, 0.6);
      }
      .flex-grow {
        display: flex;
        justify-content: flex-end; /* 将内容对齐到最右边 */
        flex-grow: 1; /* 占据剩余空间 */
      }

      .zhuyao {
        color: #1890ff;
        font-size: 20px;
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
      width: 100%;
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
      font-size: 20px;
      width: 120px;
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