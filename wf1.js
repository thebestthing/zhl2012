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

obj.account.info.name = "Cracked";
obj.account.info.email = "Cracked by xxx";
obj.account.status.signedIn = true;
obj.account.status.pro = true;
obj.account.status.proForStudents = true;
obj.account.status.proForEducators = true;
obj.account.status.proLevel = 3;
obj.account.permissions.features.practiceSheets.value = true;
obj.account.permissions.features.embeddablePods.value = true;
obj.account.permissions.features.webApps.value = "";
obj.account.permissions.features.fileUpload.value = 2048; // 提高上传速度，单位为 MB
obj.account.permissions.features.imageInput.value = 2048; // 提高上传速度，单位为 MB
obj.account.permissions.features.showSteps.value = true;
obj.account.permissions.features.specialCharacterKeyboards.value = true;
obj.account.permissions.features.pdfDownload.value = true;
obj.account.permissions.features.copyablePlaintext.value = true;
obj.account.permissions.features.cdfDownload.value = true;
obj.account.permissions.features.dataInput.value = true;
obj.account.permissions.features.cdfInteractivePods.value = true;
obj.account.permissions.features.customizeGraphicsPods.value = true;
obj.account.permissions.features.storeDownloadedData.value = true;
obj.account.permissions.features.longerTimeouts.value = 60; // 增加照片上传请求的超时时间为60秒
obj.account.permissions.features.zoomSubpods.value = true;
obj.account.permissions.features.downloadPodData.value = true;
obj.account.permissions.features.removeAds.value = true;
obj.account.permissions.features.emailProductSupport.value = true;
obj.account.permissions.features.saveSubpodAsImage.value = true;

obj.account.subscriptions.hasSubscriptions = true;
obj.account.subscriptions.primarySubscription.subscriptionId = 4486323;
obj.account.subscriptions.primarySubscription.userId = 9782356;
obj.account.subscriptions.primarySubscription.planId = 1106;
obj.account.subscriptions.primarySubscription.startDate = "2020-08-04";
obj.account.subscriptions.primarySubscription.nextBillingDate = "2099-12-31";
obj.account.subscriptions.primarySubscription.finalAccessDate = "2099-12-31";
obj.account.subscriptions.primarySubscription.status = "ACTIVE";
obj.account.subscriptions.primarySubscription.paymentType = "NONE";
obj.account.subscriptions.primarySubscription.monthStart = "2020-08-04";
obj.account.subscriptions.primarySubscription.monthEnd = "2099-12-31";
obj.account.subscriptions.primarySubscription.nda = false;
obj.account.subscriptions.primarySubscription.userUuid = "ce6341b4-5c9c-45b9-7584-7542ff503b1c";
obj.account.subscriptions.primarySubscription.plan.planId = 1109;
obj.account.subscriptions.primarySubscription.plan.name = "Pro";
obj.account.subscriptions.primarySubscription.plan.description = "Wolfram Alpha Professional Subscription";
obj.account.subscriptions.primarySubscription.plan.billingPeriod = "NONE";
obj.account.subscriptions.primarySubscription.plan.planType = "PRO";
obj.account.subscriptions.primarySubscription.plan.productId = 12;
obj.account.subscriptions.primarySubscription.plan.canUpgrade = false;
obj.account.subscriptions.primarySubscription.plan.product.productId = 12;
obj.account.subscriptions.primarySubscription.plan.product.name = "Wolfram|Alpha";
obj.account.subscriptions.primarySubscription.plan.product.type = "SUBSCRIPTION";
obj.account.subscriptions.primarySubscription.plan.product.prettyName = "wa";
obj.account.subscriptions.primarySubscription.plan.product.productReady = false;
obj.account.subscriptions.primarySubscription.plan.product.contactUsUrl = "https://www.wolframalpha.com/contact.html";
obj.account.subscriptions.primarySubscription.plan.product.productUrl = "https://www.wolframalpha.com/";
obj.account.subscriptions.primarySubscription.plan.product.productHost = "www.wolframalpha.com";
obj.account.subscriptions.primarySubscription.plan.product.productPricingUrl = "https://www.wolframalpha.com/pro";
obj.account.subscriptions.primarySubscription.plan.product.productReleased = false;
obj.account.subscriptions.primarySubscription.plan.product.learnAboutUrl = "https://products.wolframalpha.com/";

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

body = JSON.stringify(obj);
$done(body);
