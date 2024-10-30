<template>
  <ul class="user_Overview flex" v-if="pageflag">
    <li class="user_Overview-item" style="color: #00fdfa">
      <div class="user_Overview_nums allnum">
        <dv-digital-flop :config="totalDevicesConfig" style="width:100%;height:100%;"/>
      </div>
      <p>设备总数</p>
    </li>
    <li class="user_Overview-item" style="color: #07f7a8">
      <div class="user_Overview_nums online">
        <dv-digital-flop :config="onlineDevicesConfig" style="width:100%;height:100%;"/>
      </div>
      <p>在线设备</p>
    </li>
    <li class="user_Overview-item" style="color: #e3b337">
      <div class="user_Overview_nums offline">
        <dv-digital-flop :config="offlineDevicesConfig" style="width:100%;height:100%;"/>
      </div>
      <p>离线设备</p>
    </li>
    <li class="user_Overview-item" style="color: #f5023d">
      <div class="user_Overview_nums alert">
        <dv-digital-flop :config="alertDevicesConfig" style="width:100%;height:100%;"/>
      </div>
      <p>报警设备</p>
    </li>
  </ul>
</template>

<script>
export default {
  data() {
    return {
      totalDevices: 0, // 设备总数
      onlineDevices: 0, // 在线设备数
      offlineDevices: 0, // 离线设备数
      alertDevices: 0, // 报警设备数
      pageflag: true,
    };
  },
  mounted() {
    this.fetchDeviceData();
    this.updateInterval = setInterval(() => {
      this.fetchDeviceData();
    }, 10000); // 每10秒更新一次
  },
  beforeDestroy() {
    clearInterval(this.updateInterval);
  },
  methods: {
    async fetchDeviceData() {
      try {
        const res = await this.$axios.get('/proxy/deviceList');
        if (res.data.success) {
          this.totalDevices = res.data.data.totalDevices || 0; // 设备总数
          this.onlineDevices = res.data.data.onlineDevices || 0; // 在线设备数
          this.offlineDevices = res.data.data.offlineDevices || 0; // 离线设备数
          this.alertDevices = res.data.data.alertDevices || 0; // 报警设备数
        } else {
          console.error('获取设备参数数据失败:', res.data.message);
        }
      } catch (error) {
        console.error('API调用失败:', error);
      }
    },
    close() {
      this.visible = false;
    }
  },
  computed: {
    totalDevicesConfig() {
      return {
        number: [this.totalDevices],
        content: '{nt}',
        toFixed: 2,
        style: {
          fontSize: 24,
          fill: "#00fdfa",
        },
      };
    },
    onlineDevicesConfig() {
      return {
        number: [this.onlineDevices],
        content: '{nt}',
        style: {
          fontSize: 24,
          fill: "#07f7a8",
        },
      };
    },
    offlineDevicesConfig() {
      return {
        number: [this.offlineDevices],
        content: '{nt}',
        style: {
          fontSize: 24,
          fill: "#e3b337",
        },
      };
    },
    alertDevicesConfig() {
      return {
        number: [this.alertDevices],
        content: '{nt}',
        toFixed: 2,
        style: {
          fontSize: 24,
          fill: "#f5023d",
        },
      };
    },
  },
};
</script>

<style lang='scss' scoped>
.user_Overview {
  li {
    flex: 1;

    p {
      text-align: center;
      height: 16px;
      font-size: 16px;
    }

    .user_Overview_nums {
      width: 100px;
      height: 100px;
      text-align: center;
      line-height: 100px;
      font-size: 22px;
      margin: 50px auto 30px;
      background-size: cover;
      background-position: center center;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
      }

      &.bgdonghua::before {
        animation: rotating 14s linear infinite;
      }
    }

    .allnum {
      &::before {
        background-image: url("../../assets/img/left_top_lan.png");
      }
    }

    .online {
      &::before {
        background-image: url("../../assets/img/left_top_lv.png");
      }
    }

    .offline {
      &::before {
        background-image: url("../../assets/img/left_top_huang.png");
      }
    }

    .alert {
      &::before {
        background-image: url("../../assets/img/left_top_hong.png");
      }
    }
  }
}
</style>
