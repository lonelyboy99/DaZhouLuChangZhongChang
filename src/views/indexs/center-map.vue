<template>
  <div class="centermap">
    <div class="mapwrap">
      <dv-border-box-13>
        <Echart id="CenterMap" :options="options" ref="CenterMap" />
      </dv-border-box-13>
    </div>
  </div>
</template>

<script>
import xzqCode from "../../utils/map/xzqCode";
import { currentGET } from "api/modules";
import * as echarts from "echarts";
import { GETNOBASE } from "api";
export default {
  data() {
    return {
      maptitle: "南京市设备分布图",
      options: {},
      code: "320100", // Jiangsu Province code
      echartBindClick: false,
    };
  },
  mounted() {
    this.getData("320100");
  },
  methods: {
    getData() {
      // 模拟的固定数据
      const mockResponse = {
        success: true,
        data: {
          regionCode: "320100",
          dataList: [
            {
              cityCode: "320114",
              device_count: 15 // 设备数量固定为 9
            }
          ]
        }
      };
      if (mockResponse.success) {
        this.processData(mockResponse.data.regionCode, mockResponse.data.dataList);
      } else {
        this.$Message.warning(mockResponse.msg);
      }
    },
    processData(regionCode, dataList) {
      // 转换数据格式
      const processedData = dataList.map(item => ({
        name: this.getDistrictName(item.cityCode),
        value: item.device_count
      }));

      console.log("Processed Data with Device Counts:", processedData);

      this.getGeojson(regionCode, processedData);
    },
    getDistrictName(cityCode) {
      const districtNames = {
        '320102': '玄武区',
        '320104': '秦淮区',
        '320105': '建邺区',
        '320106': '鼓楼区',
        '320113': '栖霞区',
        '320114': '雨花台区',
        '320115': '江宁区',
        '320116': '六合区',
        '320117': '溧水区',
        '320118': '高淳区'
      };
      return districtNames[cityCode] || '未知区域';
    },
    /**
     * @description: 获取geojson
     * @param {*} name china 表示中国 其他省份行政区编码
     * @param {*} mydata 接口返回列表数据
     * @return {*}
     */
    async getGeojson(name, mydata) {
      this.code = name;

      let geoname = name

      let mapjson = echarts.getMap(name);
      if (mapjson) {
        mapjson = mapjson.geoJSON;
      } else {
        mapjson = await GETNOBASE(`./map-geojson/${geoname}.json`).then((res) => {
          return res;
        });
        echarts.registerMap(name, mapjson);
      }
      let cityCenter = {};
      let arr = mapjson.features;
      //根据geojson获取省份中心点
      arr.map((item) => {
        cityCenter[item.properties.name] =
            item.properties.centroid || item.properties.center;
      });
      let newData = [];
      mydata.map((item) => {
        if (cityCenter[item.name]) {
          newData.push({
            name: item.name,
            value: cityCenter[item.name].concat(item.value),
          });
        }
      });
      this.init(name, mydata, newData);
    },
    init(name, data, data2) {
      let top = 45;
      let zoom = 1.05;
      let option = {
        backgroundColor: "rgba(0,0,0,0)",
        tooltip: {
          show: false,
        },
        legend: {
          show: false,
        },
        visualMap: {
          left: 20,
          bottom: 20,
          pieces: [
            { gte: 14, label: "14个以上设备" }, // 不指定 max，表示 max 为无限大（Infinity）。
            { gte: 11, lte: 13, label: "11-13个设备" },
            { gte: 8, lte: 10, label: "8-10个设备" },
            { gte: 5, lte: 7, label: "5-7个设备" },
            { gte: 2, lte: 4, label: "2-4个设备" },
            { lte: 1, label: "1个设备" }, // 不指定 min，表示 min 为无限大（-Infinity）。
          ],
          inRange: {
            // 渐变颜色，从小到大
            color: [
              "#007760",
              "#009453",
              "#00b141",
              "#56cb29",
              "#aee205",
              "#fff500",
            ],
          },
          textStyle: {
            color: "#fff",
          },
        },
        geo: {
          map: name,
          roam: false,
          selectedMode: false, //是否允许选中多个区域
          zoom: zoom,
          top: top,
          // aspectScale: 0.78,
          show: false,
        },
        series: [
          {
            name: "MAP",
            type: "map",
            map: name,
            data: data,
            selectedMode: false, //是否允许选中多个区域
            zoom: zoom,
            geoIndex: 1,
            top: top,
            tooltip: {
              show: true,
              formatter: function (params) {
                if (params.data) {
                  return params.name + "：" + params.data["value"];
                } else {
                  return params.name;
                }
              },
              backgroundColor: "rgba(0,0,0,.6)",
              borderColor: "rgba(147, 235, 248, .8)",
              textStyle: {
                color: "#FFF",
              },
            },
            label: {
              show: false,
              color: "#000",
              formatter: function (val) {
                if (val.data !== undefined) {
                  return val.name.slice(0, 2);
                } else {
                  return "";
                }
              },
              rich: {},
            },
            emphasis: {
              label: {
                show: false,
              },
              itemStyle: {
                areaColor: "#389BB7",
                borderWidth: 1,
              },
            },
            itemStyle: {
              borderColor: "rgba(147, 235, 248, .8)",
              borderWidth: 1,
              areaColor: {
                type: "radial",
                x: 0.5,
                y: 0.5,
                r: 0.8,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(147, 235, 248, 0)", // 0% 处的颜色
                  },
                  {
                    offset: 1,
                    color: "rgba(147, 235, 248, .2)", // 100% 处的颜色
                  },
                ],
                globalCoord: false, // 缺为 false
              },
              shadowColor: "rgba(128, 217, 248, .3)",
              shadowOffsetX: -2,
              shadowOffsetY: 2,
              shadowBlur: 10,
            },
          },
          {
            data: data2,
            type: "effectScatter",
            coordinateSystem: "geo",
            symbolSize: function (val) {
              return 4;
            },
            legendHoverLink: true,
            showEffectOn: "render",
            rippleEffect: {
              scale: 6,
              color: "rgba(255,255,255, 1)",
              brushType: "fill",
            },
            tooltip: {
              show: true,
              formatter: function (params) {
                if (params.data) {
                  return params.name + "：" + params.data["value"][2];
                } else {
                  return params.name;
                }
              },
              backgroundColor: "rgba(0,0,0,.6)",
              borderColor: "rgba(147, 235, 248, .8)",
              textStyle: {
                color: "#FFF",
              },
            },
            label: {
              formatter: (param) => {
                return param.name.slice(0, 2);
              },
              fontSize: 11,
              offset: [0, 2],
              position: "bottom",
              textBorderColor: "#fff",
              textShadowColor: "#000",
              textShadowBlur: 10,
              textBorderWidth: 0,
              color: "#FFF",
              show: true,
            },
            itemStyle: {
              color: "rgba(255,255,255,1)",
              borderColor: "rgba(2255,255,255,2)",
              borderWidth: 4,
              shadowColor: "#000",
              shadowBlur: 10,
            },
          },
        ],
      };
      this.options = option;
    },
    message(text) {
      this.$Message({
        text: text,
        type: "warning",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.centermap {
  margin-bottom: 30px;

  .maptitle {
    height: 60px;
    display: flex;
    justify-content: center;
    padding-top: 10px;
    box-sizing: border-box;

    .titletext {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 6px;
      background: linear-gradient(
              92deg,
              #0072ff 0%,
              #00eaff 48.8525390625%,
              #01aaff 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 10px;
    }

    .zuo,
    .you {
      background-size: 100% 100%;
      width: 29px;
      height: 20px;
      margin-top: 8px;
    }

    .zuo {
      background: url("../../assets/img/xiezuo.png") no-repeat;
    }

    .you {
      background: url("../../assets/img/xieyou.png") no-repeat;
    }
  }

  .mapwrap {
    height: 548px;
    width: 100%;
    box-sizing: border-box;
    position: relative;
  }
}
</style>
