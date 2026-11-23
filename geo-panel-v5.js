// 本地地质面板 v5（Surge Panel）—— 专业详细版（无地震）· 土壤源修复
// IP 定位（Bilibili zone：国内直连得真实本地 IP；ipwho.is 兜底）后查：
//   基岩地层/年代/岩性：Macrostrat（加拿大地调局全球地质图）
//   地形：OpenTopoData SRTM 30m —— 精确海拔、周边起伏、坡度/坡向
//   表层土壤：SoilGrids（WMS点查询主源/REST备选；黏粒/砂粒/粉粒/pH/有机碳/容重/全氮，取不到自动隐藏）
//   古生物：PBDB 古生物数据库 —— 周边化石记录数与最近一条
// 参数（| 分隔）：LAT|LON —— 留空=IP自动定位；走代理节点时定位会偏，填固定坐标最准。

const args = ($argument || "").split("|");
const LATP = parseFloat(args[0]);
const LONP = parseFloat(args[1]);
const TIMEOUT = 25;

function done(content, title) { $done({ title: title || "🌋 本地地质 v5", content: content }); }
function fmt(n, d) { return n === null || n === undefined || isNaN(n) ? "--" : Number(n).toFixed(d === undefined ? 1 : d); }
function get(url, cb) {
  $httpClient.get({ url: url, timeout: TIMEOUT, headers: { "User-Agent": "Mozilla/5.0" } }, function (err, resp, data) {
    let json = null;
    try { if (!err && data) json = JSON.parse(data); } catch (e) { /* 忽略 */ }
    cb(json, json !== null);
  });
}
function getText(url, cb) {
  $httpClient.get({ url: url, timeout: TIMEOUT, headers: { "User-Agent": "Mozilla/5.0" } }, function (err, resp, data) {
    cb(!err && data ? data : null, !err && !!data);
  });
}
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// 内置快照：2026-11-23 在潮州（23.67/116.64，取样点约9.2km外）实测渲染的土壤结果。
// SoilGrids 接口不可用且本地无缓存时兜底显示，并注明是快照；接口恢复后自动切回实时数据。
const BUILTIN_SOIL = {
  "geo_soil_237_1166": [
    "🌱 土壤取样点: 中心像素无数据，取约 9.2km 外有效像素",
    "🌱 表层土壤(0-5cm): 黏粒 23% · 砂粒 44% · 粉粒 34% · pH 5.6",
    "🧪 土壤理化: 有机碳 40.5g/kg · 全氮 3.1g/kg · 容重 1.17g/cm³ · CEC 18.8cmol/kg · 粗碎屑 11%",
    "💧 土壤水分: 田间持水量 34.8% · 凋萎含水量 14.4% · 有效水 20.4%",
    "🪵 有机碳储量(0-30cm): 46 t/ha",
    "📊 剖面黏粒(0→60cm): 23→21→23→29%",
    "📊 剖面pH(0→60cm): 5.6→5.6→5.6→5.6",
    "📊 剖面有机碳(0→60cm): 40.5→19.0→11.3→7.4 g/kg"
  ]
};
const AGE_CN = { "Quaternary": "第四纪", "Neogene": "新近纪", "Paleogene": "古近纪", "Cretaceous": "白垩纪", "Jurassic": "侏罗纪", "Triassic": "三叠纪", "Permian": "二叠纪", "Carboniferous": "石炭纪", "Devonian": "泥盆纪", "Silurian": "志留纪", "Ordovician": "奥陶纪", "Cambrian": "寒武纪", "Pliocene": "上新世", "Miocene": "中新世", "Oligocene": "渐新世", "Eocene": "始新世", "Paleocene": "古新世", "Pleistocene": "更新世", "Holocene": "全新世", "Cenozoic": "新生代", "Mesozoic": "中生代", "Paleozoic": "古生代", "Precambrian": "前寒武纪" };
function ageCN(en) { return AGE_CN[en] ? AGE_CN[en] + "(" + en + ")" : en; }
function lithCN(s) {
  const t = (s || "").toLowerCase();
  if (t.includes("granite")) return "花岗岩";
  if (t.includes("basalt")) return "玄武岩";
  if (t.includes("limestone")) return "石灰岩";
  if (t.includes("sandstone")) return "砂岩";
  if (t.includes("shale")) return "页岩";
  if (t.includes("volcanic")) return "火山岩";
  if (t.includes("plutonic")) return "深成岩";
  if (t.includes("metamorphic")) return "变质岩";
  if (t.includes("sedimentary")) return "沉积岩";
  if (t.includes("igneous")) return "火成岩";
  return "";
}
const DIRS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];

