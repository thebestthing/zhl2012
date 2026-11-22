/******************************************
 * Windy 天气数据 Surge 面板（全参数版）
 * 数据来源：Windy Point Forecast API（POST api.windy.com/api/point-forecast/v2）
 * 参数在模块参数表里填：CITY 显示名 / LAT 纬度 / LON 经度 / APIKEY 密钥 / MODEL 模式
 * argument 格式：CITY|LAT|LON|APIKEY|MODEL（模块用 {{{ }}} 占位符拼好）
 ******************************************/

const PARTS = (typeof $argument !== "undefined" ? String($argument || "") : "").split("|");
const CITY = (PARTS[0] || "北京").trim();
const LAT = parseFloat(PARTS[1]);
const LON = parseFloat(PARTS[2]);
const APIKEY = (PARTS[3] || "").trim();
const MODEL = (PARTS[4] || "gfs").trim() || "gfs";

function done(content, title) {
  $done({
    title: title || "Windy 天气",
    content: content,
    icon: "wind",
    "icon-color": "#0EA5E9"
  });
}

function fmt(n, d) {
  if (n === null || n === undefined || isNaN(n)) return "--";
  return Number(n).toFixed(d === undefined ? 1 : d);
}

function bar(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return "░░░░░░░░░░";
  let f = Math.round(Number(pct) / 10);
  if (f < 0) f = 0;
  if (f > 10) f = 10;
  return "█".repeat(f) + "░".repeat(10 - f);
}

