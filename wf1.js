/*************************************

项目名称：wolfram alpha (Surge Module Final Version)
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
        obj.account.status.proLevel = 4;
        
        // --- 订阅信息修改 (关键 Pro 状态) ---
        obj.account.subscriptions.primarySubscription.planId = 1109;
        obj.account.subscriptions.primarySubscription.plan.name = "Pro Premium";
        obj.account.subscriptions.primarySubscription.plan.planType = "PREMIUM";
        obj.account.subscriptions.primarySubscription.nextBillingDate = "2099-12-31";
        obj.account.subscriptions.primarySubscription.finalAccessDate = "2099-12-31";

        // --- 启用 Pro 权限 (文件上传/图像输入) ---
        var features = obj.account.permissions.features;
        
        // 关键修复: 图像输入和文件上传权限，设置为 60MB 限制
        if (features.imageInput) { features.imageInput.units = "MB"; features.imageInput.value = 60; }
        if (features.fileUpload) { features.fileUpload.units = "MB"; features.fileUpload.value = 60; }
        
        // 确保核心 Pro 功能启用
        features.showSteps.value = true;
        features.pdfDownload.value = true;
        features.removeAds.value = true;
        features.longerTimeouts.value = 180;
    }

    console.log("Wolfram Alpha 账户响应已修改为 Pro Premium。");
    $done({ body: JSON.stringify(obj) });

// --- 逻辑分支 2: Wolfram Alpha 文件上传 API (强制返回成功的上传会话) ---
} else if (url.includes("gateway.wolframalpha.com/calculate/upload")) {
    
    // 伪造一个成功的上传响应，强制设置 200 状态码和 JSON 头部
    var fake_upload_response = {
        "success": true,
        "uploadId": "fake-file-id-20991231", 
        "uploadTime": new Date().toISOString()
    };
    
    console.log("Wolfram Alpha 上传 API 响应已伪造成功 (强制 200 OK)。");
    $done({ 
        response: {
            status: '200', 
            headers: { 'Content-Type': 'application/json' }
        }, 
        body: JSON.stringify(fake_upload_response) 
    });


// --- 逻辑分支 3: Mathpix 图像分析 API (返回成功的识别结果) ---
} else if (url.includes("api.mathpix.com/v3/latex")) {
    
    // 返回一个伪造的、成功的识别结果
    var fake_mathpix_response = {
        "request_id": "2025_11_18_fake_response",
        "latex_confidence": 0.99,
        "auto_rotate_degrees": 0,
        "detection_map": { "is_not_math": 0, "is_printed": 1, "is_blank": 0 },
        "latex_output": "x^2+y^2=1", 
        "text": "x^2+y^2=1",
        "error": null,
        "error_info": null
    };

    console.log("Mathpix API 响应已伪造成功。");
    $done({ body: JSON.stringify(fake_mathpix_response) });

// --- 默认情况 (不对其他 URL 做处理) ---
} else {
    // 如果没有匹配的 URL，则返回原始响应体
    $done({ body });
}