function run(lat, lon, placeLabel, ipLine) {
  const d = 0.12, s = 0.0027;
  const pts = [[lat, lon], [lat + d, lon], [lat - d, lon], [lat, lon + d], [lat, lon - d],
               [lat + d, lon + d], [lat + d, lon - d], [lat - d, lon + d], [lat - d, lon - d],
               [lat + s, lon], [lat - s, lon], [lat, lon + s], [lat, lon - s]];
  const otdUrl = "https://api.opentopodata.org/v1/srtm30m?locations=" + pts.map(p => p[0].toFixed(4) + "," + p[1].toFixed(4)).join("|");
  const macroUrl = "https://macrostrat.org/api/v2/geologic_units/map?lat=" + lat + "&lng=" + lon;
  const soilBase = "https://rest.isric.org/soilgrids/v2.0/properties/query";
  const soilFull = "&property=clay&property=sand&property=silt&property=phh2o&property=soc&property=bdod&property=nitrogen" +
                  "&property=cec&property=cfvo&property=wv0033&property=wv1500&property=ocs" +
                  "&depth=0-5cm&depth=5-15cm&depth=15-30cm&depth=30-60cm&depth=0-30cm&value=mean";
  const pbdbUrl = "https://paleobiodb.org/data1.2/occs/list.json?lngmin=" + (lon - 1.5) + "&lngmax=" + (lon + 1.5) +
                  "&latmin=" + (lat - 1.5) + "&latmax=" + (lat + 1.5) + "&limit=200&show=coords,time,class";
  let pending = 4, otd = null, macro = null, soil = null, pbdb = null, soilOffsetKm = 0, soilFromCache = false, builtinSoilLines = null;
  function fin() {
    if (--pending !== 0) return;
    const L = [];
    const res = otd && otd.results;
    const ev = res ? res.map(r => r.elevation) : [];
    const h0 = ev.length ? ev[0] : null;
    L.push("📍 " + placeLabel + (h0 !== null && h0 !== undefined ? " · 海拔 " + fmt(h0, 0) + "m(SRTM 30m)" : "") + " · " + fmt(Math.abs(lat), 2) + "°" + (lat >= 0 ? "N" : "S") + " " + fmt(Math.abs(lon), 2) + "°" + (lon >= 0 ? "E" : "W"));
    if (ipLine) L.push(ipLine);
    if (ev.length >= 9) {
      const g = ev.slice(0, 9);
      const mx = Math.max.apply(null, g), mn = Math.min.apply(null, g), relief = mx - mn;
      const landform = relief < 50 ? "平原" : relief < 200 ? "丘陵/台地" : relief < 500 ? "低山丘陵" : "山地";
      L.push("🏔️ 地形: 周边约13km 最高 " + fmt(mx, 0) + "m · 最低 " + fmt(mn, 0) + "m · 高差 " + fmt(relief, 0) + "m · " + landform + "(粗判)");
    }
    if (ev.length >= 13) {
      const dxM = 2 * s * 111320 * Math.cos(lat * Math.PI / 180), dyM = 2 * s * 110600;
      const dzdx = (ev[11] - ev[12]) / dxM, dzdy = (ev[9] - ev[10]) / dyM;
      const slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * 180 / Math.PI;
      if (slope < 0.5) L.push("🧭 坡度: " + fmt(slope, 1) + "° · 近水平");
      else {
        const ang = (Math.atan2(-dzdx, -dzdy) * 180 / Math.PI + 360) % 360;
        L.push("🧭 坡度: " + fmt(slope, 1) + "° · 坡向" + DIRS[Math.round(ang / 45) % 8]);
      }
    }
    const u = macro && macro.success && macro.success.data && macro.success.data[0];
    if (u) {
      const lc = lithCN(u.name + " " + (u.lith || ""));
      L.push("🪨 基岩: " + u.name + (lc ? " · " + lc : ""));
      const ageName = u.best_int_name || u.t_int_name;
      let ageLine = "⏳ 年代: " + (ageName ? ageCN(ageName) : "");
      if (u.b_age !== undefined && u.t_age !== undefined) ageLine += " · " + fmt(u.b_age, 1) + "–" + fmt(u.t_age, 1) + " Ma（百万年前）";
      L.push(ageLine);
      if (u.descrip) L.push("📝 " + u.descrip);
    } else {
      L.push("🪨 基岩: 该位置无地质图覆盖数据");
    }
    if (soil && soil.nodata) L.push("🌱 土壤: 中心周边约10km内 SoilGrids 均为无数据像素（水域/建成区）");
    if (soil && soil.apierr) L.push("🌱 土壤: SoilGrids 接口超时无响应（探针已自动重试一轮），稍后刷新再试");
    if (soilFromCache) L.push("🌱 土壤: 接口暂不可用，显示同区域上次成功数据（土壤不随天变）");
    if (builtinSoilLines) {
      L.push("🌱 土壤: SoilGrids 暂不可用，显示 2026-11-23 实测快照");
      builtinSoilLines.forEach(function (l) { L.push(l); });
    }
    const layers = soil && soil.properties && soil.properties.layers;
    if (layers) {
      if (soilOffsetKm > 0.3) L.push("🌱 土壤取样点: 中心像素无数据，取约 " + fmt(soilOffsetKm, 1) + "km 外有效像素");
      const pick = function (name, label) {
        const ly = layers.find(x => x.name === name);
        if (!ly || !ly.depths) return null;
        const dp = ly.depths.find(x => x.label === (label || "0-5cm")) || ly.depths[0];
        return dp && dp.values ? dp.values.mean : null;
      };
      const clay = pick("clay"), sand = pick("sand"), silt = pick("silt"), ph = pick("phh2o"),
            soc = pick("soc"), bdod = pick("bdod"), nit = pick("nitrogen"),
            cec = pick("cec"), cfvo = pick("cfvo"), wv33 = pick("wv0033"), wv1500 = pick("wv1500"),
            ocs = pick("ocs", "0-30cm");
      const sp = [];
      if (clay !== null) sp.push("黏粒 " + fmt(clay / 10, 0) + "%");
      if (sand !== null) sp.push("砂粒 " + fmt(sand / 10, 0) + "%");
      if (silt !== null) sp.push("粉粒 " + fmt(silt / 10, 0) + "%");
      if (ph !== null) sp.push("pH " + fmt(ph / 10, 1));
      if (sp.length) L.push("🌱 表层土壤(0-5cm): " + sp.join(" · "));
      const sp2 = [];
      if (soc !== null) sp2.push("有机碳 " + fmt(soc / 10, 1) + "g/kg");
      if (nit !== null) sp2.push("全氮 " + fmt(nit / 100, 1) + "g/kg");
      if (bdod !== null) sp2.push("容重 " + fmt(bdod / 100, 2) + "g/cm³");
      if (cec !== null) sp2.push("CEC " + fmt(cec / 10, 1) + "cmol/kg");
      if (cfvo !== null) sp2.push("粗碎屑 " + fmt(cfvo / 10, 0) + "%");
      if (sp2.length) L.push("🧪 土壤理化: " + sp2.join(" · "));
      const sp3 = [];
      if (wv33 !== null) sp3.push("田间持水量 " + fmt(wv33 / 10, 1) + "%");
      if (wv1500 !== null) sp3.push("凋萎含水量 " + fmt(wv1500 / 10, 1) + "%");
      if (wv33 !== null && wv1500 !== null) sp3.push("有效水 " + fmt((wv33 - wv1500) / 10, 1) + "%");
      if (sp3.length) L.push("💧 土壤水分: " + sp3.join(" · "));
      if (ocs !== null) L.push("🪵 有机碳储量(0-30cm): " + fmt(ocs, 0) + " t/ha");
      const prof = function (name, conv, digits, unit) {
        const vals = ["0-5cm", "5-15cm", "15-30cm", "30-60cm"].map(lb => pick(name, lb));
        if (vals.some(v => v === null)) return "";
        return vals.map(v => fmt(v / conv, digits)).join("→") + unit;
      };
      const pc = prof("clay", 10, 0, "%"), pp = prof("phh2o", 10, 1, ""), ps = prof("soc", 10, 1, "");
      if (pc) L.push("📊 剖面黏粒(0→60cm): " + pc);
      if (pp) L.push("📊 剖面pH(0→60cm): " + pp);
      if (ps) L.push("📊 剖面有机碳(0→60cm): " + ps + " g/kg");
    }
    const recs = pbdb && pbdb.records;
    if (recs && recs.length) {
      let near = null, nd = 1e18;
      for (const r of recs) {
        const dd = haversine(lat, lon, parseFloat(r.lat), parseFloat(r.lng));
        if (dd < nd) { nd = dd; near = r; }
      }
      let line = "🦕 古生物: 周边约150km内化石记录 " + recs.length + (recs.length >= 200 ? "+" : "") + " 条";
      if (near) line += " · 最近 " + (near.idn || near.tna || "") + " · 距 " + fmt(nd, 0) + "km · " + fmt(near.eag, 0) + "–" + fmt(near.lag, 0) + " Ma";
      L.push(line);
    }
    L.push("📚 源: Macrostrat · OpenTopoData · SoilGrids · PBDB");
    done(L.join("\n"), "🌋 本地地质 v5 · " + placeLabel);
  }
  get(otdUrl, function (j) { otd = j; fin(); });
  get(macroUrl, function (j) { macro = j; fin(); });
  // 土壤：REST 备选流程（WMS 主源失败时才走）：并行探测中心及周边点，请求失败（超时）的点自动再重试一轮；
  // 两轮都无果时用同区域上次成功结果兜底（土壤不随天变），并区分「真无数据」与「接口无响应」。
  function restSoil() {
    const offs = [[0, 0],
      [0.02, 0], [-0.02, 0], [0, 0.02], [0, -0.02],
      [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05],
      [0.09, 0], [-0.09, 0], [0, 0.09], [0, -0.09]];
    const cacheKey = "geo_soil_" + Math.round(lat * 10) + "_" + Math.round(lon * 10);
    const probeOk = {};
    let chosen = null, responded = false, settled = false;
    function useCacheOrFail() {
      let cached = null;
      try { cached = JSON.parse($persistentStore.read(cacheKey) || "null"); } catch (e) {}
      if (cached && cached.soil && cached.soil.properties) {
        soil = cached.soil; soilOffsetKm = cached.off || 0; soilFromCache = true;
      } else if (BUILTIN_SOIL[cacheKey]) {
        builtinSoilLines = BUILTIN_SOIL[cacheKey]; soil = { builtin: true };
      } else {
        soil = responded ? { nodata: true } : { apierr: true };
      }
      fin();
    }
    function launch(idxs, isRetry) {
      let pendingP = idxs.length;
      idxs.forEach(function (idx) {
        const pla = lat + offs[idx][0], plo = lon + offs[idx][1];
        get(soilBase + "?lon=" + plo + "&lat=" + pla + "&property=clay&depth=0-5cm&value=mean", function (j, ok) {
          if (ok) {
            probeOk[idx] = true; responded = true;
            const ly = j && j.properties && j.properties.layers && j.properties.layers[0];
            const mean = ly && ly.depths && ly.depths[0] && ly.depths[0].values ? ly.depths[0].values.mean : null;
            if (mean !== null && mean !== undefined && (chosen === null || idx < chosen.idx)) chosen = { idx: idx, lat: pla, lon: plo };
          }
          if (--pendingP === 0 && !settled) {
            if (chosen !== null) {
              settled = true;
              soilOffsetKm = chosen.idx === 0 ? 0 : haversine(lat, lon, chosen.lat, chosen.lon);
              get(soilBase + "?lon=" + chosen.lon + "&lat=" + chosen.lat + soilFull, function (j2, ok2) {
                if (ok2 && j2 && j2.properties) {
                  soil = j2;
                  try { $persistentStore.write(JSON.stringify({ soil: j2, off: soilOffsetKm }), cacheKey); } catch (e) {}
                  fin();
                } else {
                  useCacheOrFail();
                }
              });
            } else if (!isRetry) {
              const failed = idxs.filter(function (i) { return !probeOk[i]; });
              if (failed.length) { launch(failed, true); return; }
              settled = true; useCacheOrFail();
            } else {
              settled = true; useCacheOrFail();
            }
          }
        });
      });
    }
    launch(offs.map(function (_, i) { return i; }), false);
  }

  // 土壤主源：ISRIC MapServer WMS 点查询（dev-maps.isric.org），约1秒/次，比 REST 接口稳得多。
  // 21 次小查询并行：表层11项 + 碳储量(0-30cm) + 剖面9项；结果组装成与 REST 相同结构，渲染层不改。
  // WMS 为重投影采样：REST 的无数据像素在这里通常也有值，故不再探针；整体失败才回退 REST 流程。
  (function wmsSoil() {
    const jobs = [];
    ["clay", "sand", "silt", "phh2o", "soc", "nitrogen", "bdod", "cec", "cfvo", "wv0033", "wv1500"].forEach(function (p) { jobs.push([p, "0-5cm"]); });
    jobs.push(["ocs", "0-30cm"]);
    ["5-15cm", "15-30cm", "30-60cm"].forEach(function (d) { ["clay", "phh2o", "soc"].forEach(function (p) { jobs.push([p, d]); }); });
    const bbox = fmt(lat - 0.05, 5) + "," + fmt(lon - 0.05, 5) + "," + fmt(lat + 0.05, 5) + "," + fmt(lon + 0.05, 5);
    const got = {};
    let pendingW = jobs.length, anyOk = false;
    jobs.forEach(function (job) {
      const prop = job[0], dep = job[1], layer = prop + "_" + dep + "_mean";
      const url = "https://dev-maps.isric.org/mapserv/" + prop + "?service=WMS&version=1.3.0&request=GetFeatureInfo&layers=" + layer + "&styles=&query_layers=" + layer + "&crs=EPSG:4326&bbox=" + bbox + "&width=101&height=101&i=50&j=50&info_format=text/html&feature_count=1";
      getText(url, function (txt, ok) {
        if (ok && txt) {
          const m = txt.match(/<span id="value">\s*(-?\d+(?:\.\d+)?)\s*<\/span>/);
          if (m) { const v = parseFloat(m[1]); if (v > -1000) { (got[prop] = got[prop] || {})[dep] = v; anyOk = true; } }
        }
        if (--pendingW === 0) {
          if (anyOk && got.clay && got.clay["0-5cm"] !== undefined) {
            const layers = Object.keys(got).map(function (p) {
              return { name: p, depths: Object.keys(got[p]).map(function (d) { return { label: d, values: { mean: got[p][d] } }; }) };
            });
            soil = { properties: { layers: layers } };
            try { $persistentStore.write(JSON.stringify({ soil: soil, off: 0 }), "geo_soil_" + Math.round(lat * 10) + "_" + Math.round(lon * 10)); } catch (e) {}
            fin();
          } else {
            restSoil();
          }
        }
      });
    });
  })();
  get(pbdbUrl, function (j) { pbdb = j; fin(); });
}

