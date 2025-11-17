/*************************************

项目名称：wolfram alpha
更新日期：2025-11-17 (修改图像上传权限)
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
    // --- 账户状态修改为 Pro Premium ---
    obj.account.status.pro = true;
    obj.account.status.proForStudents = true;
    obj.account.status.proForEducators = true;
    obj.account.status.proLevel = 4; // Premium 级别
    
    // --- 订阅信息修改 ---
    
    // Primary Subscription
    obj.account.subscriptions.primarySubscription.planId = 1109;
    obj.account.subscriptions.primarySubscription.plan.name = "Pro Premium";
    obj.account.subscriptions.primarySubscription.plan.description = "Wolfram Alpha Pro Premium Subscription";
    obj.account.subscriptions.primarySubscription.plan.planType = "PREMIUM";
    obj.account.subscriptions.primarySubscription.plan.billingPeriod = "YEARLY";
    obj.account.subscriptions.primarySubscription.nextBillingDate = "2099-12-31";
    obj.account.subscriptions.primarySubscription.finalAccessDate = "2099-12-31";
    obj.account.subscriptions.primarySubscription.startDate = "2025-11-17";
    obj.account.subscriptions.primarySubscription.monthStart = "2025-11-17";
    obj.account.subscriptions.primarySubscription.monthEnd = "2025-12-17"; 

    // All Subscriptions (第一个)
    if (obj.account.subscriptions.allSubscriptions && obj.account.subscriptions.allSubscriptions.length > 0) {
        obj.account.subscriptions.allSubscriptions[0].planId = 1109;
        obj.account.subscriptions.allSubscriptions[0].plan.name = "Pro Premium";
        obj.account.subscriptions.allSubscriptions[0].plan.description = "Wolfram Alpha Pro Premium Subscription";
        obj.account.subscriptions.allSubscriptions[0].plan.planType = "PREMIUM";
        obj.account.subscriptions.allSubscriptions[0].plan.billingPeriod = "YEARLY";
        obj.account.subscriptions.allSubscriptions[0].nextBillingDate = "2099-12-31";
        obj.account.subscriptions.allSubscriptions[0].finalAccessDate = "2099-12-31";
        obj.account.subscriptions.allSubscriptions[0].startDate = "2025-11-17";
        obj.account.subscriptions.allSubscriptions[0].monthStart = "2025-11-17";
        obj.account.subscriptions.allSubscriptions[0].monthEnd = "2025-12-17";
        
        // 确保产品已发布/就绪
        obj.account.subscriptions.allSubscriptions[0].plan.product.productReleased = true;
        obj.account.subscriptions.allSubscriptions[0].plan.product.productReady = true;
    }
    
    // 确保 Primary Product 已发布/就绪
    obj.account.subscriptions.primarySubscription.plan.product.productReleased = true;
    obj.account.subscriptions.primarySubscription.plan.product.productReady = true;


    // --- 启用所有 Pro 权限 (关键修改部分，解决上传问题) ---
    var features = obj.account.permissions.features;
    
    // 常规 Pro 权限
    features.showSteps.value = true;
    features.pdfDownload.value = true;
    features.removeAds.value = true;
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
    
    // 关键修改 1: 图像输入权限，设置为 60MB 限制
    features.imageInput.units = "MB";
    features.imageInput.value = 60; 

    // 关键修改 2: 文件上传权限，从 0MB 修改为 60MB 限制
    features.fileUpload.units = "MB";
    features.fileUpload.value = 60;
    
    // 增加超时时间
    features.longerTimeouts.value = 180;
}

console.log("修改后响应: " + JSON.stringify(obj));
$done({ body: JSON.stringify(obj) });
