const JDCloud = require('jdcloud-sdk-js');

// 设置AK/SK
JDCloud.config.update({
    accessKeyId: '', // AK
    secretAccessKey: '0c05f38e933d4ff49e7b39317f77ae6a' // SK
});

// 设置短信参数
const sms = new JDCloud.SMS();
const signId = ''; // 签名ID
const templateId = ''; // 模版ID
const appId = ''; // 应用ID


// 发送短信：以callback方式调用
const batchSendCallback = (phoneList = [ ], params = [ ]) => {
    sms.batchSend({
        signId, // 签名ID
        templateId, // 模版ID
        phoneList, // 手机号列表
        params, // 短信模版替换参数
    }, 'cn-north-1', (err, res) => {
        if (err) {
            // 调用失败时的报错信息
            console.error(err);
        } else {
            // 调用成功时执行的操作
            console.info(res);
        }
    });
};

// 发送短信：以Promise方式调用
const batchSendPromise = (phoneList = [ ], params = [ ]) => {
    sms.batchSend({
        signId, // 签名ID
        templateId, // 模版ID
        phoneList, // 手机号列表
        params, // 短信模版替换参数
    }, 'cn-north-1')
        .then(res => {
            // 调用成功时执行的操作
            console.info(res);
        })
        .catch(err => {
            // 调用失败时的报错信息
            console.error(err);
        });
};

// 短信发送回执查询：以callback方式调用
const statusReportCallback = (sequenceNumber, phoneList = [ ]) => {
    sms.statusReport({
        sequenceNumber, // 发送短信的序列号（从发送短信接口的返回值res中获取）
        phoneList, // 需要获取回执的手机号码列表
    }, 'cn-north-1', (err, res) => {
        if (err) {
            // 调用失败时的报错信息
            console.error(err);
        } else {
            // 调用成功时执行的操作
            console.info(res);
        }
    })
};

// 短信发送回执查询：以Promise方式调用
const statusReportPromise = (sequenceNumber, phoneList = [ ]) => {
    sms.statusReport({
        sequenceNumber, // 发送短信的序列号（从发送短信接口的返回值res中获取）
        phoneList, // 需要获取回执的手机号码列表（选填）
    }, 'cn-north-1')
        .then(res => {
            // 调用成功时执行的操作
            console.info(res);
        })
        .catch(err => {
            // 调用失败时的报错信息
            console.error(err);
        });
};

// 短信回复查询：以callback方式调用
const replyCallback = (dataDate, phoneList = [ ]) => {
    sms.reply({
        appId, // 应用ID
        dataDate, // 查询时间：格式xxxx-xx-xx
        phoneList // 需要获取回复的手机号码列表（选填）
    }, 'cn-north-1', (err, res) => {
        if (err) {
            // 调用失败时的报错信息
            console.error(err);
        } else {
            // 调用成功时执行的操作
            console.info(res);
        }
    })
};

// 短信回复查询：以Promise方式调用
const replyPromise = (dataDate, phoneList = [ ]) => {
    sms.reply({
        appId, // 应用ID
        dataDate, // 查询时间：格式xxxx-xx-xx
        phoneList // 需要获取回复的手机号码列表（选填）
    }, 'cn-north-1')
        .then(res => {
            // 调用成功时执行的操作
            console.info(res);
        })
        .catch(err => {
            // 调用失败时的报错信息
            console.error(err);
        });
};