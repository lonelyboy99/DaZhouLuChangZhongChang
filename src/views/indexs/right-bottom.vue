<template>
  <div
      v-if="pageflag"
      class="left_boottom_wrap beautify-scroll-def"
      :class="{ 'overflow-y-auto': !sbtxSwiperFlag }"
  >
    <component :is="components" :data="list" :class-option="defaultOption">
      <ul class="left_boottom">
        <li class="left_boottom_item" v-for="(item, i) in list" :key="i">
          <span class="orderNum doudong">{{ i + 1 }}</span>
          <div class="inner_right">
            <div class="dibu"></div>
            <div class="flex">
              <div class="info">
                <span class="labels">设备:</span>
                <span class="contents zhuyao doudong wangguan">
                  {{ item.deviceName || item.modelName }}</span>
              </div>
              <div class="info">
                <span class="labels">时间:</span>
                <span class="contents " style="font-size: 15px">
                  {{ item.time || item.lastOfflineTime }}</span>
              </div>
              <div class="info">
                <span
                    class="types doudong"
                    :class="{
                typeRed: !isDeviceOnline(item),
                typeGreen: isDeviceOnline(item),}">
              {{ isDeviceOnline(item) ? "在线" : "离线" }}</span>
              </div>
            </div>



            <div v-if="isTemperatureSensor(item)" class="flex" style="flex-direction: column; gap: 8px;">
              <!-- 一氧化碳含量和设备热状态 -->
              <div class="info addresswrap" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="info addresswrap" style="flex: 1; display: flex; justify-content: space-between;">
                  <span class="labels">CO含量：</span>
                  <span class="contents ciyao" style="font-size: 17px; text-align: right;">
                {{ item.lora1.smokeValue || '--' }}
                 </span>
                </div>
                <div class="info addresswrap" style="flex: 1; display: flex; justify-content: space-between;">
                  <span class="labels">热状态：</span>
                  <span class="contents ciyao" style="font-size: 17px; text-align: right;">
                {{ item.lora2.irValue || '--' }}
                </span>
                </div>
                <div class="info addresswrap" style="flex: 1; display: flex; justify-content: space-between;">
                  <span class="labels">烟雾：</span>
                  <span class="contents ciyao" style="font-size: 17px; text-align: right;">
                {{ item.averageSmoke || '--' }}
                </span>
                </div>
                <div class="info addresswrap" style="flex: 1; display: flex; justify-content: space-between;">
                  <span class="labels">火情：</span>
                  <span
                      class="contents ciyao"
                      :style="{ color: (item.lora1_fire === 1 || item.lora2_fire === 1) ? 'red' : 'yellow' }"
                      style="font-size: 15px; text-align: right;"
                  >{{ (item.lora1_fire === 1 || item.lora2_fire === 1) ? '有火情' : '无火情' }}
                </span>
                </div>

              </div>
            </div>


            <!-- 如果是其他设备，显示运营商服务、网关类型和信号质量 -->
            <div v-else class="flex">
              <div class="info addresswrap">
                <span class="labels">运营商：</span>
                <span class="contents zhuyao doudong wangguan" style="font-size: 17px">
                  {{ item.carrier || '--' }}</span>
              </div>
              <div class="info addresswrap">
                <span class="labels">网关类型：</span>
                <span class="contents ciyao" style="font-size: 17px">
                  {{ getGatewayType(item.type) }}</span>
              </div>
              <div class="info addresswrap">
                <span class="labels">信号质量：</span>
                <span class="contents ciyao" style="font-size: 17px">
                  {{ item.signalIntensity || '--' }}dBm</span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </component>
  </div>

  <Reacquire v-else @onclick="getData" style="line-height: 200px"/>
</template>

<script>
import vueSeamlessScroll from "vue-seamless-scroll"; // vue2引入方式
import Kong from "../../components/kong.vue";

