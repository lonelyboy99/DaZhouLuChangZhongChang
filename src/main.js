/*
 * @Author: daidai
 * @Date: 2022-01-12 14:05:56
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-08-07 17:12:07
 * @FilePath: \web-pc\src\pages\big-screen\main.js
 */
import Vue from "vue";
import App from "./App.vue";
import router from './router'
import store from './store'
import {loading,borderBox13,digitalFlop,capsuleChart,borderBox8} from '@jiaminghi/data-view'
import { Radio,Button,RadioGroup } from 'element-ui'
import Echart from './components/echart/index.vue'
import ItemWrap from './components/item-wrap/item-wrap.vue'
import Message from './components/message/message.vue'
import Reacquire from './components/reacquire/reacquire.vue'
import Messages from './components/message/message'
import TDesign from 'tdesign-vue'
import "vue-easytable/libs/theme-default/index.css";
import  '@/assets/css/public.scss'
import "@/assets/css/index.scss"
import 'tdesign-vue/es/style/index.css'
import * as filters from '@/directives/filters'
import axios from 'axios';

require('./mock/mock')//是否使用mock
Vue.config.productionTip = false;

// 自定义组件
Vue.component("Echart",Echart)
Vue.component("ItemWrap",ItemWrap)
Vue.component("Message",Message)
Vue.component("Reacquire",Reacquire)
Vue.prototype.$Message =  Messages
// element组件
Vue.use(Radio);
Vue.use(Button);
Vue.use(RadioGroup)
Vue.use(TDesign)
// datav组件
Vue.use(loading)
Vue.use(borderBox13)
Vue.use(borderBox8)
Vue.use(digitalFlop)
Vue.use(capsuleChart)
// 创建全局 axios 实例
const axiosInstance = axios.create({
  baseURL: "http://116.198.235.66:8030", // 全局基础 URL，直接修改此处以更换服务器
  timeout: 10000,
});
// 将 axios 实例挂载到 Vue 原型上
Vue.prototype.$axios = axiosInstance;

// 全局数据过滤器
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]));
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");