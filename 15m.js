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
 
// 定义一个对象，假设这是从服务器获取的
obj = {
  code: 1,
  data: {
    id: 16036,
    dy_option: "",
    money: 0,
    mobile: "13727968870",
    vip_sta: "0",
    avatar: "http://15m.xiexiebama.com/user/face/20220412/cb2476aacebd0bd86b7c4960f2b324bf.rosi",
    token: "7d2d05cf08b888acaafb7f3cec59fccc813e28f9",
    text: "alipay:",
    username: "13727968870",
    days: 0,
    end_time: 1717776000,
    nickname: "在我梦里",
    text_url: "https://shop.youneiku.com/card/routes/shop.php?action=payindex&user_id=16036",
    status: "normal"
  },
  msg: "",
  time: "1717848540"
};

obj.data.money = 999;

body = JSON.stringify(obj);
$done({body});