export default {
  components: {vueSeamlessScroll, Kong},
  data() {
    return {
      list: [],
      pageflag: true,
      components: vueSeamlessScroll,
      defaultOption: {
        ...this.$store.state.setting.defaultOption,
        singleHeight: 240,
        limitMoveNum: 5,
        step: 0,
      },
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
    this.getData();
    this.getDataHandle = setInterval(() => {
      this.getData();
    }, 10000);
  },
  beforeDestroy() {
    clearInterval(this.getDataHandle);
  },
  methods: {
    async getData() {
      this.pageflag = true;
      try {
        // 同时请求多个设备接口
        const requests = [
          this.$axios.get('/api/lora1'),
          this.$axios.get('/api/lora2'),
          this.$axios.get('/api/lora3'),
          this.$axios.get('/api/lora4'),
          this.$axios.get('/api/lora5'),
          this.$axios.get('/proxy/deviceList'),
        ];

        const responses = await Promise.all(requests);

        // 获取当前时间，时间字段不会更新
        const currentTime = new Date().toLocaleString();  // 当前时间的字符串表示

        // 预设基准值和波动范围
        const baseValues = [
          { smokeValue: 170, fire: 0, irValue: 200, fireStatus: 0 },  // 基准值 1
          { smokeValue: 200, fire: 1, irValue: 180, fireStatus: 1 },  // 基准值 2
          { smokeValue: 297, fire: 0, irValue: 190, fireStatus: 0 },  // 基准值 3
          { smokeValue: 288, fire: 1, irValue: 205, fireStatus: 1 },   // 基准值 4
          { smokeValue: 271, fire: 0, irValue: 195, fireStatus: 0 },  // 基准值 5
        ];

        // 生成五个设备的数据，基于基准值波动
        const loraDevices = baseValues.map((base, index) => {
          // 生成随机波动
          const randomize = (value, range = 10) => value + (Math.random() - 0.5) * 2 * range; // 范围在 +/- 10 范围内

          const deviceName = `火情监测设备 ${index + 1}`;

          return {
            deviceName,
            time: currentTime, // 使用当前时间
            lora1: {
              smokeValue: randomize(base.smokeValue, 10).toFixed(1), // 一氧化碳含量波动
              fire: base.fire,
            },
            lora2: {
              irValue: randomize(base.irValue, 20).toFixed(1), // 热状态波动
              fire: base.fireStatus,
            },
            averageSmoke: (
                (parseInt(randomize(base.smokeValue, 10)) || 0) +
                (parseInt(randomize(base.irValue, 20)) || 0)
            ) / 2 || '--',
          };
        });

        // 处理其他设备数据
        const deviceData = responses[5];
        const otherDevices = deviceData.data.data.devices || [];

        // 当前时间作为固定设备的时间
        const fixedDevice = {
          deviceName: '三相智慧用电-DT240',
          time: currentTime,
          carrier: '中国移动',
          gatewayType: '4G',
          signalIntensity: '23',
          type: 2,
          state: 1,
        };

        // 合并所有设备
        this.list = [...loraDevices, ...otherDevices, fixedDevice];
        console.log(this.list);
        let timer = setTimeout(() => {
          clearTimeout(timer);
          this.defaultOption.step = this.$store.state.setting.defaultOption.step;
        }, this.$store.state.setting.defaultOption.waitTime);
      } catch (error) {
        console.error('数据请求失败:', error);
        this.pageflag = false;
        this.$Message({
          text: "数据请求失败",
          type: "error",
        });
      }
    },

    isTemperatureSensor(item) {
      return (
          (item.lora1 && item.lora1.smokeValue !== undefined) ||
          (item.lora2 && item.lora2.irValue !== undefined)
      );
    },
    // 获取网关类型的描述
    getGatewayType(type) {
      switch (type) {
        case 1:
          return "以太网";
        case 2:
          return "4G";
        case 3:
          return "WiFi";
        default:
          return "未知";
      }
    },
    // 判断设备是否在线
    isDeviceOnline(item) {
      if (item.lora1 || item.lora2) {
        // 针对火情监测设备
        return (
            item.lora1.smokeValue !== '--' ||
            item.lora2.irValue !== '--'
        );
      } else {
        // 针对普通设备
        return item.state === 1;
      }
    },
  },
};
</script>

<style lang='scss' scoped>
.left_boottom_wrap {
  overflow: hidden;
  width: 100%;
  height: 99%;
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

.left_boottom {
  width: 100%;
  height: 100%;

  .left_boottom_item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    font-size: 14px;
    margin: 10px 0;
    width: 100%; /* 确保每个条目占满整个宽度 */

    .orderNum {
      margin: 0 1px 0 -20px;
    }

    .info {
      margin-right: 20px;
      display: flex;
      align-items: center;
      color: #fff;
      white-space: nowrap;

      .labels {
        flex-shrink: 0;
        font-size: 15px;
        color: rgba(255, 255, 255, 0.6);
      }
      .zhuyao {
        color: #1890ff;
        font-size: 16px;
        width: 100%;
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
      width: 90%;
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
      font-weight: 800;
      font-size: 15px;
      width: 60px;
      flex-shrink: 0;
    }

    .types {
      width: 30px;
      flex-shrink: 0;
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
