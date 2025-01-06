<template>
  <div class="contents">
    <div class="contetn_left">
      <div class="pagetab">
        <div class="item">实时监测</div>
        <div class="item">MQTT:{{ mqttConnectionStatus }}</div>
      </div>
      <ItemWrap class="contetn_left-top contetn_lr-item-top"
                title="在线情况"
                :disableZoom="true">
        <LeftTop/>
      </ItemWrap>

      <ItemWrap class="contetn_left-center contetn_lr-item-center"
                title="辅助决策"
                :disableZoom="false">
                <LeftCenter/>
      </ItemWrap>

      <ItemWrap class="contetn_left-bottom contetn_lr-item"
                title="安全监测"
                :disableZoom="true">
        <RightBottom/>
      </ItemWrap>
    </div>
    <div class="contetn_center">
      <ItemWrap class="contetn_center-center"
                title="各车间情况表"
                :disableZoom="true">
        <LeftBottom/>
      </ItemWrap>
      <ItemWrap class="contetn_center-bottom"
                title="AI超前预警"
                :disableZoom="true">
        <CenterBottom/>
      </ItemWrap>
    </div>
    <!--    <div class="contetn_right">-->
    <!--      <ItemWrap class="contetn_left-bottom contetn_lr-item"-->
    <!--                title="使用情况"-->
    <!--                :disableZoom="true">-->
    <!--        <RightTop/>-->
    <!--      </ItemWrap>-->

    <!--      <ItemWrap class="contetn_left-bottom contetn_lr-item"-->
    <!--                title="数据展示" :disableZoom="false">-->
    <!--        <RightCenter/>-->
    <!--      </ItemWrap>-->

    <!--      <ItemWrap class="contetn_left-bottom contetn_lr-item"-->
    <!--                title="联控监测" :disableZoom="true">-->
    <!--        <RightBottom/>-->
    <!--      </ItemWrap>-->
    <!--    </div>-->
  </div>
</template>

<script>
import LeftTop from './left-top.vue'
import CenterBottom from "./center-bottom.vue";
import LeftBottom from "./left-bottom.vue";
import CenterMap from "./center-map.vue";
import LeftCenter from "./Left-center.vue";
import RightTop from "./right-top.vue";
import RightCenter from "./right-center.vue";
import RightBottom from "./right-bottom.vue";
import mqtt from "mqtt";

export default {
  components: {
    LeftTop,
    LeftCenter,
    LeftBottom,
    CenterMap,
    CenterBottom,
    RightTop,
    RightCenter,
    RightBottom,
  },
  data() {
    return {
      mqttConnectionStatus: '未连接', // 初始状态为未连接
      receivedMessages: [], // 接收消息存放数组
    };
  },
  mounted() {
    this.initMqtt();
  },
  methods: {
    initMqtt() {
      let options = {
        connectTimeout: 4000,
        clientId: '',
        protocol: 'ws',
      };
      this.client = mqtt.connect('ws://122.51.210.27:8083/mqtt', options);

      this.client.on('connect', () => {
        this.mqttConnectionStatus = '已连接';
        this.subscribes();
      });

      this.client.on('reconnect', (error) => {
        this.mqttConnectionStatus = '重连中';
      });

      this.client.on('error', (error) => {
        this.mqttConnectionStatus = '连接失败';
      });
    },
    subscribes() {
      const arr = ['led/emqx'];
      this.client.subscribe(arr, {qos: 1}, (err) => {
        if (!err) {
          console.log(`主题为：“${arr}” 的消息订阅成功`);
        }
      });
      this.client.on('message', (topic, message, packet) => {
        this.handleReceivedMessage(topic, message, packet);
      });
    },
    publish(topic, message) {
      if (!this.client.connected) {
        console.log('客户端未连接');
        return;
      }
      this.client.publish(topic, message, {qos: 0}, (err) => {
        if (!err) {
          console.log(`主题为：${topic},内容为：${message} 发布成功`);
        }
      });
    },
    handleReceivedMessage(topic, message, packet) {
      this.receivedMessages.unshift({
        topic,
        message: message.toString(),
        qos: packet.qos,
        time: new Date(),
      });
    },
    beforeDestroy() {
      this.client.end();
      this.client = null;
    },
  }
};
</script>

<style lang="scss" scoped>
// 内容
.contents {
  .contetn_left,
  .contetn_right {
    width: 540px;
    box-sizing: border-box;
    // padding: 16px 0;
  }

  .contetn_center {
    width: 1260px;
  }

  //左右两侧 三个块
  .contetn_lr-item {
    height: 380px;
  }
  .contetn_lr-item-top {
    height: 240px;
  }
  .contetn_lr-item-center {
    height: 340px;
  }

  .contetn_center_top {
    width: 100%;
  }

  // 中间
  .contetn_center {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }

  .contetn_center-center {
    height: 615px;
  }

  .contetn_center-bottom {
    height: 315px;
  }

  //左边 右边 结构一样
  .contetn_left,
  .contetn_right {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    position: relative;
  }
}


@keyframes rotating {
  0% {
    -webkit-transform: rotate(0) scale(1);
    transform: rotate(0) scale(1);
  }
  50% {
    -webkit-transform: rotate(180deg) scale(1.1);
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    -webkit-transform: rotate(360deg) scale(1);
    transform: rotate(360deg) scale(1);
  }
}
</style>
