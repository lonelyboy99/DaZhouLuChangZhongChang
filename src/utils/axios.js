import axios from "axios";
import baseURL from "."; // 引入基础 URL

// 创建 axios 实例
const instance = axios.create({
    baseURL, // 使用全局 baseURL
    timeout: 10000, // 可选：设置请求超时时间
});

export default instance;
