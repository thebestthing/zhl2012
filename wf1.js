/*************************************

项目名称：wolfram alpha
更新日期：2025-11-17
脚本作者：@zhlpp (modified by Grok)
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************

[rewrite_local]
^https:\/\/www\.wolframalpha\.com\/users\/me\/account\?appid=* url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/wf1.js 
^https:\/\/www\.wolframalpha\.com\/subscriptions.* url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/wf1.js

[mitm]
hostname = www.wolframalpha.com, *.wolframalpha.com, wolframalpha.com

*************************************/


var body = $response.body;

var obj = JSON.parse(body);

if (obj.account && obj.account.status) {
    obj.account.status.pro = true;
    obj.account.status.proForStudents = true;
    obj.account.status.proForEducators = true;
    obj.account.status.proLevel = 4; // Try level 4 for Premium
    obj.account.subscriptions.primarySubscription.planId = 1109;
    obj.account.subscriptions.primarySubscription.plan.name = "Pro Premium";
    obj.account.subscriptions.primarySubscription.plan.description = "Wolfram Alpha Pro Premium Subscription";
    obj.account.subscriptions.primarySubscription.plan.planType = "PREMIUM";
    obj.account.subscriptions.primarySubscription.plan.billingPeriod = "YEARLY";
    obj.account.subscriptions.primarySubscription.nextBillingDate = "2099-12-31";
    obj.account.subscriptions.primarySubscription.finalAccessDate = "2099-12-31";
    obj.account.subscriptions.primarySubscription.startDate = "2025-11-17"; // Update to current date
    obj.account.subscriptions.primarySubscription.monthStart = "2025-11-17";
    obj.account.subscriptions.primarySubscription.monthEnd = "2025-12-17"; // Approximate
    obj.account.subscriptions.allSubscriptions[0].planId = 1109;
    obj.account.subscriptions.allSubscriptions[0].plan.name = "Pro Premium";
    obj.account.subscriptions.allSubscriptions[0].plan.description = "Wolfram Alpha Pro Premium Subscription";
    obj.account.subscriptions.allSubscriptions[0].plan.planType = "PREMIUM";
    obj.account.subscriptions.allSubscriptions[0].plan.billingPeriod = "YEARLY";
    obj.account.subscriptions.allSubscriptions[0].nextBillingDate = "2099-12-31";
    obj.account.subscriptions.allSubscriptions[0].finalAccessDate = "2099-12-31";