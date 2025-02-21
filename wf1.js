/*************************************

项目名称：wolfram alpha
更新日期：2023-12-24
脚本作者：@zhlpp
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************

[rewrite_local]
^https:\/\/www\.wolframalpha\.com\/user\/me\/account\?appid=* url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/wf1.js 

[mitm]
hostname = www.wolframalpha.com

*************************************/


var body = $response.body;
var json = JSON.parse(body);

// 修改 account.status
if (json.account && json.account.status) {
    json.account.status.pro = true;
    json.account.status.proForStudents = true;
    json.account.status.proForEducators = true;
    if (json.account.status.proLevel) {
        json.account.status.proLevel = 3;
    }
}

// 修改 account.subscriptions
if (json.account && json.account.subscriptions) {
    json.account.subscriptions.hasSubscriptions = true;
    if (json.account.subscriptions.primarySubscription) {
        json.account.subscriptions.primarySubscription.status = "ACTIVE";
        if (json.account.subscriptions.primarySubscription.plan) {
            if (json.account.subscriptions.primarySubscription.plan.planType) {
                json.account.subscriptions.primarySubscription.plan.planType = "PRO";
            }
        }
    }
}

// 设置 account.info.name 和 email 为通用值
if (json.account && json.account.info) {
    json.account.info.name = "User";
    json.account.info.email = "user@example.com";
}

body = JSON.stringify(json);
$done({body: body});
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​