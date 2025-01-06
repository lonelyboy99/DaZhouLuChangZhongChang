const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const axios = require("axios");
const JDCloud = require('jdcloud-sdk-js');
const app = express();
const port = 8030;

app.use(cors());
app.use(bodyParser.json());

let db

function handleDisconnect() {
    db = mysql.createConnection({
        host: "116.198.235.66",
        user: "dzlczc",
        password: "dzlczc",
        database: "大周路厂中厂",
        connectTimeout: 10000,
    });

    db.connect(err => {
        if (err) {
            console.error('数据库连接失败: ' + err.stack);
            setTimeout(handleDisconnect, 2000); // 2秒后重试连接
        } else {
            console.log('已连接到数据库');
        }
    });

    db.on('error', err => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // 自动重连
        } else {
            throw err;
        }
    });
}

handleDisconnect(); // 初始连接数据库

// 默认获取 token 并设置全局变量
let token = null;
const getToken = async () => {
    try {
        const response = await axios.post("https://api.aizyiot.cn:6060/user/login", null, {
            params: {
                username: "wwg",
                password: "20240814"
            }
        });
        if (response.data.code === 200) {
            token = response.data.data.token;
            console.log("Token 已获取:", token);
        } else {
            console.error("获取 Token 失败:", response.data.msg);
        }
    } catch (error) {
        console.error("获取 Token 时出错:", error.message);
    }
};

// 启动时获取 token
getToken();

// 每小时刷新 token
setInterval(getToken, 60 * 60 * 1000);

// 设备数据中转请求，自动检查 token
app.get('/proxy/deviceList', async (req, res) => {
    try {
        // 如果 token 为空，重新获取
        if (!token) {
            await getToken();
        }

        const response = await axios.get("https://api.aizyiot.cn:6060/device-info/deviceList", {
            headers: {
                Satoken: token
            }
        });

        if (response.data.code === 200 && Array.isArray(response.data.data)) {
            const devices = response.data.data;

            // 统计设备信息
            const totalDevices = devices.length;
            const onlineDevices = devices.filter(device => device.state === 1).length;
            const offlineDevices = devices.filter(device => device.state === 0).length;
            const alertDevices = devices.filter(device => device.accountStatus === 4).length; // 假设状态 4 为报警设备

            res.json({
                success: true,
                data: {
                    totalDevices,
                    onlineDevices,
                    offlineDevices,
                    alertDevices,
                    devices: devices.map(device => ({
                        ...device,
                        imageUrl: `https://www.aizyiot.cn${device.imageUrl}` // 加上图片前缀
                    }))
                }
            });
        } else {
            res.json({success: false, message: "No device data found"});
        }
    } catch (error) {
        if (error.response && error.response.status === 401) { // Token 过期或无效
            console.log("Token 过期，重新获取...");
            await getToken(); // 重新获取 token
            return res.redirect('/proxy/deviceList'); // 重试设备列表请求
        } else {
            console.error("设备数据请求失败:", error.message);
            res.status(500).json({success: false, message: '设备数据请求失败', error: error.message});
        }
    }
});

async function smokeGetAccessToken() {
    try {
        const response = await axios.post('https://admin.zhilianweishi.com/api/oauth/token', null, {
            headers: {
                'Authorization': 'Basic Y2xpZW50RnJvbnRFbmQ6c2VjcmV0',  // 固定值
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            params: {
                grant_type: 'password',
                username: 'zl-api-d66',  // 您的账号
                password: '123456'       // 初始密码
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('获取AccessToken时出错:', error.response ? error.response.data : error.message);
        throw new Error('获取AccessToken失败');
    }
}

app.get('/api/smoke', async (req, res) => {
    try {
        const accessToken = await smokeGetAccessToken();

        // 设备序列号列表
        const serialNumbers = ['0001F3D5', '0001F3D6', '0001F3D4'];

        // 用于存储设备信息
        let devicesData = [];

        // 使用Promise.all并发查询多个设备信息
        const devicePromises = serialNumbers.map(async (serialNumber) => {
            const response = await axios.get('https://admin.zhilianweishi.com/api/device/getBySerialNumber', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    serialNumber: serialNumber,
                    type: 2  // 假设设备类型为传感器，若是网关请将值改为1
                }
            });
            devicesData.push(response.data);
        });

        await Promise.all(devicePromises);

        // 请求阈值数据
        const thresholdResponse = await axios.get('https://admin.zhilianweishi.com/api/threshold', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        // 处理阈值数据
        const thresholdData = thresholdResponse.data.content;

        // 将阈值数据与设备信息结合
        devicesData = devicesData.map(device => {
            const threshold = thresholdData.find(th => th.serialNumber === device.serialNumber);
            if (threshold) {
                device.maxValue = threshold.maxValue;
                device.lowValue = threshold.lowValue;
                device.currentValue = threshold.currentValue;
            }
            return device;
        });

        res.json({success: true, data: devicesData});
    } catch (error) {
        res.status(500).json({success: false, message: '获取设备信息失败', error: error.message});
    }
});
// 通用查询函数
const queryDeviceData = (tableName, res) => {
    const sql = `SELECT *, DATE_FORMAT(time, '%Y-%m-%d %H:%i:%s') AS time
                 FROM ${tableName}
                 ORDER BY time DESC
                     LIMIT 100`;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({success: false, message: '数据库查询失败', error: err});
        }
        res.json({
            success: true,
            data: {
                list: results
            }
        });
    });
};

