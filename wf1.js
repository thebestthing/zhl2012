/*************************************

项目名称：wolfram alpha
更新日期：2023-12-24
脚本作者：@zhlpp
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************

[rewrite_local]
^https:\/\/www\.wolframalpha\.com\/users\/me\/account\?appid=* url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/wf1.js 
^https:\/\/www\.wolframalpha\.com\/subscriptions.* url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/wf1.js

[mitm]
hostname = www.wolframalpha.com, *.wolframalpha.com, wolframalpha.com

*************************************/


var body = $response.body;
console.log("原始响应: " + body); // 输出服务器返回的原始数据

var obj = JSON.parse(body);
obj.account.status.pro = true; // 修改为 Pro
obj.account.status.proForStudents = true;
obj.account.status.proForEducators = true;
obj.account.status.proLevel = 3;
obj.account.subscriptions.primarySubscription.planId = 1109; // Pro 计划
obj.account.subscriptions.primarySubscription.plan.name = "Pro";
obj.account.subscriptions.primarySubscription.plan.description = "Wolfram Alpha Professional Subscription";
obj.account.subscriptions.primarySubscription.plan.planType = "PRO";
obj.account.subscriptions.primarySubscription.plan.billingPeriod = "YEARLY";
obj.account.subscriptions.primarySubscription.nextBillingDate = "2099-12-31";
obj.account.subscriptions.primarySubscription.finalAccessDate = "2099-12-31";
obj.account.subscriptions.allSubscriptions[0].planId = 1109;
obj.account.subscriptions.allSubscriptions[0].plan.name = "Pro";
obj.account.subscriptions.allSubscriptions[0].plan.description = "Wolfram Alpha Professional Subscription";
obj.account.subscriptions.allSubscriptions[0].plan.planType = "PRO";
obj.account.subscriptions.allSubscriptions[0].plan.billingPeriod = "YEARLY";
obj.account.subscriptions.allSubscriptions[0].nextBillingDate = "2099-12-31";
obj.account.subscriptions.allSubscriptions[0].finalAccessDate = "2099-12-31";

// 启用所有 Pro 权限
var features = obj.account.permissions.features;
features.showSteps.value = true;
features.pdfDownload.value = true;
features.removeAds.value = true;
features.imageInput.value = true;
features.copyablePlaintext.value = true;
features.cdfDownload.value = true;
features.dataInput.value = true;
features.cdfInteractivePods.value = true;
features.customizeGraphicsPods.value = true;
features.storeDownloadedData.value = true;
features.zoomSubpods.value = true;
features.downloadPodData.value = true;
features.emailProductSupport.value = true;
features.saveSubpodAsImage.value = true;
features.specialCharacterKeyboards.value = true;
features.practiceSheets.value = true;
features.embeddablePods.value = true;

console.log("修改后响应: " + JSON.stringify(obj)); // 输出修改后的数据
$done({ body: JSON.stringify(obj) });
