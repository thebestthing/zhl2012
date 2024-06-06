/*************************************

项目名称：15m
更新日期：2024-6-6
脚本作者：@zhlpp
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************
[rewrite_local]
^http?:\/\/www\.18m\.jinyemimi\.com\/api\/api_data_2\/user\/myinfo url script-response-body https://raw.githubusercontent.com/thebestthing/zhl2012/main/15m.js

[mitm]
hostname = *.18m.jinyemimi.com

*************************************/

var body = $response.body;
var url = $request.url;
var obj = JSON.parse(body);
 
const money = 'user/myinfo';
if (url.indexOf(money) != -1) {
    obj.data.id = 16036;
    obj.data.username = 13727968870;
    obj.data.nickname = "在我梦里破解";
    obj.data.money = 99999;
    obj.data.token = '7d2d05cf08b888acaafb7f3cec59fccc813e28f9';
    obj.data.status = "normal";
    obj.data.vip_sta = "0";
    obj.data.dy_option = "";
    obj.data.days = 0;
    obj.data.end_time = 1717603200;
    obj.data.text = "alipay";
    obj.data.text_url = "https:\/\/shop.youneiku.com\/card\/routes\/shop.php?action=payindex&user_id=16036";
    obj.data.avatar = "http:\/\/15m.xiexiebama.com\/user\/face\/20220412\/cb2476aacebd0bd86b7c4960f2b324bf.rosi";
    body = JSON.stringify(obj);
}
$done({body});