// 固定路由定义，查询不同表格中的设备数据
app.get('/api/devices', (req, res) => queryDeviceData('device_data', res));
app.get('/api/devices1', (req, res) => queryDeviceData('device_data1', res));
app.get('/api/devices2', (req, res) => queryDeviceData('device_data2', res));
app.get('/api/devices3', (req, res) => queryDeviceData('device_data3', res));
app.get('/api/devices4', (req, res) => queryDeviceData('device_data4', res));
app.get('/api/devices5', (req, res) => queryDeviceData('device_data5', res));
app.get('/api/devices6', (req, res) => queryDeviceData('device_data6', res));
app.get('/api/devices7', (req, res) => queryDeviceData('device_data7', res));
app.get('/api/devices8', (req, res) => queryDeviceData('device_data8', res));
app.get('/api/devices9', (req, res) => queryDeviceData('device_data9', res));
app.get('/api/lora1', (req, res) => queryDeviceData('sensor_data_1', res));
app.get('/api/lora2', (req, res) => queryDeviceData('sensor_data_2', res));
app.get('/api/lora3', (req, res) => queryDeviceData('sensor_data_3', res));
app.get('/api/lora4', (req, res) => queryDeviceData('sensor_data_4', res));
app.get('/api/lora5', (req, res) => queryDeviceData('sensor_data_5', res));
// 预测数据接口
app.get('/api/predict/test', async (req, res) => {
    try {
        const query = `
            SELECT *, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') AS timestamp
            FROM predict_data
            ORDER BY timestamp DESC
                LIMIT 10
        `;
        db.query(query, (error, rows) => {
            if (error) {
                console.error('Error fetching prediction data:', error);
                res.status(500).json({error: 'Failed to fetch prediction data'});
            } else {
                res.json(rows);
            }
        });
    } catch (error) {
        console.error('Error in predict API:', error);
        res.status(500).json({error: 'Failed to fetch prediction data'});
    }
});

app.get('/api/predict', async (req, res) => {
    try {
        const query = `
            SELECT *, DATE_FORMAT(time, '%Y-%m-%d %H:%i:%s') AS timestamp
            FROM predict_data_1
            ORDER BY time DESC
                LIMIT 10
        `;
        db.query(query, (error, rows) => {
            if (error) {
                console.error('Error fetching prediction data:', error);
                res.status(500).json({error: 'Failed to fetch prediction data'});
            } else {
                res.json(rows);
            }
        });
    } catch (error) {
        console.error('Error in predict API:', error);
        res.status(500).json({error: 'Failed to fetch prediction data'});
    }
});
/*
* 短信发送
* */

// 设置 JDCloud 配置
JDCloud.config.update({
    accessKeyId: 'JDC_001BF7C0DB1FBD747A7EE637AF57',
    secretAccessKey: '97F49A6AAF709CD13DF3EE5CB5111508'
});

const sms = new JDCloud.SMS();
const signId = 'qm_12a6399480074fd5b716a0e0af98c209'; // 签名ID
const templateId = 'mb_f2a0f6fad33c4e16bd457707408b5ea7'; // 模版ID

// 发送短信的函数
const batchSendPromise = (phoneList = [], params = []) => {
    return sms.batchSend({
        signId,
        templateId,
        phoneList,
        params,
    }, 'cn-north-1')
        .then(res => {
            console.info(res);
        })
        .catch(err => {
            console.error(err);
        });
};

// /api/message 接口，发送短信并检查是否已发送相同内容的短信
app.post('/api/message', (req, res) => {
    const phoneList = ['13851778762']; // 手机号列表
    const {message, params} = req.body;

    if (!message) {
        return res.status(400).json({error: 'Message content is required.'});
    }

    // 查询数据库，检查是否已发送相同内容的短信
    const query = 'SELECT * FROM sent_messages WHERE message = ? AND timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)';
    db.query(query, [message], (err, results) => {
        if (err) {
            console.error('查询数据库时出错:', err);
            return res.status(500).json({error: 'Database query error'});
        }

        // 如果有相同的短信，避免重复发送
        if (results.length > 0) {
            return res.status(429).json({error: '此消息已在最近1小时内发送过，避免重复发送。'});
        }

        // 否则，发送短信
        batchSendPromise(phoneList, params)
            .then(() => {
                // 发送成功后，保存记录
                const insertQuery = 'INSERT INTO sent_messages (message) VALUES (?)';
                db.query(insertQuery, [message], (insertErr, result) => {
                    if (insertErr) {
                        console.error('保存短信记录失败:', insertErr);
                    }
                    console.log(`短信发送成功：${message}`);
                    res.status(200).json({status: 'Message sent successfully.'});
                });
            })
            .catch((error) => {
                console.error('发送短信时出错：', error);
                res.status(500).json({error: '短信发送失败'});
            });
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器正在端口 ${port} 上运行`);
});
