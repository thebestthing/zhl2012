/*************************************

项目名称：wolfram alpha
更新日期：2023-12-24
脚本作者：@zhlpp
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************

[rewrite_local]
^https:\/\/www\.wolframalpha\.com\/users\/me\/account\?appid=* url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/wf1.js 

[mitm]
hostname = www.wolframalpha.com

*************************************/


var obj = JSON.parse($response.body);
obj.account.info.name = "Cracked";
obj.account.info.email = "Cracked by xxx";
obj.account.status.signedIn = true;
obj.account.permissions.features.practiceSheets.value = true;
obj.account.permissions.features.embeddablePods.value = true;
obj.account.subscriptions.primarySubscription.plan.name = "Professional";
obj.account.subscriptions.primarySubscription.plan.description = "Wolfram Alpha Professional Subscription";
obj.account.preferences.location = "Automatic";
obj.account.preferences.country = "Automatic";
obj.account.preferences.timezone = "Automatic";
obj.account.preferences.currency = "Automatic";
obj.account.preferences.dataFormat = "Excel 97-2004";
obj.account.preferences.imageFormat2d = "gif";
obj.account.preferences.soundFormat = "mp3";
obj.account.preferences.resultsWidth = 4;
obj.account.preferences.homepageBackground = "blue-circles";
obj.account.preferences.fontSize = 0;
obj.account.preferences.contrast = 0;
obj.account.preferences.homepageHints = 0;
obj.account.preferences.homepageHistory = false;
obj.account.preferences.homepageFavorites = false;
obj.account.preferences.homepageData = false;
obj.account.preferences.homepageShortcuts = false;
$done({ body: JSON.stringify(obj) });
