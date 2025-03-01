/*************************************

项目名称：wolfram alpha
更新日期：2023-12-24
脚本作者：@zhlpp
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************

[rewrite_local]
^https:\/\/www\.wolframalpha\.com\/users\/me\/account\?appid=* url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/wf1.js 

[mitm]
hostname = www.wolframalpha.com, *.wolframalpha.com, wolframalpha.com

*************************************/


var body = $response.body;
console.log("原始响应: " + body); // 调试：输出原始响应
var obj = JSON.parse(body);

obj = {
  "account": {
    "info": {
      "hasError": false,
      "error": null,
      "name": "zhen hl",
      "email": "zhlsnmsnb778@gmail.com"
    },
    "status": {
      "hasError": false,
      "error": null,
      "signedIn": true,
      "pro": true,
      "proForStudents": true,
      "proForEducators": true,
      "proLevel": 3
    },
    "persona": {
      "classification": "Student",
      "source": null,
      "resourceId": {
        "userId": 11013109,
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
        "showSteps": { "units": null, "value": true },
        "specialCharacterKeyboards": { "units": null, "value": true },
        "pdfDownload": { "units": null, "value": true },
        "copyablePlaintext": { "units": null, "value": true },
        "cdfDownload": { "units": null, "value": true },
        "dataInput": { "units": null, "value": true },
        "cdfInteractivePods": { "units": null, "value": true },
        "customizeGraphicsPods": { "units": null, "value": true },
        "storeDownloadedData": { "units": null, "value": true },
        "longerTimeouts": { "units": "seconds", "value": 0 },
        "zoomSubpods": { "units": null, "value": true },
        "downloadPodData": { "units": null, "value": true },
        "removeAds": { "units": null, "value": true },
        "emailProductSupport": { "units": null, "value": true },
        "saveSubpodAsImage": { "units": null, "value": true }
      }
    },
    "subscriptions": {
      "hasError": false,
      "error": null,
      "hasSubscriptions": true,
      "primarySubscription": {
        "subscriptionId": 7530644,
        "userId": 11013109,
        "planId": 1109, // Pro 计划
        "startDate": "2022-12-07",
        "nextBillingDate": "2099-12-31",
        "finalAccessDate": "2099-12-31",
        "status": "ACTIVE",
        "paymentType": "CREDIT_CARD",
        "monthStart": "2022-12-07",
        "monthEnd": "2099-12-31",
        "nda": false,
        "userUuid": "fe6f4702-3355-432e-9f29-8e892dbe4d8e",
        "plan": {
          "planId": 1109,
          "name": "Pro",
          "description": "Wolfram Alpha Professional Subscription",
          "billingPeriod": "YEARLY",
          "planType": "PRO",
          "productId": 9, // 保留抓包值，可能是通用的
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
          "subscriptionId": 7530644,
          "userId": 11013109,
          "planId": 1109,
          "startDate": "2022-12-07",
          "nextBillingDate": "2099-12-31",
          "finalAccessDate": "2099-12-31",
          "status": "ACTIVE",
          "paymentType": "CREDIT_CARD",
          "monthStart": "2022-12-07",
          "monthEnd": "2099-12-31",
          "nda": false,
          "userUuid": "fe6f4702-3355-432e-9f29-8e892dbe4d8e",
          "plan": {
            "planId": 1109,
            "name": "Pro",
            "description": "Wolfram Alpha Professional Subscription",
            "billingPeriod": "YEARLY",
            "planType": "PRO",
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
      "id": 7230372,
      "userId": 11013109,
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

console.log("修改后响应: " + JSON.stringify(obj)); // 调试：输出修改后的响应
$done({ body: JSON.stringify(obj) });