if (!isNaN(LATP) && !isNaN(LONP)) {
  run(LATP, LONP, "固定坐标", "");
} else {
  // 首选 Bilibili 的 IP 定位（国内服务，Surge 规则通常直连 → 得到真实本地 IP 与经纬度，不受代理节点影响）
  get("https://api.bilibili.com/x/web-interface/zone", function (j) {
    const dt = j && j.data;
    if (dt && dt.latitude && dt.longitude) {
      const label = dt.city || dt.province || "当前位置";
      const region = [dt.province, dt.country].filter(Boolean).join(" · ");
      const ipLine = "🌐 本地IP " + dt.addr + (dt.isp ? " · " + dt.isp : "") + (region ? " · " + region : "");
      run(parseFloat(dt.latitude), parseFloat(dt.longitude), label, ipLine);
      return;
    }
    // 兜底：ipwho.is（请求若走代理节点，定位会偏到节点所在地）
    get("https://ipwho.is/", function (j2) {
      if (j2 && j2.success && j2.latitude && j2.longitude) {
        const label = j2.city || j2.region || "当前位置";
        const region = [j2.region, j2.country].filter(Boolean).join(" · ");
        const ipLine = "🌐 出口IP " + j2.ip + (j2.connection && j2.connection.isp ? " · " + j2.connection.isp : "") + (region ? " · " + region : "");
        run(j2.latitude, j2.longitude, label, ipLine);
      } else {
        done("❌ IP 定位失败：Bilibili 与 ipwho.is 都没有返回位置。\n可在模块参数里填 LAT/LON 固定坐标（如潮州 23.66 / 116.62）。");
      }
    });
  });
}
