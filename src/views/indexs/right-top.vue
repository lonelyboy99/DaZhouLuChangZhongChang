<template>
  <div class="status-display">
    <div class="status-row">
      <div class="status-item">
        <p style="color: #00d2e8">在线率</p>
        <div ref="normalRateChart" class="chart"></div>
      </div>
      <div class="status-item">
        <p style="color: #359a97">离线率</p>
        <div ref="faultRateChart" class="chart"></div>
      </div>
    </div>
    <div class="status-row bar-chart">
      <p style="color: #6bfbce">信号强度</p>
      <div ref="barChart" class="chart"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';

export default {
  data() {
    return {
      normalRate: 0,
      faultRate: 0,
      deviceNames: [],  // 横坐标设备名称
      signalIntensityData: [] // 纵坐标信号质量数据
    };
  },
  mounted() {
    this.fetchData();
    this.initCharts();
    this.getDataHandle = setInterval(() => {
      this.fetchData();
      this.initCharts();
    },10000)
  },
  beforeDestroy() {
    clearInterval(this.getDataHandle)
  },
  methods: {
    async fetchData() {
      try {
        const response = await this.$axios.get('/proxy/deviceList');
        if (response.data.success) {
          const { totalDevices, offlineDevices, devices } = response.data.data;

          // 正常使用率和故障率计算
          this.normalRate = Math.floor((totalDevices - offlineDevices) / totalDevices * 100);
          this.faultRate = Math.floor((offlineDevices / totalDevices) * 100);

          // 从设备列表中提取设备名称和信号质量数据
          this.deviceNames = devices.map(device => device.deviceName);
          this.signalIntensityData = devices.map(device => device.signalIntensity);

          // 更新图表数据
          this.updateCharts();
        }
      } catch (error) {
        console.error("数据获取失败：", error);
      }
    },
    initCharts() {
      this.normalRateChart = echarts.init(this.$refs.normalRateChart);
      this.faultRateChart = echarts.init(this.$refs.faultRateChart);
      this.barChart = echarts.init(this.$refs.barChart);
      this.updateCharts();
    },
    updateCharts() {
      this.createPieChart(this.normalRateChart, this.normalRate, '#3fc0fb');
      this.createPieChart(this.faultRateChart, this.faultRate, '#ff9800');
      this.createBarChart();
    },
    createPieChart(chart, percentage, color) {
      chart.setOption({
        series: [
          {
            name: '使用率',
            type: 'pie',
            radius: ['75%', '90%'],
            avoidLabelOverlap: false,
            startAngle: 225,
            color: [
              new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#00a2eb" },
                { offset: 0.2, color: "#00d2e8" },
                { offset: 1, color: "#6bfbce" }
              ]),
              'transparent'
            ],
            hoverAnimation: false,
            label: {
              show: true,
              position: 'center',
              formatter: () => `${percentage}%`,
              fontSize: 18,
              fontWeight: 'bold',
              color: percentage > 0 ? color : 'rgba(255,255,255,0.3)',
            },
            data: [
              { value: percentage, name: '达标率' },
              { value: 100 - percentage, name: '未达标', itemStyle: { color: 'rgba(255,255,255,0.1)' } }
            ]
          }
        ]
      });
    },
    createBarChart() {
      this.barChart.setOption({
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          textStyle:{color:"#fff"},
          axisPointer: {
            type: "shadow",
            label: {
              show: true,
              backgroundColor: "#7B7DDC",
            }
          }
        },

        legend: {
          data: ["信号质量"],
          textStyle: {
            color: "#B4B4B4"
          },
          top: "0%"
        },
        grid: {
          x: "8%",
          width: "88%",
          y: "4%"
        },
        xAxis: {
          type: 'category',
          data: this.deviceNames,
          axisLabel: { color: '#7EB7FD' },
          axisLine: { lineStyle: { color: '#7EB7FD' } },
        },
        yAxis: {
          type: 'value',
          name: '信号质量',
          axisLabel: {color: '#7EB7FD'},
          splitLine: { show: false },
          axisLine: {lineStyle: {color: '#7EB7FD'}},
        },
        series: [
          {
            data: this.signalIntensityData, // 信号质量数据
            type: 'bar',
            barWidth: '70%',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {offset: 0, color: "rgba(156,107,211,0.8)"},
                {offset: 0.2, color: "rgba(156,107,211,0.5)"},
                {offset: 1, color: "rgba(156,107,211,0.2)"}
              ])
            }
          }
        ],
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.status-display {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .status-row {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-bottom: 5px;

    .status-item {
      text-align: center;
      color: #c3cbde;
      font-size: 14px;
      width: 50%;

      .chart {
        width: 100%;
        height: 100px;
      }
    }

    &.bar-chart {
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: #c3cbde;

      .chart {
        width: 100%;
        height: 170px;
      }
    }
  }
}
</style>
