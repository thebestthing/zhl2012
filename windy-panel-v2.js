/******************************************
 * Windy 天气数据 Surge 面板（全图层版 v2）
 * 数据来源：Windy Point Forecast API，四个模式各取一次：
 *   天气 MODEL(默认gfs) / 海洋 gfsWave / 洋流 cmems / 空气质量 cams
 * 参数在模块参数表里填：CITY 显示名 / LAT 纬度 / LON 经度 / APIKEY 密钥 / MODEL 天气模式
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
function compass(degFrom) {
  if (degFrom === null || degFrom === undefined || isNaN(degFrom)) return "";
  return DIRS[Math.round(((degFrom % 360) + 360) % 360 / 45) % 8];
}
function windDir(u, v) {
  if (u === null || u === undefined || v === null || v === undefined) return "";
  const deg = (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360;
  return compass(deg) + "风";
}
function vecSpeed(u, v) {
  if (u === null || u === undefined || v === null || v === undefined) return null;
  return Math.sqrt(u * u + v * v);
}
function flowDir(u, v) { // 洋流：流向（朝向）
  if (u === null || u === undefined || v === null || v === undefined) return "";
  const deg = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;
  return compass(deg);
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
function unitStr(u) {
  if (!u) return "";
  return String(u).replace("µg", "μg").replace("*m-3", "/m³").replace("*m-2", "/m²").replace("m*s-1", "m/s");
}
function aqiLevel(a) {
  if (a === null || a === undefined) return "";
  if (a <= 50) return "优";
  if (a <= 100) return "良";
  if (a <= 150) return "轻度污染";
  if (a <= 200) return "中度污染";
  if (a <= 300) return "重度污染";
  return "严重污染";
}

if (!APIKEY || APIKEY === "YOURKEY") {
  done("⚠️ 还没填 Windy 密钥\n1. 电脑打开 api.windy.com，注册后选 Point Forecast API，生成一个免费 Key\n2. 回 Surge 打开这个模块的参数表，把 Key 填进 APIKEY\n3. 城市改 CITY 显示名 + LAT/LON 经纬度（Windy 网站搜城市，详情里能看到经纬度），任何城市、镇、村都能查");
} else if (isNaN(LAT) || isNaN(LON)) {
  done("⚠️ 经纬度没填对\nLAT 是纬度（如 39.90），LON 是经度（如 116.40），到模块参数表里改。");
} else {
  const weatherParams = ["temp", "dewpoint", "rh", "wind", "windGust", "pressure", "precip", "snowPrecip", "convPrecip", "lclouds", "mclouds", "hclouds", "cape", "ptype"];
  if (/^icon/i.test(MODEL)) weatherParams.push("weatherWarnings"); // 仅 icon 系列支持气象预警
  const jobs = [
    { name: "weather", model: MODEL, parameters: weatherParams },
    { name: "sea", model: "gfsWave", parameters: ["waves", "windWaves", "swell1", "swell2", "wavesPower"] },
    { name: "current", model: "cmems", parameters: ["currents", "currentsTide"] },
    { name: "air", model: "cams", parameters: ["aqi", "pm2p5", "pm10", "no2", "so2sm", "go3", "cosc", "dustsm"] }
  ];
  const results = {};
  let pending = jobs.length;

  jobs.forEach(job => {
    const body = JSON.stringify({ lat: LAT, lon: LON, model: job.model, parameters: job.parameters, levels: ["surface"], key: APIKEY });
    $httpClient.post(
      { url: "https://api.windy.com/api/point-forecast/v2", timeout: 15, headers: { "Content-Type": "application/json" }, body: body },
      function (err, resp, data) {
        const status = resp && (resp.status || resp.statusCode);
        if (!err && data && (!status || status === 200)) {
          try { results[job.name] = JSON.parse(data); } catch (e) { results[job.name] = null; }
        } else {
          results[job.name] = null;
          if (job.name === "weather") results.weatherError = "接口返回 " + (status || err || "无数据");
        }
        if (--pending === 0) render();
      }
    );
  });

  function curIdx(j) {
    const ts = j.ts || [];
    const now = Date.now();
    let idx = ts.findIndex(t => t >= now);
    if (idx < 0) idx = ts.length - 1;
    return idx;
  }
  function get(j, k, i) {
    return (j && j[k] && j[k][i] !== undefined) ? j[k][i] : null;
  }

  function render() {
    const w = results.weather;
    if (!w || !(w.ts || []).length) {
      return done("❌ 天气数据没取到" + (results.weatherError ? "（" + results.weatherError + "）" : "") + "\n多半是 APIKEY 不对，或这个 Key 不是 Point Forecast 类型的。");
    }
    const units = w.units || {};
    const idx = curIdx(w);
    const toC = (v) => (v === null ? null : (String(units["temp-surface"] || "K").indexOf("K") === 0 ? v - 273.15 : v));
    const S = [];
    S.push("📍 " + CITY + " · " + MODEL.toUpperCase() + " · 预报时次 " + dayLabel(w.ts[idx]));

    // ---- 天气 ----
    const temp = toC(get(w, "temp-surface", idx));
    const dew = toC(get(w, "dewpoint-surface", idx));
    const rh = get(w, "rh-surface", idx);
    const tSec = [];
    let t1 = "气温 " + fmt(temp) + "℃";
    if (dew !== null) t1 += " · 露点 " + fmt(dew) + "℃";
    if (rh !== null) t1 += " · 湿度 " + fmt(rh, 0) + "%";
    tSec.push(t1);
    let hi = null, lo = null;
    for (let i = idx; i < w.ts.length && w.ts[i] <= w.ts[idx] + 24 * 3600 * 1000; i++) {
      const tv = toC(get(w, "temp-surface", i));
      if (tv !== null) { if (hi === null || tv > hi) hi = tv; if (lo === null || tv < lo) lo = tv; }
    }
    if (hi !== null) tSec.push("未来24h 最高 " + fmt(hi) + "℃ · 最低 " + fmt(lo) + "℃");
    S.push("🌡️ 气温\n" + tSec.join("\n"));

    const u = get(w, "wind_u-surface", idx), v = get(w, "wind_v-surface", idx);
    const gust = get(w, "gust-surface", idx), pres = get(w, "pressure-surface", idx);
    const spd = vecSpeed(u, v);
    const wSec = [];
    wSec.push(windDir(u, v) + " " + fmt(spd !== null ? spd * 3.6 : null, 0) + " km/h" + (gust !== null ? " · 阵风 " + fmt(gust * 3.6, 0) + " km/h" : ""));
    if (pres !== null) wSec.push("气压 " + fmt(pres / 100, 0) + " hPa");
    S.push("💨 风与气压\n" + wSec.join("\n"));

    const lc = get(w, "lclouds-surface", idx), mc = get(w, "mclouds-surface", idx), hc = get(w, "hclouds-surface", idx);
    if (lc !== null || mc !== null || hc !== null) {
      const tot = Math.max(lc || 0, mc || 0, hc || 0);
      S.push("☁️ 云量 " + bar(tot) + " " + fmt(tot, 0) + "%\n低云 " + fmt(lc, 0) + "% · 中云 " + fmt(mc, 0) + "% · 高云 " + fmt(hc, 0) + "%");
    }

    const precip = get(w, "past3hprecip-surface", idx), snow = get(w, "past3hsnowprecip-surface", idx), conv = get(w, "past3hconvprecip-surface", idx);
    const cape = get(w, "cape-surface", idx), ptype = get(w, "ptype-surface", idx);
    // 气象预警（仅 icon 系列有此参数）：汇总未来 24h 出现过的预警代码
    const warnArr = w["weatherwarnings-surface"];
    if (warnArr) {
      const WM = { 45: "雾", 48: "雾凇", 51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨", 56: "冻毛毛雨", 57: "冻毛毛雨", 61: "雨", 63: "雨", 65: "雨", 66: "冻雨", 67: "冻雨", 71: "雪", 73: "雪", 75: "雪", 77: "雪粒", 80: "阵雨", 81: "阵雨", 82: "暴雨", 85: "阵雪", 86: "阵雪", 95: "雷暴", 96: "雷暴伴冰雹" };
      const seen = [];
      for (let i = idx; i < w.ts.length && w.ts[i] <= w.ts[idx] + 24 * 3600 * 1000; i++) {
        const code = warnArr[i];
        if (code && WM[code] && seen.indexOf(WM[code]) < 0) seen.push(WM[code]);
      }
      if (seen.length) S.push("⚠️ 气象预警\n未来24h: " + seen.join("、"));
    }

    const pSec = [];
    pSec.push("近3h 降水 " + fmt(precip !== null ? precip * 1000 : null) + " mm · 降雪 " + fmt(snow !== null ? snow * 1000 : null) + " mm · 对流 " + fmt(conv !== null ? conv * 1000 : null) + " mm");
    pSec.push("降水类型 " + (ptype !== null && PTYPE[ptype] !== undefined ? PTYPE[ptype] : "--") + (cape !== null ? " · CAPE " + fmt(cape, 0) + " J/kg" : ""));
    S.push("🌧️ 降水\n" + pSec.join("\n"));

    // ---- 海洋 ----
    const sea = results.sea;
    if (sea && (sea.ts || []).length) {
      const si = curIdx(sea);
      const wh = get(sea, "waves_height-surface", si), wp = get(sea, "waves_period-surface", si), wd = get(sea, "waves_direction-surface", si);
      const wwh = get(sea, "wwaves_height-surface", si), wwp = get(sea, "wwaves_period-surface", si), wwd = get(sea, "wwaves_direction-surface", si);
      const s1h = get(sea, "swell1_height-surface", si), s1p = get(sea, "swell1_period-surface", si), s1d = get(sea, "swell1_direction-surface", si);
      const s2h = get(sea, "swell2_height-surface", si), s2p = get(sea, "swell2_period-surface", si), s2d = get(sea, "swell2_direction-surface", si);
      const pw = get(sea, "waves_power-surface", si);
      const seaSec = [];
      if (wh !== null) seaSec.push("海浪 高 " + fmt(wh, 2) + " m · 周期 " + fmt(wp) + " s · 来自" + compass(wd) + " " + fmt(wd, 0) + "°");
      if (wwh !== null) seaSec.push("风浪 高 " + fmt(wwh, 2) + " m · 周期 " + fmt(wwp) + " s · 来自" + compass(wwd) + " " + fmt(wwd, 0) + "°");
      if (s1h !== null) seaSec.push("涌浪 高 " + fmt(s1h, 2) + " m · 周期 " + fmt(s1p) + " s · 来自" + compass(s1d) + " " + fmt(s1d, 0) + "°");
      if (s2h !== null) seaSec.push("二级涌浪 高 " + fmt(s2h, 2) + " m · 周期 " + fmt(s2p) + " s · 来自" + compass(s2d) + " " + fmt(s2d, 0) + "°");
      if (pw !== null) seaSec.push("波浪功率 " + fmt(pw, 0) + " kW/m");
      S.push("🌊 海洋\n" + (seaSec.length ? seaSec.join("\n") : "内陆无海浪数据"));
    }

    // ---- 洋流 ----
    const cur = results.current;
    if (cur && (cur.ts || []).length) {
      const ci = curIdx(cur);
      const cu = get(cur, "seacurrents_u-surface", ci), cvv = get(cur, "seacurrents_v-surface", ci);
      const tu = get(cur, "seacurrents_tide_u-surface", ci), tv = get(cur, "seacurrents_tide_v-surface", ci);
      const cSec = [];
      const cs = vecSpeed(cu, cvv);
      if (cs !== null) cSec.push("洋流 " + fmt(cs, 2) + " m/s · 流向" + flowDir(cu, cvv));
      const tss = vecSpeed(tu, tv);
      if (tss !== null) cSec.push("潮流 " + fmt(tss, 2) + " m/s · 流向" + flowDir(tu, tv));
      if (cSec.length) S.push("🌀 洋流\n" + cSec.join("\n"));
    }

    // ---- 空气质量 ----
    const air = results.air;
    if (air && (air.ts || []).length) {
      const ai = curIdx(air);
      const au = air.units || {};
      const aSec = [];
      const aqi = get(air, "aqi_us-surface", ai);
      if (aqi !== null) aSec.push("AQI " + fmt(aqi, 0) + " · " + aqiLevel(aqi) + "（美标）");
      const items = [
        ["PM2.5", "pm2p5-surface"], ["PM10", "pm10-surface"], ["二氧化氮", "no2-surface"],
        ["二氧化硫", "chem_so2sm-surface"], ["地表臭氧", "go3-surface"], ["一氧化碳", "chem_cosc-surface"], ["粉尘", "chem_dustsm-surface"]
      ];
      items.forEach(([label, key]) => {
        const val = get(air, key, ai);
        if (val !== null) aSec.push(label + " " + fmt(val) + " " + unitStr(au[key]));
      });
      if (aSec.length) S.push("😷 空气质量\n" + aSec.join("\n"));
    }

    // ---- 未来预报 ----
    const fSec = [];
    for (let i = idx; i < Math.min(w.ts.length, idx + 8); i++) {
      const ft = toC(get(w, "temp-surface", i));
      const fs = vecSpeed(get(w, "wind_u-surface", i), get(w, "wind_v-surface", i));
      const fp = get(w, "past3hprecip-surface", i);
      fSec.push(hhmm(w.ts[i]) + "  " + fmt(ft) + "℃  风 " + fmt(fs !== null ? fs * 3.6 : null, 0) + " km/h  雨 " + fmt(fp !== null ? fp * 1000 : null) + "mm");
    }
    if (fSec.length) S.push("🕐 未来预报\n" + fSec.join("\n"));

    done(S.join("\n\n"), "🌍 " + CITY + " · Windy 全图层");
  }
}
