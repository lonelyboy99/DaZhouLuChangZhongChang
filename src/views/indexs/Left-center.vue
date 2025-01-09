<template>
  <div class="decision_support_wrap">
    <div
        v-for="(workshop, index) in list"
        :key="index"
        class="workshop-horizontal"
    >
      <div class="workshop-status-horizontal">
        <span class="workshop-name">{{ workshop.workshop_id }}</span>
        <span
            class="status-light"
            :class="{
            'light-green': workshop.state === 1,
            'light-red-blink': workshop.state === 0 || workshop.state === 2
          }"
        ></span>

        <div v-if="workshop.state !== 1" class="issue-summary">
          <div class="issue-item">
    <span class="issue-text">
      故障：
      {{
        workshop.fault_description.split(', ').join(' ')
      }}
    </span>
          </div>
          <div class="suggestion-item">
    <span class="issue-text">
      建议：
      {{
        workshop.fault_description
            .split(', ')
            .map(fault =>
                fault.includes('A相电流') || fault.includes('B相电流') || fault.includes('C相电流')
                    ? '检修负载端'
                    : fault.includes('A相电压') || fault.includes('B相电压') || fault.includes('C相电压')
                        ? '检修配电设备'
                        : fault.includes('剩余电流')
                            ? '检查线路情况'
                            : '未知故障，请检查'
            )
            .join(' ')
      }}
    </span>
          </div>
        </div>

        <div v-else class="normal-summary">
          <span class="normal-text">正常</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: [],
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
  mounted() {
    this.fetchDeviceData();
    setInterval(() => {
      this.fetchDeviceData();
    }, 10000);
  },
  methods: {
    async fetchDeviceData() {
      const promises = this.apiList.map(({ url, name }) =>
          this.$axios.get(url).then(async (res) => {
            if (res.data.success) {
              const snap = res.data.data.list[0];
              const newList = [
                { name: "A相电压", value: parseFloat(snap.a_voltage) },
                { name: "B相电压", value: parseFloat(snap.b_voltage) },
                { name: "C相电压", value: parseFloat(snap.c_voltage) },
                { name: "A相电流", value: parseFloat(snap.a_current) },
                { name: "B相电流", value: parseFloat(snap.b_current) },
                { name: "C相电流", value: parseFloat(snap.c_current) },
                { name: "剩余电流", value: parseFloat(snap.remaindeRelectric) },
              ];

              const issues = newList.filter(
                  (item) =>
                      item.value < this.normalRanges[item.name].min ||
                      item.value > this.normalRanges[item.name].max
              );

              const formatDate = (date) => {
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                const hours = String(d.getHours()).padStart(2, "0");
                const minutes = String(d.getMinutes()).padStart(2, "0");
                const seconds = String(d.getSeconds()).padStart(2, "0");

                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
              };

              const time = formatDate(new Date());

              // 如果有问题，逐条插入到数据库中
              if (issues.length > 0) {
                const issuePromises = issues.map((issue) => {
                  const payload = {
                    workshop_id: name,
                    fault_description: issue.name + "异常",
                    time: time,
                    state: 0,
                  };

                  return this.$axios.post("/api/work_order/add", payload);
                });

                // 等待所有问题插入完成
                await Promise.all(issuePromises);

                // 返回当前车间的所有故障
                return {
                  workshop_id: name,
                  fault_description: issues.map((issue) => issue.name + "异常").join(", "),
                  state: 0,
                };
              } else {
                // 如果设备恢复正常，更新工单状态为已完成
                const recoveryPayload = {
                  workshop_id: name,
                  fault_description: "恢复正常",
                };
                await this.$axios.post("/api/work_order/sync", recoveryPayload);

                // 返回正常状态
                return { workshop_id: name, fault_description: "无异常", state: 1 };
              }
            }
          })
      );

      const results = await Promise.all(promises);
      this.list = results.filter(Boolean);
    }


  },
};
</script>


<style scoped>
.workshop-name {
  font-size: 30px;
  font-weight: bold;
  margin-right: 10px;
  margin-left: 10px;
}
.decision_support_wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.workshop-status-horizontal {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
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

.issue-summary {
  color: red;
}

.issue-item {
  margin-right: 10px;
}

.suggestion-item {
  color: white;
}
.normal-text {
  font-size: 20px;
  font-weight: bold;
}
.issue-text {
  font-size: 20px;
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
