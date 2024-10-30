<template>
  <div class="charts-container">
    <!-- dv-capsule-chart 用于柱状图 -->
    <dv-capsule-chart class="dv-cap-chart" :config="barChartConfig"/>

    <!-- echarts 用于雷达图 -->
    <div ref="radarChart" class="radar-chart"/>
  </div>
</template>

<script>
import * as echarts from "echarts";
import axios from "axios";

export default {
  data() {
    return {
      // API 列表
      apiList: [
        {url: "/api/devices", name: "7号楼断路器"},
        {url: "/api/devices1", name: "4号楼探测器"},
        {url: "/api/devices2", name: "6号楼探测器"},
        {url: "/api/devices3", name: "4号楼断路器"},
        {url: "/api/devices4", name: "3号楼断路器"},
        {url: "/api/devices5", name: "3号楼探测器"},
        {url: "/api/devices6", name: "2号楼断路器"},
        {url: "/api/devices7", name: "2号楼探测器"},
        {url: "/api/devices8", name: "6号楼断路器"}
      ],
      currentIndex: 0,
      barChartConfig: {
        data: []
      },
      radarChart: null,
      radarData: {
        indicator: [
          {name: "A相电压", max: 300},
          {name: "B相电压", max: 300},
          {name: "C相电压", max: 300},
          {name: "A相电流", max: 100},
          {name: "B相电流", max: 100},
          {name: "C相电流", max: 100}
        ],
        values: []
      }
    };
  },
  mounted() {
    this.fetchData();
    this.initRadarChart();
    this.getDataHandle = setInterval(() => {
      this.initRadarChart();
    }, 10000)
    // 每 10 秒自动切换数据
    this.switchInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.apiList.length;
      this.fetchData();
    }, 10000);
  },
  beforeDestroy() {
    this.getDataHandle()
    clearInterval(this.switchInterval);
    if (this.radarChart) this.radarChart.dispose();
  },
  methods: {
    async fetchData() {
      const {url, name} = this.apiList[this.currentIndex];
      try {
        const response = await this.$axios.get(url);
        if (response.data.success) {
          const latestData = response.data.data.list[0];
          this.updateCharts(latestData, name);
        } else {
          console.error("数据获取失败:", response.data.message);
        }
      } catch (error) {
        console.error("接口请求失败:", error);
      }
    },
    updateCharts(data, name) {
      this.barChartConfig = {
        data: [
          {name: "A相电压", value: parseFloat(data.a_voltage)},
          {name: "B相电压", value: parseFloat(data.b_voltage)},
          {name: "C相电压", value: parseFloat(data.c_voltage)},
          {name: "A相电流", value: parseFloat(data.a_current)},
          {name: "B相电流", value: parseFloat(data.b_current)},
          {name: "C相电流", value: parseFloat(data.c_current)},
        ],
        showValue: true
      };

      this.radarData.values = [
        parseFloat(data.a_voltage),
        parseFloat(data.b_voltage),
        parseFloat(data.c_voltage),
        parseFloat(data.a_current),
        parseFloat(data.b_current),
        parseFloat(data.c_current)
      ];

      if (this.radarChart) {
        this.radarChart.setOption({
          title: {text: name},
          series: [
            {
              data: [
                {
                  value: this.radarData.values,
                  name: name
                }
              ]
            }
          ]
        });
      }
    },
    initRadarChart() {
      this.radarChart = echarts.init(this.$refs.radarChart);
      const option = {
        title: {text: "", left: "center", textStyle: {color: "#fff"}},
        radar: {
          indicator: this.radarData.indicator,
          shape: "circle",
          splitNumber: 5,
          radius: ["0%", "55%"], // 调整雷达图的半径
          name: {
            textStyle: {color: "rgb(238, 197, 102)"}
          },
          splitLine: {
            lineStyle: {
              color: [
                "rgba(238, 197, 102, 0.1)",
                "rgba(238, 197, 102, 0.2)",
                "rgba(238, 197, 102, 0.4)",
                "rgba(238, 197, 102, 0.6)",
                "rgba(238, 197, 102, 0.8)",
                "rgba(238, 197, 102, 1)"
              ].reverse()
            }
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"],
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.3)"
            }
          },
          axisLine: {lineStyle: {color: "rgba(238, 197, 102, 0.5)"}}
        },
        series: [
          {
            name: "电流电压分析",
            type: "radar",
            lineStyle: {width: 1, opacity: 0.5},
            data: [
              {
                value: this.radarData.values,
                name: "当前设备",
                areaStyle: {
                  color: "rgba(255, 215, 0, 0.4)"
                }
              }
            ],
            symbol: "circle",
            symbolSize: 5,
            itemStyle: {
              color: "#F9713C"
            },
            areaStyle: {
              opacity: 0.3
            }
          }
        ]
      };
      this.radarChart.setOption(option);
    }
  }
};
</script>

<style lang="scss" scoped>
.charts-container {
  display: flex;
  width: 100%;
  height: 310px;
  align-items: center;
  justify-content: space-around; /* 增加间距 */
}

.dv-cap-chart {
  width: 55%; /* 缩小宽度以适应布局 */
  height: 75%;
  margin-right: 20px; /* 增加右边距 */
}

.radar-chart {
  width: 45%; /* 缩小宽度以适应布局 */
  height: 100%;
}
</style>
