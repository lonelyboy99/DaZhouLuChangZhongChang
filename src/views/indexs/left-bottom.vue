<template>
  <div
      v-if="pageflag"
      class="left_extra_wrap beautify-scroll-def"
      :class="{ 'overflow-y-auto': !sbtxSwiperFlag }"
  >
    <component :is="components" :data="list" :class-option="defaultOption">
      <div v-for="(workshop, index) in list" :key="index">
        <!-- 显示车间名称 -->
        <div>
          <strong class="workshop-name">{{ workshop.name }}</strong>
        </div>

        <!-- 显示设备数据 -->
        <ul class="left_extra">
          <li class="left_extra_item" v-for="(item, i) in workshop.devices" :key="i">
            <div class="inner_right">
              <div class="flex">
                <div class="info addresswrap">
                  <span class="labels">数据类型：</span>
                  <span class="contents zhuyao doudong wangguan">{{ item.name }}</span>
                </div>
                <div class="info addresswrap">
                  <span class="labels">当前值：</span>
                  <span class="contents zhuyao doudong wangguan">{{ item.value }}</span>
                </div>
                <div class="info addresswrap">
                  <span class="labels">正常范围：</span>
                  <span class="contents zhuyao doudong wangguan">{{ item.previousValue }}</span>
                </div>
              </div>
              <div class="flex">
                <div class="info">
                  <span class="labels">更新时间：</span>
                  <span class="contents" style="font-size: 20px">{{ item.updateTime }}</span>
                </div>
                <span class="types doudong" style="font-size: 20px" :class="{
                    typeRed: item.status === '异常',
                    typeGreen: item.status === '正常',
                  }">
                  {{ item.status }}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </component>
  </div>

  <Reacquire v-else @onclick="fetchDeviceData" style="line-height: 200px"/>
</template>

<script>
import axios from "axios";
import vueSeamlessScroll from "vue-seamless-scroll"; // vue2引入方式
import Kong from "../../components/kong.vue";

export default {
  components: {vueSeamlessScroll, Kong},
  data() {
    return {
      list: [], // 将list改为存储车间及设备数据的数组
      pageflag: true,
      updateTime: "", // 用于存储接口调用时间
      deviceName: "", // 当前显示设备名称
      components: vueSeamlessScroll,
      defaultOption: {
        ...this.$store.state.setting.defaultOption,
        singleHeight: 410,
        limitMoveNum: 5,
        step: 0,
      },
      previousDataMap: {}, // 用于存储每个设备的上次数据
      apiList: [
        {url: "/api/devices6", name: "2#幢"},
        {url: "/api/devices4", name: "3#幢"},
        {url: "/api/devices3", name: "4#幢"},
        {url: "/api/devices8", name: "6#幢"},
        {url: "/api/devices", name: "7#幢"},
      ],
      normalRanges: {
        "A相电压": { min: 210, max: 250 },
        "B相电压": { min: 210, max: 250 },
        "C相电压": { min: 210, max: 250 },
        "A相电流": { min: 0, max: 100 },
        "B相电流": { min: 0, max: 100 },
        "C相电流": { min: 0, max: 100 },
        "剩余电流": { min: 0, max: 30 },
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
      // const currentTime = new Date().toLocaleString();
      // this.updateTime = currentTime;

      const promises = this.apiList.map(({url, name}) => {
        return this.$axios.get(url).then((res) => {
          if (res.data.success) {
            const snap = res.data.data.list[0]; // 获取最新的数据
            // 获取或初始化该设备的 previousData
            if (!this.previousDataMap[url]) {
              this.previousDataMap[url] = [];
            }
            const previousData = this.previousDataMap[url];

            // 创建新的数据列表
            const newList = [
              {name: "A相电压", value: parseFloat(snap.a_voltage)},
              {name: "B相电压", value: parseFloat(snap.b_voltage)},
              {name: "C相电压", value: parseFloat(snap.c_voltage)},
              {name: "A相电流", value: parseFloat(snap.a_current)},
              {name: "B相电流", value: parseFloat(snap.b_current)},
              {name: "C相电流", value: parseFloat(snap.c_current)},
              {name: "剩余电流", value: parseFloat(snap.remaindeRelectric)},
            ];

            // 更新每个车间的设备数据
            return {
              name: name, // 将车间名称作为每个车间的数据
              devices: newList.map((item) => {
                const range = this.normalRanges[item.name];
                const previousValue = `${range.min} - ${range.max}`; // 显示为范围值
                const status = this.calculateStatus(item.value, range);

                return {
                  ...item,
                  previousValue,
                  status,
                  updateTime:snap.time,
                  trend: this.calculateTrend(item.value, range.min),
                };
              }),
            };
          }
        }).catch(error => {
          console.error("接口请求失败:", error);
        });
      });

      // 等待所有接口请求完成后更新数据
      Promise.all(promises).then(results => {
        this.list = results.filter(Boolean); // 过滤掉失败的请求结果
        let timer = setTimeout(() => {
          clearTimeout(timer);
          this.defaultOption.step = this.$store.state.setting.defaultOption.step;
        }, this.$store.state.setting.defaultOption.waitTime);
        this.previousDataMap = this.list.reduce((map, workshop) => {
          map[workshop.name] = workshop.devices;
          return map;
        }, {});
      });
    },

    calculateTrend(currentValue, minValue) {
      if (currentValue > minValue) {
        return "up";
      } else if (currentValue < minValue) {
        return "down";
      }
      return "normal";
    },

    calculateStatus(currentValue, range) {
      if (currentValue < range.min || currentValue > range.max) {
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

.workshop-name {
  color: #1890ff;
  font-weight: 900;
  font-size: 35px;
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
      margin-top: 8px;
      display: flex;
      align-items: center;
      color: #fff;

      .labels {
        flex-shrink: 0;
        font-size: 20px;
        color: rgba(255, 255, 255, 0.6);
      }

      .zhuyao {
        color: #1890ff;
        font-size: 25px;
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
        margin-left: 50px;
      }
    }

    .wangguan {
      color: #1890ff;
      font-weight: 700;
      font-size: 20px;
      width: 120px;
      flex-shrink: 0;
    }

    .types {
      margin-top: 8px;
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