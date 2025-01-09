<template>
  <div
      v-if="pageflag"
      class="decision_support_wrap beautify-scroll-def"
      :class="{ 'overflow-y-auto': !sbtxSwiperFlag }"
  >
    <component :is="components" :data="list" :class-option="defaultOption">
      <div
          v-for="(workshop, index) in list"
          :key="index"
          class="workshop-horizontal"
      >
        <!-- 显示车间名称及状态灯 -->
        <div class="workshop-status-horizontal">
          <span class="workshop-name">{{ workshop.name }}</span>
          <span
              class="status-light"
              :class="{
              'light-green': workshop.issueCount === 0,
              'light-red-blink': workshop.issueCount > 0
            }"
          ></span>

          <!-- 正常或异常信息 -->
          <div v-if="workshop.issueCount === 0" class="normal-status">
            <span class="normal-text">正常</span>
          </div>
          <div v-else class="issue-summary">
            <!-- 异常信息 -->
            <div
                class="issue-item"
                v-for="(issue, index) in workshop.issues"
                :key="issue.name"
            >
              <span class="issue-text">
                <span v-if="index === 0">故障：</span>
                {{
                  issue.name === 'A相电压' || issue.name === 'B相电压' || issue.name === 'C相电压'
                      ? '相电压过高'
                      : issue.name === 'A相电流' || issue.name === 'B相电流' || issue.name === 'C相电流'
                          ? '相电流过载'
                          : '剩余电流异常'
                }}
              </span>
            </div>

            <!-- 建议信息 -->
            <div class="suggestion-item">
              <span class="issue-text">
                建议：
                {{ workshop.issues.some(issue => issue.name === 'A相电压') ? '检修配电设备' : '' }}
                {{ workshop.issues.some(issue => issue.name === 'B相电压') ? ' 检修配电设备' : '' }}
                {{ workshop.issues.some(issue => issue.name === 'C相电压') ? ' 检修配电设备' : '' }}
                {{ workshop.issues.some(issue => issue.name === 'A相电流') ? ' 检修负载端' : '' }}
                {{ workshop.issues.some(issue => issue.name === 'B相电流') ? ' 检修负载端' : '' }}
                {{ workshop.issues.some(issue => issue.name === 'C相电流') ? ' 检修负载端' : '' }}
                {{ workshop.issues.some(issue => issue.name === '剩余电流') ? ' 检查线路情况' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </component>
  </div>

  <Reacquire v-else @onclick="fetchDeviceData" style="line-height: 200px" />
</template>

<script>
import vueSeamlessScroll from "vue-seamless-scroll";
import Kong from "../../components/kong.vue";

export default {
  components: { vueSeamlessScroll, Kong },
  data() {
    return {
      editVisible: false,
      list: [],
      pageflag: true,
      components: vueSeamlessScroll,
      defaultOption: {
        ...this.$store.state.setting.defaultOption,
        singleHeight: 410,
        limitMoveNum: 5,
        step: 0,
      },
      apiList: [
        { url: "/api/devices6", name: "2#幢" },
        { url: "/api/devices4", name: "3#幢" },
        { url: "/api/devices3", name: "4#幢" },
        { url: "/api/devices8", name: "6#幢" },
        { url: "/api/devices", name: "7#幢" },
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
      this.components = sbtxSwiper ? vueSeamlessScroll : Kong;
      return sbtxSwiper;
    },
  },

  mounted() {
    this.fetchDeviceData();
    this.getDataHandle = setInterval(() => {
      this.fetchDeviceData();
    }, 10000);
  },
  beforeDestroy() {
    clearInterval(this.getDataHandle);
  },
  methods: {
    fetchDeviceData() {
      this.pageflag = true;

      const promises = this.apiList.map(({ url, name }) => {
        return this.$axios
            .get(url)
            .then((res) => {
              if (res.data.success) {
                const snap = res.data.data.list[0];
                let issues = [];
                let hasCurrentLeak = false;

                const newList = [
                  { name: "A相电压", value: parseFloat(snap.a_voltage) },
                  { name: "B相电压", value: parseFloat(snap.b_voltage) },
                  { name: "C相电压", value: parseFloat(snap.c_voltage) },
                  { name: "A相电流", value: parseFloat(snap.a_current) },
                  { name: "B相电流", value: parseFloat(snap.b_current) },
                  { name: "C相电流", value: parseFloat(snap.c_current) },
                  { name: "剩余电流", value: parseFloat(snap.remaindeRelectric) },
                ];

                newList.forEach((item) => {
                  const range = this.normalRanges[item.name];
                  const status = this.calculateStatus(item.value, range);
                  if (status === "异常") {
                    issues.push({ name: item.name });
                    if (item.name === "剩余电流") {
                      hasCurrentLeak = true;
                    }
                  }
                });

                return {
                  name,
                  issueCount: issues.length,
                  hasCurrentLeak,
                  issues,
                };
              }
            })
            .catch((error) => {
              console.error("接口请求失败:", error);
            });
      });

      Promise.all(promises).then((results) => {
        this.list = results.filter(Boolean);
      });
    },

    calculateStatus(currentValue, range) {
      return currentValue < range.min || currentValue > range.max ? "异常" : "正常";
    },
  },
};
</script>

<style lang="scss" scoped>
.decision_support_wrap {
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.workshop-status-horizontal {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  margin-left: 40px;
}

.status-light {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 10px;
}

.light-red-blink {
  background-color: red;
  animation: blink 1s infinite;
}

.light-green {
  background-color: green;
}

.workshop-name {
  font-size: 20px;
  font-weight: bold;
  margin-right: 10px;
}

.issue-summary {
  margin-top: 10px;
  color: red;
}

.issue-item {
  white-space: nowrap;
  display: inline-block;
  margin-right: 10px;
}

.suggestion-item {
  margin-top: 5px;
  color: white;
}

.normal-status {
  color: green;
}

.normal-text {
  font-size: 16px;
  font-weight: bold;
}

.issue-text {
  font-size: 16px;
  font-weight: bold;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
