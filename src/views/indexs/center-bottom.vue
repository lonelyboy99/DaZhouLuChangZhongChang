<template>
  <div class="left_bottom_top">
    <Echart :options="options" ref="bottomLeftTopChart" class="echarts_bottom"></Echart>
    <!-- 预警消息显示 -->
    <div :class="['warning-message', warningLevel]" v-if="showWarning">
      <span>{{ warningMessage }}</span>
    </div>
    <!-- 切换接口按钮 -->
    <button @click="toggleApi" class="switch-button">{{ apiUrl === '/api/predict' ? '预警测试' : '默认' }}</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      options: {},
      intervalId: null,
      showWarning: false,
      maxFailureRate: 0.2, // 最大故障率 20%
      warningThreshold: 10.0, // 预警阈值（百分比）
      criticalThreshold: 15.0, // 报警阈值（百分比）
      warningMessage: '', // 存储警告信息
      warningLevel: '', // 用于不同预警级别的样式
      apiUrl: '/api/predict', // 默认接口
      dataMapping: { // 默认映射配置
        workshop_2: 'workshop_6',
        workshop_3: 'workshop_4',
        workshop_4: 'workshop_3',
        workshop_6: 'workshop_8',
        workshop_7: 'workshop',
      },
    };
  },
  mounted() {
    this.updateData(); // 初始化时获取数据
    this.intervalId = setInterval(() => {
      this.updateData();
    }, 30000); // 每10秒更新一次
  },
  beforeDestroy() {
    clearInterval(this.intervalId);
  },
  methods: {
    toggleApi() {
      if (this.apiUrl === '/api/predict') {
        this.apiUrl = '/api/predict/test';
        this.dataMapping = {
          workshop_2: 'workshop_2',
          workshop_3: 'workshop_3',
          workshop_4: 'workshop_4',
          workshop_6: 'workshop_6',
          workshop_7: 'workshop_7',
        };
      } else {
        this.apiUrl = '/api/predict';
        this.dataMapping = {
          workshop_2: 'workshop_6',
          workshop_3: 'workshop_4',
          workshop_4: 'workshop_3',
          workshop_6: 'workshop_8',
          workshop_7: 'workshop',
        };
      }
      this.updateData(); // 切换接口后立即更新数据
    },
    async updateData() {
      try {
        const response = await this.$axios.get(this.apiUrl);
        const data = response.data.reverse();

        if (!data || data.length === 0) {
          console.warn("No data received from the API.");
          return;
        }

        // 动态解析数据
        const timestamps = data.map(item => item.timestamp);
        const workshopData = {
          workshop_2: data.map(item => parseFloat(item[this.dataMapping.workshop_2])),
          workshop_3: data.map(item => parseFloat(item[this.dataMapping.workshop_3])),
          workshop_4: data.map(item => parseFloat(item[this.dataMapping.workshop_4])),
          workshop_6: data.map(item => parseFloat(item[this.dataMapping.workshop_6])),
          workshop_7: data.map(item => parseFloat(item[this.dataMapping.workshop_7])),
        };

        // 更新图表数据
        this.options = this.createChartOptions(timestamps, workshopData);

        // 检查是否需要触发预警
        this.checkForWarnings(workshopData);

        // 刷新图表
        this.$refs.bottomLeftTopChart && this.$refs.bottomLeftTopChart.resize();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    createChartOptions(timestamps, workshopData) {
      return {
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(0,0,0,.6)",
          borderColor: "rgba(147, 235, 248, .8)",
          textStyle: {
            color: "#FFF",        // 文字颜色
            fontSize: 18,         // 字体大小设置为18（可以根据需要调节）
          },
          formatter: function (params) {
            let result = params[0].name + "<br>";
            params.forEach(function (item) {
              result += item.marker + " " + item.seriesName + " : " + item.value + (item.seriesName.includes("风险指数") ? "%" : "") + "</br>";
            });
            return result;
          },
        },
        legend: {
          data: ["2# 健康度", "3# 健康度", "4# 健康度", "6# 健康度", "7# 健康度", "2# 风险指数", "3# 风险指数", "4# 风险指数", "6# 风险指数", "7# 风险指数"],
          textStyle: { color: "#B4B4B4", fontSize: 16 },
          top: "0",
        },
        grid: { left: "50px", right: "40px", bottom: "30px", top: "80px" },
        xAxis: {
          data: timestamps,
          axisLine: { lineStyle: { color: "#B4B4B4" } },
          axisTick: { show: false },
          axisLabel: {
            fontSize: 20,
            margin: 8,
          },
        },
        yAxis: [
          {
            splitLine: { show: false },
            axisLine: { lineStyle: { color: "#B4B4B4" } },
            axisLabel: { formatter: "{value}%", fontSize: 16 },
          },
          {
            splitLine: { show: false },
            axisLine: { lineStyle: { color: "#B4B4B4" } },
            axisLabel: { formatter: "{value}%", fontSize: 15 },
            min: 0,
            max: 60,
          },
        ],
        series: [
          // 健康度的线条部分
          ...["2", "3", "4", "6", "7"].map(num => ({
            name: `${num}# 健康度`,
            type: "line",
            smooth: true,
            data: workshopData[`workshop_${num}`],
            lineStyle: {
              color: ['#5A8F8D', '#4E79A7', '#A6A6A6', '#9C27B0', '#7D5F28'][num - 2]  // 蓝色、绿色、紫色、灰色系
            },
          })),
          // 风险指数的柱状图部分
          ...["2", "3", "4", "6", "7"].map(num => ({
            name: `${num}# 风险指数`,
            type: "bar",
            stack: "风险指数",
            yAxisIndex: 1,
            barWidth: "30%",
            data: workshopData[`workshop_${num}`].map(value => {
              const failureRate = this.maxFailureRate * (1 - value / 100) * 100;
              return failureRate.toFixed(2);
            }),
            itemStyle: {
              color: ['#6A5ACD', '#32CD32', '#20B2AA', '#8A2BE2', '#4682B4'][num - 2]  // 紫色、绿色、青色、蓝紫色
            },
          })),
        ],
      };
    },

    checkForWarnings(workshopData) {
      const workshops = ['workshop_2', 'workshop_3', 'workshop_4', 'workshop_6', 'workshop_7'];
      const workshopNames = {
        workshop_2: 2,
        workshop_3: 3,
        workshop_4: 4,
        workshop_6: 6,
        workshop_7: 7,
      };
      let warningWorkshops = [];
      let maxLevel = ''; // 保存当前最高的预警级别
      let messageParams = []; // 用于保存短信的参数

      const currentTime = new Date(); // 当前时间

      workshops.forEach((workshopKey) => {
        const dataArray = workshopData[workshopKey];
        const latestHealthValue = dataArray[dataArray.length - 1]; // 取最新的数据
        const failureRate = this.maxFailureRate * (1 - latestHealthValue / 100) * 100; // 故障率（百分比）
        const predictionTimeStr = this.options.xAxis.data[dataArray.length - 1]; // 获取对应的预测时间字符串
        const predictionTime = new Date(predictionTimeStr); // 将预测时间转换为 Date 对象

        // 计算预测时间与当前时间的差值（小时）
        const timeDiff = (predictionTime - currentTime) / (1000 * 60 * 60);
        const hoursUntilPrediction = Math.max(0, Math.floor(timeDiff)); // 取整数部分

        // 检查故障率是否超过阈值，并根据级别设置消息
        if (failureRate >= this.criticalThreshold) {
          warningWorkshops.push(`车间 ${workshopNames[workshopKey]} 风险指数预计在 ${hoursUntilPrediction} 小时后达到 ${Math.floor(failureRate)}%，需要立即处理！`);
          maxLevel = 'critical'; // 设置为最高级别

          // 将超过阈值的车间数据添加到 messageParams 中
          messageParams.push(workshopNames[workshopKey], hoursUntilPrediction, Math.floor(failureRate));
        } else if (failureRate >= this.warningThreshold) {
          warningWorkshops.push(`车间 ${workshopNames[workshopKey]} 风险指数预计在 ${hoursUntilPrediction} 小时后达到 ${Math.floor(failureRate)}%，请注意监控。`);
          if (maxLevel !== 'critical') maxLevel = 'warning'; // 仅在没有更高级别的情况下设置

          // 将超过警告阈值的车间数据添加到 messageParams 中
          messageParams.push(workshopNames[workshopKey], hoursUntilPrediction, Math.floor(failureRate));
        }
      });

      if (warningWorkshops.length > 0) {
        this.showWarning = true;
        this.warningMessage = warningWorkshops.join('\n');
        this.warningLevel = maxLevel; // 设置样式级别
        this.sendWarningMessage(messageParams);
      } else {
        this.showWarning = false;
        this.warningMessage = '';
        this.warningLevel = '';
      }
    },

// 修改后的发送预警信息的方法
    async sendWarningMessage(messageParams) {

      // 分组处理 messageParams，每三个元素一组
      for (let i = 0; i < messageParams.length; i += 3) {
        const workshopNum = messageParams[i]; // 车间
        const hoursUntilPrediction = messageParams[i + 1]; // 预计时间差
        const failureRate = messageParams[i + 2]; // 风险指数

        // 构建短信内容
        const message = `车间 ${workshopNum} 风险指数预计在 ${hoursUntilPrediction} 小时后达到 ${failureRate}%，请注意监控。`;

        // 调用后端接口发送短信
        try {
          await this.$axios.post('/api/message', {
            message,
            params: [workshopNum, hoursUntilPrediction, failureRate]
          });
          console.log(`车间 ${workshopNum} 的预警信息已发送。`);
        } catch (error) {
          console.error(`发送车间 ${workshopNum} 预警信息时出错：`, error);
        }
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.left_bottom_top {
  width: 100%;
  height: 100%;
  position: relative;

  .echarts_bottom {
    width: 100%;
    height: 100%;
  }

  .switch-button {
    position: absolute;
    top: 30px; /* 调整为离顶部更近 */
    right: 1px; /* 与右侧边缘保持距离 */
    padding: 2px 8px;
    background-color: rgba(0, 123, 255, 0.27);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 15px;
    z-index: 1000; /* 确保按钮在图表之上 */
  }

  .switch-button:hover {
    background-color: #0056b3;
  }

  .warning-message {
    color: red;
    font-weight: bold;
    position: absolute;
    top: 50px;
    right: 45px;
    background: rgba(255, 255, 0, 0.9);
    padding: 10px;
    border-radius: 5px;
    z-index: 1000;
    white-space: pre-wrap;
    transition: background 0.3s, color 0.3s;
  }

  .warning-message.warning {
    color: rgb(255, 250, 0);
    background: rgba(255, 150, 0, 0.21);
  }

  .warning-message.critical {
    color: rgba(255, 255, 0, 0.79);
    background: rgba(211, 47, 47, 0.36);
    border: 2px solid rgba(183, 28, 28, 0.5);
    font-weight: bolder;
  }
}
</style>