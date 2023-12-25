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


var body = $response.body;
var obj = JSON.parse(body);

// 修改账户信息
obj.account.info.name = "Cracked";
obj.account.info.email = "Cracked by xxx";

// 修改账户状态
obj.account.status.signedIn = true;
obj.account.status.pro = true;
obj.account.status.proForStudents = true;
obj.account.status.proForEducators = true;
obj.account.status.proLevel = 3;

// 修改其他权限和订阅信息等
obj.account.permissions.features.fileUpload.value = true;

obj.account.subscriptions.hasSubscriptions = true;
obj.account.subscriptions.primarySubscription.nextBillingDate = "2099-12-31";

// 修改偏好设置等
obj.account.preferences.id = 8058195;
obj.account.preferences.userId = 9782356;
obj.account.preferences.createdDate = 1596536830000;
obj.account.preferences.updatedDate = 1596536830000;
obj.account.preferences.updatedBy = 0;
obj.account.preferences.location = "Automatic";
obj.account.preferences.country = "Automatic";
obj.account.preferences.timezone = "Automatic";
obj.account.preferences.currency = "Automatic";
obj.account.preferences.dateFormat = "Automatic";
obj.account.preferences.unitFormat = 0;
obj.account.preferences.queryHistory = false;
obj.account.preferences.querySuggestion = false;
obj.account.preferences.keyboard = 0;
obj.account.preferences.dataFormat = "Excel 97-2004";
obj.account.preferences.imageFormat2d = "gif";
obj.account.preferences.imageFormat3d = "format 1";
obj.account.preferences.soundFormat = "mp3";
obj.account.preferences.resultsWidth = 4;
obj.account.preferences.fontSize = 0;
obj.account.preferences.contrast = 0;
obj.account.preferences.homepageBackground = "blue-circles";
obj.account.preferences.homepageHints = 0;
obj.account.preferences.homepageHistory = false;
obj.account.preferences.homepageFavorites = false;
obj.account.preferences.homepageData = false;
obj.account.preferences.homepageShortcuts = false;

obj.account.links.facebook = null;

obj.account.hasError = false;
obj.account.error = null;
obj.profilingSet = null;

obj.hasError = false;
obj.error = null;
obj.profilingSet = null;

$done({ body: JSON.stringify(obj) });
