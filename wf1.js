
// 转换时间: 2023/12/24 18:59:17
// 兼容性转换
if (typeof $request !== 'undefined') {
  const lowerCaseRequestHeaders = Object.fromEntries(
    Object.entries($request.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $request.headers = new Proxy(lowerCaseRequestHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}
if (typeof $response !== 'undefined') {
  const lowerCaseResponseHeaders = Object.fromEntries(
    Object.entries($response.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $response.headers = new Proxy(lowerCaseResponseHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}


// QX 相关
var setInterval = () => {}
var clearInterval = () => {}
var $task = {
  fetch: url => {
    return new Promise((resolve, reject) => {
      if (url.method == 'POST') {
        $httpClient.post(url, (error, response, data) => {
          if (response) {
            response.body = data
            resolve(response, {
              error: error,
            })
          } else {
            resolve(null, {
              error: error,
            })
          }
        })
      } else {
        $httpClient.get(url, (error, response, data) => {
          if (response) {
            response.body = data
            resolve(response, {
              error: error,
            })
          } else {
            resolve(null, {
              error: error,
            })
          }
        })
      }
    })
  },
}

var $prefs = {
  removeValueForKey: key => {
    return $persistentStore.write(null, key)
  },
  valueForKey: key => {
    return $persistentStore.read(key)
  },
  setValueForKey: (val, key) => {
    return $persistentStore.write(val, key)
  },
}

var $notify = (title = '', subt = '', desc = '', opts) => {
  const toEnvOpts = (rawopts) => {
    if (!rawopts) return rawopts 
    if (typeof rawopts === 'string') {
      if ('undefined' !== typeof $loon) return rawopts
      else if('undefined' !== typeof $rocket) return rawopts
      else return { url: rawopts }
    } else if (typeof rawopts === 'object') {
      if ('undefined' !== typeof $loon) {
        let openUrl = rawopts.openUrl || rawopts.url || rawopts['open-url']
        let mediaUrl = rawopts.mediaUrl || rawopts['media-url']
        return { openUrl, mediaUrl }
      } else {
        let openUrl = rawopts.url || rawopts.openUrl || rawopts['open-url']
        if('undefined' !== typeof $rocket) return openUrl
        return { url: openUrl }
      }
    } else {
      return undefined
    }
  }
  console.log(title, subt, desc, toEnvOpts(opts))
  $notification.post(title, subt, desc, toEnvOpts(opts))
}
var _scriptSonverterOriginalDone = $done
var _scriptSonverterDone = (val = {}) => {
  let result
  if (
    (typeof $request !== 'undefined' &&
    typeof val === 'object' &&
    typeof val.status !== 'undefined' &&
    typeof val.headers !== 'undefined' &&
    typeof val.body !== 'undefined') || false
  ) {
    try {
      for (const part of val?.status?.split(' ')) {
        const statusCode = parseInt(part, 10)
        if (!isNaN(statusCode)) {
          val.status = statusCode
          break
        }
      }
    } catch (e) {}
    if (!val.status) {
      val.status = 200
    }
    if (!val.headers) {
      val.headers = {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,GET,OPTIONS,PUT,DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      }
    }
    result = { response: val }
  } else {
    result = val
  }
  console.log('$done')
  try {
    console.log(JSON.stringify(result))
  } catch (e) {
    console.log(result)
  }
  _scriptSonverterOriginalDone(result)
}
var window = globalThis
window.$done = _scriptSonverterDone
var global = globalThis
global.$done = _scriptSonverterDone

var body = $response.body; 
var obj = JSON.parse(body); 
obj= {
 "account": {
    "info": {
      "hasError": false,
      "error": null,
      "name": "Cracked",
      "email": "Cracked by xxx"
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
        "userId": 9782356,
        "productId": 9
      }
    },
    "permissions": {
      "hasError": false,
      "error": null,
      "features": {
        "practiceSheets": {
          "units": null,
          "value": true
        },
        "embeddablePods": {
          "units": null,
          "value": true
        },
        "webApps": {
          "units": null,
          "value": ""
        },
        "fileUpload": {
          "units": "MB",
          "value": 0
        },
        "imageInput": {
          "units": "MB",
          "value": 0
        },
        "showSteps": {
          "units": null,
          "value": true
        },
        "specialCharacterKeyboards": {
          "units": null,
          "value": true
        },
        "pdfDownload": {
          "units": null,
          "value": true
        },
        "copyablePlaintext": {
          "units": null,
          "value": true
        },
        "cdfDownload": {
          "units": null,
          "value": true
        },
        "dataInput": {
          "units": null,
          "value": true
        },
        "cdfInteractivePods": {
          "units": null,
          "value": true
        },
        "customizeGraphicsPods": {
          "units": null,
          "value": true
        },
        "storeDownloadedData": {
          "units": null,
          "value": true
        },
        "longerTimeouts": {
          "units": "seconds",
          "value": 0
        },
        "zoomSubpods": {
          "units": null,
          "value": true
        },
        "downloadPodData": {
          "units": null,
          "value": true
        },
        "removeAds": {
          "units": null,
          "value": true
        },
        "emailProductSupport": {
          "units": null,
          "value": true
        },
        "saveSubpodAsImage": {
          "units": null,
          "value": true
        }
      }
    },
    "subscriptions": {
      "hasError": false,
      "error": null,
      "hasSubscriptions": true,
      "primarySubscription": {
        "subscriptionId": 4486323,
        "userId": 9782356,
        "planId": 1106,
        "startDate": "2020-08-04",
        "nextBillingDate": "2099-12-31",
        "finalAccessDate": "2099-12-31",
        "status": "ACTIVE",
        "paymentType": "NONE",
        "monthStart": "2020-08-04",
        "monthEnd": "2099-12-31",
        "nda": false,
        "userUuid": "ce6341b4-5c9c-45b9-7584-7542ff503b1c",
        "plan": {
          "planId": 1109,
          "name": "Professional",
          "description": "Wolfram Alpha Professional Subscription",
          "billingPeriod": "NONE",
          "planType": "PRO",
          "productId": 12,
          "canUpgrade": false,
          "product": {
            "productId": 12,
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
         "subscriptionId": 4486323,
        "userId": 9782356,
        "planId": 1106,
        "startDate": "2020-08-04",
        "nextBillingDate": "2099-12-31",
        "finalAccessDate": "2099-12-31",
        "status": "ACTIVE",
        "paymentType": "NONE",
        "monthStart": "2020-08-04",
        "monthEnd": "2099-12-31",
        "nda": false,
        "userUuid": "ce6341b4-5c9c-45b9-7584-7542ff503b1c",
        "plan": {
          "planId": 1109,
          "name": "Pro",
          "description": "Wolfram Alpha Professional Subscription",
          "billingPeriod": "NONE",
          "planType": "PRO",
          "productId": 12,
          "canUpgrade": false,
          "product": {
            "productId": 12,
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
      "id": 8058195,
      "userId": 9782356,
      "createdDate": 1596536830000,
      "updatedDate": 1596536830000,
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
body = JSON.stringify(obj); 
_scriptSonverterDone(body);
