var body = $response.body;
var obj = JSON.parse(body);

obj = {
  "account": {
    "info": {
      "hasError": false,
      "error": null,
      "name": "zhen hl", // 保留抓包中的真实姓名
      "email": "zhlsnmsnb778@gmail.com" // 保留抓包中的真实邮箱
    },
    "status": {
      "hasError": false,
      "error": null,
      "signedIn": true,
      "pro": true, // 修改为专业版
      "proForStudents": true, // 启用学生专业版
      "proForEducators": true, // 启用教育者专业版
      "proLevel": 3 // 设置为高级别
    },
    "persona": {
      "classification": "Student",
      "source": null,
      "resourceId": {
        "userId": 11013109, // 使用抓包中的 userId
        "productId": 9
      }
    },
    "permissions": {
      "hasError": false,
      "error": null,
      "features": {
        "practiceSheets": { "units": null, "value": true },
        "embeddablePods": { "units": null, "value": true },
        "webApps": { "units": null, "value": "" },
        "fileUpload": { "units": "MB", "value": 0 },
        "imageInput": { "units": "MB", "value": true },
        "showSteps": { "units": null, "value": true }, // 启用显示步骤
        "specialCharacterKeyboards": { "units": null, "value": true },
        "pdfDownload": { "units": null, "value": true }, // 启用 PDF 下载
        "copyablePlaintext": { "units": null, "value": true },
        "cdfDownload": { "units": null, "value": true },
        "dataInput": { "units": null, "value": true },
        "cdfInteractivePods": { "units": null, "value": true },
        "customizeGraphicsPods": { "units": null, "value": true },
        "storeDownloadedData": { "units": null, "value": true },
        "longerTimeouts": { "units": "seconds", "value": 0 },
        "zoomSubpods": { "units": null, "value": true },
        "downloadPodData": { "units": null, "value": true },
        "removeAds": { "units": null, "value": true }, // 移除广告
        "emailProductSupport": { "units": null, "value": true },
        "saveSubpodAsImage": { "units": null, "value": true }
      }
    },
    "subscriptions": {
      "hasError": false,
      "error": null,
      "hasSubscriptions": true,
      "primarySubscription": {
        "subscriptionId": 7530644, // 保留抓包中的 subscriptionId
        "userId": 11013109, // 使用抓包中的 userId
        "planId": 1109, // 修改为 Pro 计划
        "startDate": "2022-12-07", // 保留抓包中的开始日期
        "nextBillingDate": "2099-12-31", // 设置为未来日期
        "finalAccessDate": "2099-12-31", // 设置为未来日期
        "status": "ACTIVE",
        "paymentType": "CREDIT_CARD", // 保留抓包中的支付类型
        "monthStart": "2022-12-07",
        "monthEnd": "2099-12-31",
        "nda": false,
        "userUuid": "fe6f4702-3355-432e-9f29-8e892dbe4d8e", // 保留抓包中的 UUID
        "plan": {
          "planId": 1109, // 修改为 Pro 计划
          "name": "Pro", // 修改为 Pro
          "description": "Wolfram Alpha Professional Subscription",
          "billingPeriod": "NONE",
          "planType": "PRO", // 修改为 Pro 类型
          "productId": 9,
          "canUpgrade": false,
          "product": {
            "productId": 9,
            "name": "Wolfram|Alpha",
            "type": "SUBSCRIPTION",
            "prettyName": "wa",
            "productReady": false,
            "contactUsUrl": "https://www.wolframalpha.com/contact.html",
            "productUrl": "https://www.wolframalpha.com/",
            "productHost": "www.wolframalpha.com",
            "productPricingUrl": "https://www.wolframalpha.com/pro",
            "productReleased": false,
            "learnAboutUrl": "https://products.wolframalpha.com/"
          }
        }
      },
      "nextSubscription": null,
      "nextPaidSubscription": null,
      "allSubscriptions": [
        {
          "subscriptionId": 7530644, // 保留抓包中的 subscriptionId
          "userId": 11013109, // 使用抓包中的 userId
          "planId": 1109, // 修改为 Pro 计划
          "startDate": "2022-12-07", // 保留抓包中的开始日期
          "nextBillingDate": "2099-12-31", // 设置为未来日期
          "finalAccessDate": "2099-12-31", // 设置为未来日期
          "status": "ACTIVE",
          "paymentType": "CREDIT_CARD", // 保留抓包中的支付类型
          "monthStart": "2022-12-07",
          "monthEnd": "2099-12-31",
          "nda": false,
          "userUuid": "fe6f4702-3355-432e-9f29-8e892dbe4d8e", // 保留抓包中的 UUID
          "plan": {
            "planId": 1109, // 修改为 Pro 计划
            "name": "Pro", // 修改为 Pro
            "description": "Wolfram Alpha Professional Subscription",
            "billingPeriod": "NONE",
            "planType": "PRO", // 修改为 Pro 类型
            "productId": 9,
            "canUpgrade": false,
            "product": {
              "productId": 9,
              "name": "Wolfram|Alpha",
              "type": "SUBSCRIPTION",
              "prettyName": "wa",
              "productReady": false,
              "contactUsUrl": "https://www.wolframalpha.com/contact.html",
              "productUrl": "https://www.wolframalpha.com/",
              "productHost": "www.wolframalpha.com",
              "productPricingUrl": "https://www.wolframalpha.com/pro",
              "productReleased": false,
              "learnAboutUrl": "https://products.wolframalpha.com/"
            }
          }
        }
      ],
      "billingDetails": null
    },
    "preferences": {
      "hasError": false,
      "error": null,
      "id": 7230372, // 保留抓包中的偏好 ID
      "userId": 11013109, // 使用抓包中的 userId
      "createdDate": 1670426386000,
      "updatedDate": 1670426386000,
      "updatedBy": 0,
      "location": "Automatic",
      "country": "Automatic",
      "timezone": "Automatic",
      "currency": "Automatic",
      "dateFormat": "Automatic",
      "unitFormat": 0,
      "queryHistory": false,
      "querySuggestion": false,
      "keyboard": 0,
      "dataFormat": "Excel 97-2004",
      "imageFormat2d": "gif",
      "imageFormat3d": "format 1",
      "soundFormat": "mp3",
      "resultsWidth": 4,
      "fontSize": 0,
      "contrast": 0,
      "homepageBackground": "blue-circles",
      "homepageHints": 0,
      "homepageHistory": false,
      "homepageFavorites": false,
      "homepageData": false,
      "homepageShortcuts": false
    },
    "links": {
      "facebook": null
    },
    "hasError": false,
    "error": null,
    "profilingSet": null
  },
  "hasError": false,
  "error": null,
  "profilingSet": null
};

$done({ body: JSON.stringify(obj) });
