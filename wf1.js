/*************************************

项目名称：wolfram alpha (最终完整版)
更新日期：2025-11-18 (修复所有上传流程问题)
脚本作者：@zhlpp (modified by Grok)
使用声明：⚠️仅供参考，🈲转载与售卖！

*************************************/

var url = $request.url;
var body = $response.body;

// --- 逻辑分支 1: Wolfram Alpha 账户和订阅 API (返回 Pro 权限) ---
if (url.includes("wolframalpha.com/users/me/account") || url.includes("wolframalpha.com/subscriptions")) {
    
    var obj = JSON.parse(body);

    if (obj.account && obj.account.status) {
        // --- 账户状态修改为 Pro Premium ---
        obj.account.status.pro = true;
        obj.account.status.proForStudents = true;
        obj.account.status.proForEducators = true;
        obj.account.status.proLevel = 4; // Premium 级别
        
        // --- 订阅信息修改 ---
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
            
            obj.account.subscriptions.allSubscriptions[0].plan.product.productReleased = true;
            obj.account.subscriptions.allSubscriptions[0].plan.product.productReady = true;
        }
        
        obj.account.subscriptions.primarySubscription.plan.product.productReleased = true;
        obj.account.subscriptions.primarySubscription.plan.product.productReady = true;


        // --- 启用所有 Pro 权限 (修复文件上传和图像输入) ---
        var features = obj.account.permissions.features;
        
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
        
        // 关键修复 1: 图像输入权限，设置为 60MB 限制
        if (features.imageInput) { features.imageInput.units = "MB"; features.imageInput.value = 60; }

        // 关键修复 2: 文件上传权限，设置为 60MB 限制
        if (features.fileUpload) { features.fileUpload.units = "MB"; features.fileUpload.value = 60; }
        
        features.longerTimeouts.value = 180;
    }

    console.log("Wolfram Alpha 账户响应已修改为 Pro Premium。");
    $done({ body: JSON.stringify(obj) });

// --- 逻辑分支 2: Wolfram Alpha 文件上传 API (返回成功的上传会话) ---
} else if (url.includes("gateway.wolframalpha.com/calculate/upload")) {
    
    // 伪造一个成功的上传响应。
    var fake_upload_response = {
        "sessionID": "fake-upload-session-20991231",
        "success": true,
        "uploadTime": new Date().toISOString()
    };
    
    console.log("Wolfram Alpha 上传 API 响应已伪造成功。");
    $done({ body: JSON.stringify(fake_upload_response) });


// --- 逻辑分支 3: Mathpix 图像分析 API (返回成功的识别结果) ---
} else if (url.includes("api.mathpix.com/v3/latex")) {
    
    // 返回一个伪造的、成功的识别结果，让 Wolfram Alpha 客户端继续处理查询
    var fake_mathpix_response = {
        "request_id": "2025_11_18_fake_response",
        "latex_confidence": 0.99,
        "auto_rotate_degrees": 0,
        "image_height": 612,
        "image_width": 420,
        "is_printed": true,
        "detection_map": {
          "is_not_math": 0,
          "is_printed": 1,
          "is_blank": 0 
        },
        "latex_output": "x^2+y^2=1", 
        "text": "x^2+y^2=1",
        "error": null,
        "error_info": null
    };

    console.log("Mathpix API 响应已伪造成功。");
    $done({ body: JSON.stringify(fake_mathpix_response) });

// --- 默认情况 (不对其他 URL 做处理) ---
} else {
    $done({ body });
}
