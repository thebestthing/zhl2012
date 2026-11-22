// 本地地质面板 v2（Surge Panel）—— 详细版，无地震数据
// 通过出口 IP 定位（ipwho.is），查：
//   基岩地层/年代/岩性：Macrostrat（加拿大地调局全球地质图）
//   地形海拔/周边起伏：Open-Meteo Elevation（9 点采样）
//   表层土壤成分：SoilGrids（ISRIC，取不到自动隐藏）
// 参数（| 分隔）：LAT|LON —— 留空=IP自动定位；走代理节点时定位会偏，填固定坐标最准。

const args = ($argument || "").split("|");
const LATP = parseFloat(args[0]);
const LONP = parseFloat(args[1]);
const TIMEOUT = 25;

function done(content, title) { $done({ title: title || "🌋 本地地质 v2", content: content }); }
function fmt(n, d) { return n === null || n === undefined || isNaN(n) ? "--" : Number(n).toFixed(d === undefined ? 1 : d); }
function get(url, cb) {
  $httpClient.get({ url: url, timeout: TIMEOUT, headers: { "User-Agent": "Mozilla/5.0" } }, function (err, resp, data) {
    let json = null;
    try { if (!err && data) json = JSON.parse(data); } catch (e) { /* 忽略 */ }
    cb(json);
  });
}
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

function run(lat, lon, placeLabel, ipLine) {
  const d = 0.12;
  const pts = [[lat, lon], [lat + d, lon], [lat - d, lon], [lat, lon + d], [lat, lon - d],
               [lat + d, lon + d], [lat + d, lon - d], [lat - d, lon + d], [lat - d, lon - d]];
  const elevUrl = "https://api.open-meteo.com/v1/elevation?latitude=" + pts.map(p => p[0].toFixed(4)).join(",") +
                  "&longitude=" + pts.map(p => p[1].toFixed(4)).join(",");
  const macroUrl = "https://macrostrat.org/api/v2/geologic_units/map?lat=" + lat + "&lng=" + lon;
  const soilUrl = "https://rest.soilgrids.org/soilgrids/v2.0/properties/query?lon=" + lon + "&lat=" + lat +
                  "&property=clay&property=sand&property=silt&property=phh2o&property=soc&depth=0-5cm&value=mean";
  let pending = 3, elev = null, macro = null, soil = null;
  function fin() {
    if (--pending !== 0) return;
    const L = [];
    const elevs = elev && elev.elevation;
    const h0 = elevs && elevs[0];
    L.push("📍 " + placeLabel + (h0 !== null && h0 !== undefined ? " · 海拔 " + fmt(h0, 0) + "m" : "") + " · " + fmt(lat, 2) + "°N " + fmt(lon, 2) + "°E");
    if (ipLine) L.push(ipLine);
    if (elevs && elevs.length > 1) {
      const mx = Math.max.apply(null, elevs), mn = Math.min.apply(null, elevs), relief = mx - mn;
      const landform = relief < 50 ? "平原" : relief < 200 ? "丘陵/台地" : relief < 500 ? "低山丘陵" : "山地";
      L.push("🏔️ 地形: 周边约13km 最高 " + fmt(mx, 0) + "m · 最低 " + fmt(mn, 0) + "m · 高差 " + fmt(relief, 0) + "m · " + landform + "(粗判)");
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
    const layers = soil && soil.properties && soil.properties.layers;
    if (layers) {
      const pick = function (name) {
        const ly = layers.find(x => x.name === name);
        return ly && ly.depths && ly.depths[0] && ly.depths[0].values ? ly.depths[0].values.mean : null;
      };
      const clay = pick("clay"), sand = pick("sand"), silt = pick("silt"), ph = pick("phh2o"), soc = pick("soc");
      const sp = [];
      if (clay !== null) sp.push("黏粒 " + fmt(clay / 10, 0) + "%");
      if (sand !== null) sp.push("砂粒 " + fmt(sand / 10, 0) + "%");
      if (silt !== null) sp.push("粉粒 " + fmt(silt / 10, 0) + "%");
      if (ph !== null) sp.push("pH " + fmt(ph / 10, 1));
      if (soc !== null) sp.push("有机碳 " + fmt(soc / 10, 1) + "g/kg");
      if (sp.length) L.push("🌱 表层土壤(0-5cm): " + sp.join(" · "));
    }
    L.push("📚 源: Macrostrat(全球地质图·小比例尺) · SoilGrids · Open-Meteo");
    done(L.join("\n"), "🌋 本地地质 v2 · " + placeLabel);
  }
  get(elevUrl, function (j) { elev = j; fin(); });
  get(macroUrl, function (j) { macro = j; fin(); });
  get(soilUrl, function (j) { soil = j; fin(); });
}

if (!isNaN(LATP) && !isNaN(LONP)) {
  run(LATP, LONP, "固定坐标", "");
} else {
  get("https://ipwho.is/", function (j) {
    if (j && j.success && j.latitude && j.longitude) {
      const label = j.city || j.region || "当前位置";
      const region = [j.region, j.country].filter(Boolean).join(" · ");
      const ipLine = "🌐 出口IP " + j.ip + (j.connection && j.connection.isp ? " · " + j.connection.isp : "") + (region ? " · " + region : "");
      run(j.latitude, j.longitude, label, ipLine);
    } else {
      done("❌ IP 定位失败：ipwho.is 没有返回位置。\n可在模块参数里填 LAT/LON 固定坐标（如潮州 23.66 / 116.62）。");
    }
  });
}
