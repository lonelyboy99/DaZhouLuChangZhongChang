<template>
  <div class="center_bottom">
    <Echart
        :options="options"
        id="bottomLeftChart"
        class="echarts_bottom"
    ></Echart>
  </div>
</template>

<script>
export default {
  data() {
    return {
      options: {},
      apiList: [
        {url: "/api/devices", name: "7号楼断路器"},
        {url: "/api/devices1", name: "4号楼探测器"},
        {url: "/api/devices2", name: "6号楼探测器"},
        {url: "/api/devices3", name: "4号楼断路器"},
        {url: "/api/devices4", name: "3号楼断路器"},
        {url: "/api/devices5", name: "3号楼探测器"},
        {url: "/api/devices6", name: "2号楼断路器"},
        {url: "/api/devices7", name: "2号楼探测器"},
        {url: "/api/devices8", name: "6号楼断路器"},
      ],
    };
  },
  mounted() {
    this.getData();
    this.intervalId = setInterval(() => {
      this.getData();
    }, 10000); // 每10秒更新一次
  },
  methods: {
    getData() {
      const allDataPromises = this.apiList.map((api) => {
        return this.$axios.get(api.url).then((res) => { // 使用全局 axios 实例
          console.log(`完整的响应数据 (${api.url}):`, res.data);
          if (res.data && res.data.data && Array.isArray(res.data.data.list)) {
            return {name: api.name, data: res.data.data.list};
          } else {
            console.warn(`从 ${api.url} 获取的数据结构不符合预期`);
            return null;
          }
        }).catch((error) => {
          console.error(`请求 ${api.url} 出错:`, error);
          return null;
        });
      });

      Promise.all(allDataPromises).then((results) => {
        const filteredResults = results.filter(result => result !== null);
        if (filteredResults.length > 0) {
          this.init(filteredResults);
        } else {
          this.$Message({
            text: "未能获取到任何数据",
            type: "warning",
          });
        }
      });
    },
    init(allData) {
      // 整理图表 series 数据，使用每个设备的头十条数据并反转顺序
      const combinedSeries = allData.map((deviceData) => {
        const firstTenData = deviceData.data.slice(0, 10).reverse(); // 获取头十条数据并反转顺序
        return {
          name: deviceData.name, // 使用对应的名称
          type: "line",
          smooth: true,
          showAllSymbol: true,
          symbol: "emptyCircle",
          symbolSize: 8,
          yAxisIndex: 0, // 使用第一个y轴 (mA)
          data: firstTenData.map(item => item.remaindeRelectric),
        };
      });

      // 使用第一个设备的时间数据作为 X 轴，并将时间反转
      const category = allData.length > 0 ? allData[0].data.slice(0, 10).map(item => item.time).reverse() : [];

      this.options = {
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(0,0,0,.6)",
          borderColor: "rgba(147, 235, 248, .8)",
          textStyle: {
            color: "#FFF",
          },
          formatter: function (params) {
            let result = params[0].name + "<br>";
            params.forEach(function (item) {
              result +=
                  item.marker +
                  " " +
                  item.seriesName +
                  " : " +
                  item.value +
                  " mA</br>";
            });
            return result;
          },
        },
        legend: {
          data: combinedSeries.map((s) => s.name),
          textStyle: {
            color: "#B4B4B4",
          },
          top: "0",
        },
        grid: {
          left: "50px",
          right: "40px",
          bottom: "30px",
          top: "20px",
        },
        xAxis: {
          data: category,
          axisLine: {
            lineStyle: {
              color: "#B4B4B4",
            },
          },
          axisTick: {
            show: false,
          },
        },
        yAxis: [
          {
            type: 'value',
            show: false, // 隐藏纵轴
            splitLine: {show: false},
            axisLine: {
              lineStyle: {
                color: "#B4B4B4",
              },
            },
          },
        ],
        series: combinedSeries,
      };
    },
  },
  beforeDestroy() {
    clearInterval(this.intervalId);
  },
};
</script>

<style lang="scss" scoped>
.center_bottom {
  width: 100%;
  height: 100%;

  .echarts_bottom {
    width: 100%;
    height: 100%;
  }
}
</style>
