const JDCloud = require('jdcloud-sdk-js');

// 设置JDCloud SDK配置
JDCloud.config.update({
    accessKeyId: 'JDC_001BF7C0DB1FBD747A7EE637AF57', // AK
    secretAccessKey: '97F49A6AAF709CD13DF3EE5CB5111508' // SK
});

// 设置短信参数
const sms = new JDCloud.SMS();
const signId = 'qm_12a6399480074fd5b716a0e0af98c209'; // 签名ID
const templateId = 'mb_f2a0f6fad33c4e16bd457707408b5ea7'; // 模版ID
const appId = '0c05f38e933d4ff49e7b39317f77ae6a'; // 应用ID

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

// 测试数据
const phoneList = ['17681391276']; // 目标手机号列表
const params = [1,2,3];

// 调用Promise方式发送短信
batchSendPromise(phoneList, params);