const DIRS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
function windDir(u, v) {
  if (u === null || u === undefined || v === null || v === undefined) return "";
  const deg = (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360;
  return DIRS[Math.round(deg / 45) % 8] + "风";
}
function windSpeed(u, v) {
  if (u === null || u === undefined || v === null || v === undefined) return null;
  return Math.sqrt(u * u + v * v) * 3.6; // m/s -> km/h
}

const PTYPE = { 0: "无", 1: "雨", 3: "冻雨", 5: "雪", 7: "雨夹雪", 8: "冰粒" };

function hhmm(ts) {
  const d = new Date(ts);
  return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}
function dayLabel(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + "月" + d.getDate() + "日 " + hhmm(ts);
}

if (!APIKEY || APIKEY === "YOURKEY") {
  done("⚠️ 还没填 Windy 密钥\n1. 电脑打开 api.windy.com，注册后选 Point Forecast API，生成一个免费 Key\n2. 回 Surge 打开这个模块的参数表，把 Key 填进 APIKEY\n3. 城市改 CITY 显示名 + LAT/LON 经纬度（Windy 网站搜城市，详情里能看到经纬度），任何城市、镇、村都能查");
} else if (isNaN(LAT) || isNaN(LON)) {
  done("⚠️ 经纬度没填对\nLAT 是纬度（如 39.90），LON 是经度（如 116.40），到模块参数表里改。");
} else {
  const body = JSON.stringify({
    lat: LAT,
    lon: LON,
    model: MODEL,
    parameters: ["temp", "dewpoint", "rh", "wind", "windGust", "pressure", "precip", "snowPrecip", "convPrecip", "lclouds", "mclouds", "hclouds", "cape", "ptype"],
    levels: ["surface"],
    key: APIKEY
  });
  $httpClient.post(
    { url: "https://api.windy.com/api/point-forecast/v2", timeout: 15, headers: { "Content-Type": "application/json" }, body: body },
    function (err, resp, data) {
      if (err || !data) {
        return done("❌ 读取失败：" + (err ? String(err) : "无数据") + "\n检查网络，或密钥是否有效。");
      }
      const status = resp && (resp.status || resp.statusCode);
      if (status && status !== 200) {
        let msg = "";
        try { const ej = JSON.parse(data); msg = ej.message || ej.error || ""; } catch (e) { msg = String(data).slice(0, 80); }
        return done("❌ Windy 接口返回 " + status + (msg ? "：" + msg : "") + "\n多半是 APIKEY 不对，或这个 Key 不是 Point Forecast 类型的。");
      }
      try {
        const j = JSON.parse(data);
        const ts = j.ts || [];
        if (!ts.length) return done("这个模式在该位置没有数据（接口返回空）。换个 MODEL 试试，如 gfs。");
        const units = j.units || {};
        const get = (k, i) => (j[k] && j[k][i] !== undefined ? j[k][i] : null);
        const toC = (v) => (v === null ? null : (String(units["temp-surface"] || "K").indexOf("K") === 0 ? v - 273.15 : v));

        // 当前时次：第一个 >= 现在的点，没有就用最后一个
        const now = Date.now();
        let idx = ts.findIndex(t => t >= now);
        if (idx < 0) idx = ts.length - 1;

        const temp = toC(get("temp-surface", idx));
        const dew = toC(get("dewpoint-surface", idx));
        const rh = get("rh-surface", idx);
        const u = get("wind_u-surface", idx);
        const v = get("wind_v-surface", idx);
        const gust = get("gust-surface", idx);
        const pres = get("pressure-surface", idx);
        const precip = get("past3hprecip-surface", idx);
        const snow = get("past3hsnowprecip-surface", idx);
        const conv = get("past3hconvprecip-surface", idx);
        const lc = get("lclouds-surface", idx);
        const mc = get("mclouds-surface", idx);
        const hc = get("hclouds-surface", idx);
        const cape = get("cape-surface", idx);
        const ptype = get("ptype-surface", idx);

        const S = [];
        S.push("📍 " + CITY + " · " + MODEL.toUpperCase() + " 模式 · 预报时次 " + dayLabel(ts[idx]));

        // 气温
        const tSec = [];
        let t1 = "气温 " + fmt(temp) + "℃";
        if (dew !== null) t1 += " · 露点 " + fmt(dew) + "℃";
        if (rh !== null) t1 += " · 湿度 " + fmt(rh, 0) + "%";
        tSec.push(t1);
        // 未来 24h 高低温
        let hi = null, lo = null;
        for (let i = idx; i < ts.length && ts[i] <= ts[idx] + 24 * 3600 * 1000; i++) {
          const tv = toC(get("temp-surface", i));
          if (tv !== null) { if (hi === null || tv > hi) hi = tv; if (lo === null || tv < lo) lo = tv; }
        }
        if (hi !== null) tSec.push("未来24h 最高 " + fmt(hi) + "℃ · 最低 " + fmt(lo) + "℃");
        S.push("🌡️ 气温\n" + tSec.join("\n"));

        // 风
        const wSec = [];
        const spd = windSpeed(u, v);
        let w1 = windDir(u, v) + " " + fmt(spd, 0) + " km/h";
        if (gust !== null) w1 += " · 阵风 " + fmt(gust * 3.6, 0) + " km/h";
        wSec.push(w1);
        if (pres !== null) wSec.push("气压 " + fmt(pres / 100, 0) + " hPa");
        S.push("💨 风与气压\n" + wSec.join("\n"));

        // 云量
        if (lc !== null || mc !== null || hc !== null) {
          const tot = Math.max(lc || 0, mc || 0, hc || 0);
          S.push("☁️ 云量 " + bar(tot) + " " + fmt(tot, 0) + "%\n低云 " + fmt(lc, 0) + "% · 中云 " + fmt(mc, 0) + "% · 高云 " + fmt(hc, 0) + "%");
        }

        // 降水
        const pSec = [];
        pSec.push("近3h 降水 " + fmt(precip !== null ? precip * 1000 : null) + " mm · 降雪 " + fmt(snow !== null ? snow * 1000 : null) + " mm · 对流降水 " + fmt(conv !== null ? conv * 1000 : null) + " mm");
        let p2 = "降水类型 " + (ptype !== null && PTYPE[ptype] !== undefined ? PTYPE[ptype] : "--");
        if (cape !== null) p2 += " · CAPE " + fmt(cape, 0) + " J/kg";
        pSec.push(p2);
        S.push("🌧️ 降水\n" + pSec.join("\n"));

        // 未来时次（8 个点，约 24 小时）
        const fSec = [];
        for (let i = idx; i < Math.min(ts.length, idx + 8); i++) {
          const ft = toC(get("temp-surface", i));
          const fs = windSpeed(get("wind_u-surface", i), get("wind_v-surface", i));
          const fp = get("past3hprecip-surface", i);
          fSec.push(hhmm(ts[i]) + "  " + fmt(ft) + "℃  风 " + fmt(fs, 0) + " km/h  雨 " + fmt(fp !== null ? fp * 1000 : null) + "mm");
        }
        if (fSec.length) S.push("🕐 未来预报\n" + fSec.join("\n"));

        done(S.join("\n\n"), "🌍 " + CITY + " 天气 · Windy");
      } catch (e) {
        done("❌ 解析失败：" + (e.message || e));
      }
    }
  );
}
