/******************************************
 * Windy 天气数据 Surge 面板（全图层版 v5 · 三源全免费 · 紧凑排版 + 高空分层/体感/湿球/风功率）
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
const QWHOST = (PARTS[5] || "").trim();
const QWKEY = (PARTS[6] || "").trim();

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
const TYLV = { TD: "热带低压", TS: "热带风暴", STS: "强热带风暴", TY: "台风", STY: "强台风", SuperTY: "超强台风" };
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, dLa = (lat2 - lat1) * Math.PI / 180, dLo = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
function parseJsonp(data) {
  const m = String(data).match(/\((\{[\s\S]*\})\)?\s*;?\s*$/);
  if (!m) throw new Error("JSONP 格式不对");
  return JSON.parse(m[1]);
}

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
  const weatherParams = ["temp", "dewpoint", "rh", "wind", "windGust", "pressure", "precip", "snowPrecip", "convPrecip", "lclouds", "mclouds", "hclouds", "cape", "ptype", "gh"];
  if (/^icon/i.test(MODEL)) weatherParams.push("weatherWarnings"); // 仅 icon 系列支持气象预警
  const jobs = [
    { name: "weather", model: MODEL, parameters: weatherParams, levels: ["surface", "850h", "500h"] },
    { name: "sea", model: "gfsWave", parameters: ["waves", "windWaves", "swell1", "swell2", "wavesPower"] },
    { name: "current", model: "cmems", parameters: ["currents", "currentsTide"] },
    { name: "air", model: "cams", parameters: ["aqi", "pm2p5", "pm10", "no2", "so2sm", "go3", "cosc", "dustsm"] }
  ];
  const results = {};
  let pending = jobs.length;

  jobs.forEach(job => {
    const body = JSON.stringify({ lat: LAT, lon: LON, model: job.model, parameters: job.parameters, levels: job.levels || ["surface"], key: APIKEY });
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

  // ===== 额外数据源（全免费）：Open-Meteo / 中央气象台台风 / 和风预警 =====
  function extraDone() { if (--pending === 0) render(); }
  pending += (QWHOST && QWKEY) ? 5 : 4;

  // Open-Meteo 预报：紫外线/太阳辐射/能见度/冰冻高度/积雪深度
  $httpClient.get({ url: "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON + "&hourly=uv_index,shortwave_radiation,visibility,freezing_level_height,snow_depth,apparent_temperature,wet_bulb_temperature_2m&forecast_days=2&timeformat=unixtime", timeout: 15 }, function (err, resp, data) {
    try { results.om = (!err && data) ? JSON.parse(data) : null; } catch (e) { results.om = null; }
    extraDone();
  });
  // Open-Meteo 海洋：海水温度（内陆可能无值）
  $httpClient.get({ url: "https://marine-api.open-meteo.com/v1/marine?latitude=" + LAT + "&longitude=" + LON + "&current=sea_surface_temperature", timeout: 15 }, function (err, resp, data) {
    try { results.omSea = (!err && data) ? JSON.parse(data) : null; } catch (e) { results.omSea = null; }
    extraDone();
  });
  // Open-Meteo 空气：气溶胶光学厚度
  $httpClient.get({ url: "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" + LAT + "&longitude=" + LON + "&current=aerosol_optical_depth", timeout: 15 }, function (err, resp, data) {
    try { results.omAir = (!err && data) ? JSON.parse(data) : null; } catch (e) { results.omAir = null; }
    extraDone();
  });
  // 中央气象台台风网：活跃台风（无活跃台风则不出这一块）
  $httpClient.get({ url: "https://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_default", timeout: 15 }, function (err, resp, data) {
    if (err || !data) { results.typhoon = []; return extraDone(); }
    let actives = [];
    try {
      const list = parseJsonp(data).typhoonList || [];
      actives = list.filter(t => t[7] !== "stop").slice(0, 3);
    } catch (e) { results.typhoon = []; return extraDone(); }
    if (!actives.length) { results.typhoon = []; return extraDone(); }
    results.typhoon = [];
    let left = actives.length;
    actives.forEach(t => {
      $httpClient.get({ url: "https://typhoon.nmc.cn/weatherservice/typhoon/jsons/view_" + t[0], timeout: 15 }, function (e2, r2, d2) {
        try {
          const pts = parseJsonp(d2).typhoon[8] || [];
          const p = pts[pts.length - 1];
          if (p) results.typhoon.push({ num: t[3], cn: t[2], en: t[1], lv: TYLV[p[3]] || p[3], lon: p[4], lat: p[5], pres: p[6], wind: p[7], mvDir: p[8], mvSpd: p[9] });
        } catch (e3) { /* 单个台风解析失败就跳过 */ }
        if (--left === 0) extraDone();
      });
    });
  });
  // 和风天气官方预警（填了 QWHOST/QWKEY 才请求）
  if (QWHOST && QWKEY) {
    $httpClient.get({ url: "https://" + QWHOST + "/v7/warning/now?location=" + LON.toFixed(2) + "," + LAT.toFixed(2) + "&key=" + QWKEY, timeout: 15 }, function (err, resp, data) {
      try {
        const j = (!err && data) ? JSON.parse(data) : null;
        results.qwWarn = (j && j.code === "200" && j.warning) ? j.warning : [];
      } catch (e) { results.qwWarn = []; }
      extraDone();
    });
  }

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
    const L = [];
    L.push("📍 " + CITY + " · " + MODEL.toUpperCase() + " · " + dayLabel(w.ts[idx]));

    // Open-Meteo 当前小时取值器（体感/湿球/环境补充共用）
    let omHv = function () { return null; };
    if (results.om && results.om.hourly && results.om.hourly.time) {
      const ht = results.om.hourly.time, nowS = Date.now() / 1000;
      let omI = 0;
      for (let i = 0; i < ht.length; i++) { if (ht[i] <= nowS) omI = i; else break; }
      const omH = results.om.hourly;
      omHv = function (k) { return (omH[k] && omH[k][omI] !== undefined) ? omH[k][omI] : null; };
    }
    const appT = omHv("apparent_temperature");
    const wbT = omHv("wet_bulb_temperature_2m");

    // 气温（一行）
    const temp = toC(get(w, "temp-surface", idx));
    const dew = toC(get(w, "dewpoint-surface", idx));
    const rh = get(w, "rh-surface", idx);
    let hi = null, lo = null;
    for (let i = idx; i < w.ts.length && w.ts[i] <= w.ts[idx] + 24 * 3600 * 1000; i++) {
      const tv = toC(get(w, "temp-surface", i));
      if (tv !== null) { if (hi === null || tv > hi) hi = tv; if (lo === null || tv < lo) lo = tv; }
    }
    L.push("🌡️ " + fmt(temp) + "℃" + (dew !== null ? " · 露点 " + fmt(dew) + "℃" : "") + (rh !== null ? " · 湿度 " + fmt(rh, 0) + "%" : "") + (hi !== null ? " · 24h " + fmt(lo) + "~" + fmt(hi) + "℃" : "") + (appT !== null ? " · 体感 " + fmt(appT) + "℃" : "") + (wbT !== null ? " · 湿球 " + fmt(wbT) + "℃" : ""));

    // 风与气压（一行）
    const u = get(w, "wind_u-surface", idx), v = get(w, "wind_v-surface", idx);
    const gust = get(w, "gust-surface", idx), pres = get(w, "pressure-surface", idx);
    const spd = vecSpeed(u, v);
    const wpd = (spd !== null && pres !== null && temp !== null) ? 0.5 * (pres / (287.05 * (temp + 273.15))) * Math.pow(spd, 3) : null;
    L.push("💨 " + windDir(u, v) + " " + fmt(spd !== null ? spd * 3.6 : null, 0) + " km/h" + (gust !== null ? " · 阵风 " + fmt(gust * 3.6, 0) : "") + (pres !== null ? " · 气压 " + fmt(pres / 100, 0) + " hPa" : "") + (wpd !== null ? " · 风功率 " + fmt(wpd, 0) + "W/m²" : ""));

    // 高空分层 850/500 hPa（一行）
    {
      const toCL = (val, key) => (val === null ? null : (String(units[key] || "K").indexOf("K") === 0 ? val - 273.15 : val));
      const hp = [];
      const s850 = vecSpeed(get(w, "wind_u-850h", idx), get(w, "wind_v-850h", idx));
      const t850 = toCL(get(w, "temp-850h", idx), "temp-850h");
      const r850 = get(w, "rh-850h", idx);
      if (s850 !== null || t850 !== null) hp.push("850hPa 风 " + fmt(s850 !== null ? s850 * 3.6 : null, 0) + "km/h" + (t850 !== null ? " · " + fmt(t850) + "℃" : "") + (r850 !== null ? " · 湿 " + fmt(r850, 0) + "%" : ""));
      const s500 = vecSpeed(get(w, "wind_u-500h", idx), get(w, "wind_v-500h", idx));
      const t500 = toCL(get(w, "temp-500h", idx), "temp-500h");
      const gh500 = get(w, "gh-500h", idx);
      if (s500 !== null || t500 !== null) hp.push("500hPa 风 " + fmt(s500 !== null ? s500 * 3.6 : null, 0) + "km/h" + (t500 !== null ? " · " + fmt(t500) + "℃" : "") + (gh500 !== null ? " · 高 " + fmt(gh500, 0) + "m" : ""));
      if (hp.length) L.push("🛫 " + hp.join(" ｜ "));
    }

    // 云量（一行）
    const lc = get(w, "lclouds-surface", idx), mc = get(w, "mclouds-surface", idx), hc = get(w, "hclouds-surface", idx);
    if (lc !== null || mc !== null || hc !== null) {
      const tot = Math.max(lc || 0, mc || 0, hc || 0);
      L.push("☁️ 云量 " + fmt(tot, 0) + "% " + bar(tot) + " 低" + fmt(lc, 0) + " 中" + fmt(mc, 0) + " 高" + fmt(hc, 0));
    }

    // 气象预警（icon 系列，一行）
    const warnArr = w["weatherwarnings-surface"];
    if (warnArr) {
      const WM = { 45: "雾", 48: "雾凇", 51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨", 56: "冻毛毛雨", 57: "冻毛毛雨", 61: "雨", 63: "雨", 65: "雨", 66: "冻雨", 67: "冻雨", 71: "雪", 73: "雪", 75: "雪", 77: "雪粒", 80: "阵雨", 81: "阵雨", 82: "暴雨", 85: "阵雪", 86: "阵雪", 95: "雷暴", 96: "雷暴伴冰雹" };
      const seen = [];
      for (let i = idx; i < w.ts.length && w.ts[i] <= w.ts[idx] + 24 * 3600 * 1000; i++) {
        const code = warnArr[i];
        if (code && WM[code] && seen.indexOf(WM[code]) < 0) seen.push(WM[code]);
      }
      if (seen.length) L.push("⚠️ 未来24h预警: " + seen.join("、"));
    }

    // 降水（一行）
    const precip = get(w, "past3hprecip-surface", idx), snow = get(w, "past3hsnowprecip-surface", idx), conv = get(w, "past3hconvprecip-surface", idx);
    const cape = get(w, "cape-surface", idx), ptype = get(w, "ptype-surface", idx);
    L.push("🌧️ 降水 " + fmt(precip !== null ? precip * 1000 : null) + "mm · 雪 " + fmt(snow !== null ? snow * 1000 : null) + "mm · 对流 " + fmt(conv !== null ? conv * 1000 : null) + "mm · " + (ptype !== null && PTYPE[ptype] !== undefined ? PTYPE[ptype] : "--") + (cape !== null ? " · CAPE " + fmt(cape, 0) : ""));

    // 海洋（一行）
    const sea = results.sea;
    if (sea && (sea.ts || []).length) {
      const si = curIdx(sea);
      const sp = [];
      const wh = get(sea, "waves_height-surface", si), wp = get(sea, "waves_period-surface", si), wd = get(sea, "waves_direction-surface", si);
      const wwh = get(sea, "wwaves_height-surface", si), wwp = get(sea, "wwaves_period-surface", si);
      const s1h = get(sea, "swell1_height-surface", si), s1p = get(sea, "swell1_period-surface", si);
      const s2h = get(sea, "swell2_height-surface", si), s2p = get(sea, "swell2_period-surface", si);
      const pw = get(sea, "waves_power-surface", si);
      if (wh !== null) sp.push("海浪 " + fmt(wh, 2) + "m/" + fmt(wp) + "s " + compass(wd));
      if (wwh !== null) sp.push("风浪 " + fmt(wwh, 2) + "m/" + fmt(wwp) + "s");
      if (s1h !== null) sp.push("涌浪 " + fmt(s1h, 2) + "m/" + fmt(s1p) + "s");
      if (s2h !== null) sp.push("二级涌浪 " + fmt(s2h, 2) + "m/" + fmt(s2p) + "s");
      if (pw !== null) sp.push("功率 " + fmt(pw, 0) + "kW/m");
      L.push("🌊 " + (sp.length ? sp.join(" · ") : "内陆无海浪数据"));
    }

    // 洋流（一行）
    const cur = results.current;
    if (cur && (cur.ts || []).length) {
      const ci = curIdx(cur);
      const cs = vecSpeed(get(cur, "seacurrents_u-surface", ci), get(cur, "seacurrents_v-surface", ci));
      const tss = vecSpeed(get(cur, "seacurrents_tide_u-surface", ci), get(cur, "seacurrents_tide_v-surface", ci));
      const cp = [];
      if (cs !== null) cp.push("洋流 " + fmt(cs, 2) + "m/s " + flowDir(get(cur, "seacurrents_u-surface", ci), get(cur, "seacurrents_v-surface", ci)));
      if (tss !== null) cp.push("潮流 " + fmt(tss, 2) + "m/s " + flowDir(get(cur, "seacurrents_tide_u-surface", ci), get(cur, "seacurrents_tide_v-surface", ci)));
      if (cp.length) L.push("🧭 " + cp.join(" · "));
    }

    // 空气质量（一行）
    const air = results.air;
    if (air && (air.ts || []).length) {
      const ai = curIdx(air);
      const ap = [];
      const aqi = get(air, "aqi_us-surface", ai);
      if (aqi !== null) ap.push("AQI " + fmt(aqi, 0) + " " + aqiLevel(aqi));
      const items = [["PM2.5", "pm2p5-surface"], ["PM10", "pm10-surface"], ["NO₂", "no2-surface"], ["SO₂", "chem_so2sm-surface"], ["O₃", "go3-surface"], ["粉尘", "chem_dustsm-surface"]];
      items.forEach(([label, key]) => { const val = get(air, key, ai); if (val !== null) ap.push(label + " " + fmt(val, 0)); });
      const co = get(air, "chem_cosc-surface", ai);
      if (co !== null) ap.push("CO " + fmt(co, 2) + "mg/m³");
      if (ap.length) L.push("😷 " + ap.join(" · ") + (aqi !== null || items.length ? "（颗粒物 μg/m³）" : ""));
    }

    // 台风（每个一行）
    if (results.typhoon && results.typhoon.length) {
      results.typhoon.forEach(t => {
        L.push("🌀 第" + String(t.num).slice(2) + "号 " + t.cn + " " + t.lv + " · " + fmt(t.lat, 1) + "°N " + fmt(t.lon, 1) + "°E · " + t.pres + "hPa · " + t.wind + "m/s · 距 " + haversineKm(LAT, LON, t.lat, t.lon) + "km · 向" + t.mvDir + "移 " + t.mvSpd + "km/h");
      });
    }

    // 官方预警（和风，一行）
    if (results.qwWarn && results.qwWarn.length) {
      L.push("📢 " + results.qwWarn.slice(0, 3).map(x => x.title || ((x.typeName || "") + (x.level || "") + "预警")).join("；"));
    }

    // 环境补充（一行）
    {
      const ep = [];
      const om = results.om;
      if (om && om.hourly && om.hourly.time) {
        const uv = omHv("uv_index");
        if (uv !== null) ep.push("UV " + fmt(uv) + " " + (uv < 3 ? "弱" : uv < 6 ? "中等" : uv < 8 ? "强" : uv < 11 ? "很强" : "极强"));
        const sr = omHv("shortwave_radiation");
        if (sr !== null) ep.push("辐射 " + fmt(sr, 0) + "W/m²");
        const vis = omHv("visibility");
        if (vis !== null) ep.push("能见度 " + fmt(vis / 1000) + "km");
        const fl = omHv("freezing_level_height");
        if (fl !== null) ep.push("冰冻高 " + fmt(fl, 0) + "m");
        const sd = omHv("snow_depth");
        if (sd !== null && sd > 0) ep.push("积雪 " + fmt(sd * 100) + "cm");
      }
      const sst = results.omSea && results.omSea.current ? results.omSea.current.sea_surface_temperature : null;
      if (sst !== null && sst !== undefined) ep.push("海温 " + fmt(sst) + "℃");
      const aod = results.omAir && results.omAir.current ? results.omAir.current.aerosol_optical_depth : null;
      if (aod !== null && aod !== undefined) ep.push("AOD " + fmt(aod, 2));
      if (ep.length) L.push("🌤️ " + ep.join(" · "));
    }

    done(L.join("\n"), "🌍 " + CITY + " · Windy 全图层");
  }
}
