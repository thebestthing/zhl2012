/******************************************
 * Windy 天气数据 Surge 面板（全图层版 v8 · 四源全免费 · earth EPAK 补充 + 诊断 · 标题带版本号）
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
// ===== earth.nullschool EPAK 二进制网格解码（移植自 earth 前端公开代码）=====
function epakUtf8(bytes) {
  let out = "", i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 0x80) { out += String.fromCharCode(b); i += 1; }
    else if (b < 0xE0) { out += String.fromCharCode(((b & 0x1F) << 6) | (bytes[i + 1] & 0x3F)); i += 2; }
    else if (b < 0xF0) { out += String.fromCharCode(((b & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F)); i += 3; }
    else { const cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) | ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F); out += String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10), 0xDC00 + ((cp - 0x10000) & 0x3FF)); i += 4; }
  }
  return out;
}
function epakUnpack(e, t) {
  let r = 0, n = 0;
  for (; r < t.length;) {
    let o = t[r++];
    if (o < 128) o = o << 25 >> 25;
    else switch (o >> 4) {
      case 8: case 9: case 10: case 11: o = o << 26 >> 18 | t[r++]; break;
      case 12: case 13: o = o << 27 >> 11 | t[r++] << 8 | t[r++]; break;
      case 14: o = o << 28 >> 4 | t[r++] << 16 | t[r++] << 8 | t[r++]; break;
      case 15:
        if (o === 255) { for (let i = 1 + t[r++]; i > 0; i--) e[n++] = NaN; continue; }
        else { o = t[r++] << 24 | t[r++] << 16 | t[r++] << 8 | t[r++]; }
        break;
    }
    e[n++] = o;
  }
  return e;
}
function epakDelta(e, t, r, n) {
  let o, i, a, s, c, u, l;
  for (a = 0; a < n; a++) {
    for (u = a * t * r, o = 1; o < t; o++) { s = u + o; l = e[s - 1]; e[s] += l === l ? l : 0; }
    for (i = 1; i < r; i++) {
      for (c = u + i * t, l = e[c - t], e[c] += l === l ? l : 0, o = 1; o < t; o++) {
        s = c + o;
        const f = e[s - 1], p = e[s - t], m = e[s - t - 1];
        l = f + p - m;
        e[s] += l === l ? l : f === f ? f : p === p ? p : m === m ? m : 0;
      }
    }
  }
  return e;
}
function epakPoint(buf, varName, lat, lon) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let n = 0;
  const tag = epakUtf8(u8.subarray(n, n + 4)); n += 4;
  if (tag !== "head") throw new Error("epak head");
  const hLen = dv.getInt32(n); n += 4;
  const header = JSON.parse(epakUtf8(u8.subarray(n, n + hLen))); n += hLen;
  const v = header.variables[varName];
  if (!v || !v.data) throw new Error("epak var");
  const wantBlock = v.data.block || 0;
  let blockData = null, blockIdx = -1;
  while (n < u8.length) {
    const bTag = epakUtf8(u8.subarray(n, n + 4)); n += 4;
    if (bTag === "tail") break;
    const bLen = dv.getInt32(n); n += 4;
    blockIdx++;
    if (blockIdx === wantBlock) {
      if (bTag !== "ppak") throw new Error("epak not ppak");
      const cols = dv.getInt32(n), rows = dv.getInt32(n + 4), grids = dv.getInt32(n + 8);
      const scale = Math.pow(10, dv.getFloat32(n + 12));
      const data = new Float32Array(cols * rows * grids);
      epakUnpack(data, u8.subarray(n + 16, n + bLen));
      epakDelta(data, cols, rows, grids);
      for (let i = 0; i < data.length; i++) data[i] /= scale;
      blockData = { data: data, nx: cols };
      break;
    }
    n += bLen;
  }
  if (!blockData) throw new Error("epak block");
  const latSeq = (header.variables.lat || header.variables.latitude).sequence;
  const lonSeq = (header.variables.lon || header.variables.longitude).sequence;
  const ny = latSeq.size, nx = lonSeq.size;
  let L = lon;
  while (L < lonSeq.start) L += 360;
  while (L >= lonSeq.start + 360) L -= 360;
  let fy = Math.max(0, Math.min(ny - 1, (lat - latSeq.start) / latSeq.delta));
  let fx = Math.max(0, Math.min(nx - 1, (L - lonSeq.start) / lonSeq.delta));
  const y0 = Math.floor(fy), x0 = Math.floor(fx);
  const y1 = Math.min(ny - 1, y0 + 1), x1 = Math.min(nx - 1, x0 + 1);
  const wy = fy - y0, wx = fx - x0;
  const data = blockData.data;
  const g = (yy, xx) => data[yy * nx + xx];
  const v00 = g(y0, x0), v01 = g(y0, x1), v10 = g(y1, x0), v11 = g(y1, x1);
  if ([v00, v01, v10, v11].some(isNaN)) {
    const cand = [v00, v01, v10, v11].filter(z => !isNaN(z));
    return cand.length ? cand[0] : NaN;
  }
  return (v00 * (1 - wx) + v01 * wx) * (1 - wy) + (v10 * (1 - wx) + v11 * wx) * wy;
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
  // Windy 10 分钟本地缓存：模式新旧运行时次交替返回时，连刷用同一套数据，不跳数
  const windyCacheKey = "windy_pf_" + MODEL + "_" + LAT.toFixed(2) + "_" + LON.toFixed(2);
  let windyCacheHit = 0, jobsLeft = jobs.length;
  try {
    const c = JSON.parse($persistentStore.read(windyCacheKey) || "null");
    if (c && c.t && Date.now() - c.t < 600000 && c.d && c.d.weather && (c.d.weather.ts || []).length) {
      jobs.forEach(job => { results[job.name] = c.d[job.name] || null; });
      windyCacheHit = c.t;
      pending = 0;
    }
  } catch (e) {}

  if (!windyCacheHit) jobs.forEach(job => {
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
        if (--jobsLeft === 0 && results.weather && (results.weather.ts || []).length) {
          try { $persistentStore.write(JSON.stringify({ t: Date.now(), d: { weather: results.weather, sea: results.sea || null, current: results.current || null, air: results.air || null } }), windyCacheKey); } catch (e) {}
        }
        if (--pending === 0) render();
      }
    );
  });

  // ===== 额外数据源（全免费）：Open-Meteo / 中央气象台台风 / 和风预警 =====
  function extraDone() { if (--pending === 0) render(); }
  pending += ((QWHOST && QWKEY) ? 5 : 4) + 8;

  // Open-Meteo 预报：紫外线/太阳辐射/能见度/冰冻高度/积雪深度
  $httpClient.get({ url: "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON + "&hourly=uv_index,shortwave_radiation,visibility,freezing_level_height,snow_depth,apparent_temperature,wet_bulb_temperature_2m&daily=precipitation_sum&timezone=auto&forecast_days=2&timeformat=unixtime", timeout: 15 }, function (err, resp, data) {
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
  // earth.nullschool EPAK 补充（PM1/水汽/云水/尘埃/CO2/硫酸盐/有机物/海温偏差）
  results.earth = {};
  [
    ["pm1", "https://gaia.nullschool.net/data/cams/current/current-pm1-cams.epak", "pm1", 1e9],
    ["tpw", "https://gaia.nullschool.net/data/gfs/current/current-total_precipitable_water-gfs-0.5.epak", "Precipitable_water_entire_atmosphere_single_layer", 1],
    ["tcw", "https://gaia.nullschool.net/data/gfs/current/current-total_cloud_water-gfs-0.5.epak", "Cloud_water_entire_atmosphere_single_layer", 1],
    ["duex", "https://gaia.nullschool.net/data/geos/current/current-duexttau-geos.epak", "DUEXTTAU", 1],
    ["co2", "https://gaia.nullschool.net/data/geos/current/current-co2sc-geos.epak", "CO2SC", 1],
    ["suex", "https://gaia.nullschool.net/data/geos/current/current-suexttau-geos.epak", "SUEXTTAU", 1],
    ["omaod", "https://gaia.nullschool.net/data/cams/current/current-omaod-cams.epak", "omaod550", 1],
    ["ssta", "https://gaia.nullschool.net/data/ostia/current/current-sea_surface_temp_anomaly-ostia-0.5.epak", "sst_anomaly", 1]
  ].forEach(([key, url, varName, conv]) => {
    $httpClient.get({ url: url, timeout: 30, "binary-mode": true }, function (err, resp, data) {
      try {
        if (err) throw new Error("请求失败 " + key);
        if (!data) throw new Error("无数据 " + key);
        let ab = data;
        if (typeof data === "string") {
          const u8 = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) u8[i] = data.charCodeAt(i) & 0xFF;
          ab = u8.buffer;
        } else if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(data)) {
          ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }
        results.earth[key] = epakPoint(ab, varName, LAT, LON) * conv;
      } catch (e) {
        if (!results.earthError) results.earthError = key + ": " + (e && e.message ? e.message : String(e)) + " | data=" + (data === null ? "null" : typeof data);
      }
      extraDone();
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
    const rtMs = w.refTime ? new Date(w.refTime).getTime() : null;
    L.push("📍 " + CITY + " · " + MODEL.toUpperCase() + " · " + dayLabel(w.ts[idx]) + (rtMs && !isNaN(rtMs) ? " · 起报 " + hhmm(rtMs) : "") + (windyCacheHit ? " · 缓存 " + Math.max(0, Math.round((Date.now() - windyCacheHit) / 60000)) + " 分钟前" : ""));

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
    const ER = results.earth || {};
    const ev = (x) => (x === null || x === undefined || isNaN(x)) ? null : x;
    const ePm1 = ev(ER.pm1), eTpw = ev(ER.tpw), eTcw = ev(ER.tcw), eDuex = ev(ER.duex),
          eCo2 = ev(ER.co2), eSuex = ev(ER.suex), eOmaod = ev(ER.omaod), eSsta = ev(ER.ssta);
    const wbT = omHv("wet_bulb_temperature_2m");
    // 今日累计降水（Open-Meteo 多模式融合口径）：补“今天到底下没下雨”——时次预报值回答不了这个问题
    let omDayPrecip = null;
    if (results.om && results.om.daily && results.om.daily.time && results.om.daily.precipitation_sum) {
      const dts = results.om.daily.time, nowS2 = Date.now() / 1000;
      for (let i = 0; i < dts.length; i++) { if (dts[i] <= nowS2 && nowS2 < dts[i] + 86400) { omDayPrecip = results.om.daily.precipitation_sum[i]; break; } }
      if (omDayPrecip === null && dts.length) omDayPrecip = results.om.daily.precipitation_sum[0];
    }

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
    L.push("🌧️ 降水 " + fmt(precip !== null ? precip * 1000 : null) + "mm · 雪 " + fmt(snow !== null ? snow * 1000 : null) + "mm · 对流 " + fmt(conv !== null ? conv * 1000 : null) + "mm · " + (ptype !== null && PTYPE[ptype] !== undefined ? PTYPE[ptype] : "--") + (cape !== null ? " · CAPE " + fmt(cape, 0) : "") + (eTpw !== null ? " · 水汽 " + fmt(eTpw, 1) + "kg/m²" : "") + (eTcw !== null && eTcw > 0.005 ? " · 云水 " + fmt(eTcw, 2) : "") + (omDayPrecip !== null ? " · 今日累计 " + fmt(omDayPrecip, 1) + "mm（融合）" : ""));

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
      if (eSsta !== null) sp.push("海温偏差 " + (eSsta > 0 ? "+" : "") + fmt(eSsta, 1) + "℃");
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
      if (ePm1 !== null) ap.push("PM1 " + fmt(ePm1, 0));
      const items = [["PM2.5", "pm2p5-surface"], ["PM10", "pm10-surface"], ["NO₂", "no2-surface"], ["SO₂", "chem_so2sm-surface"], ["O₃", "go3-surface"], ["粉尘", "chem_dustsm-surface"]];
      items.forEach(([label, key]) => { const val = get(air, key, ai); if (val !== null) ap.push(label + " " + fmt(val, 0)); });
      const co = get(air, "chem_cosc-surface", ai);
      if (co !== null) ap.push("CO " + fmt(co > 10 ? co / 1000 : co, 2) + "mg/m³");
      if (eCo2 !== null) ap.push("CO₂ " + fmt(eCo2, 0) + "ppm");
      if (ap.length) L.push("😷 " + ap.join(" · ") + (aqi !== null || items.length ? "（颗粒物 μg/m³）" : ""));
    }

    // earth 补充全失败时显示原因（便于排查）
    if (ePm1 === null && eTpw === null && eDuex === null && eCo2 === null && eSuex === null && eOmaod === null && results.earthError) {
      L.push("🛰️ earth补充失败: " + String(results.earthError).slice(0, 90));
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
      if (eDuex !== null) ep.push("尘埃 " + fmt(eDuex, 2));
      if (eSuex !== null) ep.push("硫酸盐 " + fmt(eSuex, 2));
      if (eOmaod !== null) ep.push("有机物 " + fmt(eOmaod, 2));
      if (ep.length) L.push("🌤️ " + ep.join(" · "));
    }

    done(L.join("\n"), "🌍 " + CITY + " · Windy 全图层 v8");
  }
}
