// 全民K歌 VIP 解锁脚本
// 注意：需要 Surge 配置启用 MITM
let body = $response.body;

try {
    let json = JSON.parse(body);

    // 模拟 VIP 权限
    if (json && json.data) {
        json.data.vip = {
            "isVip": 1,         // 表示用户是 VIP
            "vipType": 1,       // VIP 类型，1 表示普通 VIP，2 表示 SVIP 等
            "vipLevel": 10,     // VIP 等级，可调整
            "validTime": "2099-12-31", // VIP 到期时间
            "isAutoRenew": 1    // 是否自动续费
        };
    }

    $done({ body: JSON.stringify(json) });
} catch (e) {
    console.log(`全民K歌VIP解锁脚本错误: ${e.message}`);
    $done({});
}