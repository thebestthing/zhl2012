/*************************************

项目名称：15m
更新日期：2024-6-6
脚本作者：@zhlpp
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************
[rewrite_local]
^http?:\/\/www\.18m\.jinyemimi\.com\/api\/api_data_2\/user\/myinfo url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/15m.js

[mitm]
hostname = 18m.jinyemimi.com

*************************************/

var body = $response.body;
var obj = JSON.parse(body);
 
obj = {
    "code": 1,
    "msg": "",
    "time": "1717888888",
    "data": {
        "id": 16036,
        "username": "13727968870",
        "nickname": "在我梦里",
        "mobile": "13727968870",
        "avatar": "http://15m.xiexiebama.com/user/face/20220412/cb2476aacebd0bd86b7c4960f2b324bf.rosi",
        "money": 9999,
        "status": "normal",
        "vip_sta": "0",
        "dy_option": "",
        "days": 0,
        "end_time": 1717888888,
        "token": "7d2d05cf08b888acaafb7f3cec59fccc813e28f9",
        "text": "alipay",
        "text_url": "https://shop.youneiku.com/card/routes/shop.php?action=payindex&user_id=16036"
    }
};
body = JSON.stringify(obj);
$done({body});
