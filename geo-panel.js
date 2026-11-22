// 本地地质面板（Surge Panel）
// 通过出口 IP 定位（ipwho.is），查 USGS 地震目录 + Open-Meteo 海拔；
// 也可在模块参数里填 LAT/LON 固定坐标（走代理节点时 IP 定位会偏到节点所在地，用固定坐标最准）。
// 数据源全免费无 Key：ipwho.is / earthquake.usgs.gov / api.open-meteo.com
// 参数（| 分隔）：LAT|LON|RADIUS(km)|MINMAG|DAYS

const args = ($argument || "").split("|");
const LATP = parseFloat(args[0]);
const LONP = parseFloat(args[1]);
const RADIUS = parseFloat(args[2]) || 800;
const MINMAG = args[3] ? parseFloat(args[3]) : 2.5;
const DAYS = parseInt(args[4]) || 30;
const TIMEOUT = 25;

function done(content, title) { $done({ title: title || "🌋 本地地质", content: content }); }
function fmt(n, d) { return n === null || n === undefined || isNaN(n) ? "--" : Number(n).toFixed(d === undefined ? 1 : d); }
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function ago(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + "分钟前";
  if (s < 86400) return Math.round(s / 3600) + "小时前";
  return Math.round(s / 86400) + "天前";
}
function ymd(ms) {
  const d = new Date(ms);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function get(url, cb) {
  $httpClient.get({ url: url, timeout: TIMEOUT, headers: { "User-Agent": "Mozilla/5.0" } }, function (err, resp, data) {
    let json = null;
    try { if (!err && data) json = JSON.parse(data); } catch (e) { /* 忽略 */ }
    cb(json);
  });
}

function run(lat, lon, placeLabel, ipLine) {
  const start = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10);
  const recentUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=" + lat + "&longitude=" + lon +
    "&maxradiuskm=" + RADIUS + "&minmagnitude=" + MINMAG + "&orderby=time&limit=100&starttime=" + start;
  const histUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=" + lat + "&longitude=" + lon +
    "&maxradiuskm=300&minmagnitude=6.5&orderby=magnitude&limit=1&starttime=1900-01-01";
  const elevUrl = "https://api.open-meteo.com/v1/elevation?latitude=" + lat + "&longitude=" + lon;
  let pending = 3, recent = null, hist = null, elev = null;
  function fin() {
    if (--pending !== 0) return;
    const L = [];
    L.push("📍 " + placeLabel + (elev !== null ? " · 海拔 " + fmt(elev, 0) + "m" : "") + " · " + fmt(lat, 2) + "°N " + fmt(lon, 2) + "°E");
    if (ipLine) L.push(ipLine);
    const feats = (recent && recent.features) || [];
    if (feats.length) {
      let strongest = feats[0];
      for (const f of feats) if (f.properties.mag > strongest.properties.mag) strongest = f;
      L.push("🌋 近" + DAYS + "天 · " + RADIUS + "km内 M" + MINMAG + "+ 共 " + feats.length + " 次 · 最强 M" + fmt(strongest.properties.mag, 1));
      feats.slice(0, 3).forEach(function (f) {
        const c = f.geometry.coordinates;
        const dist = haversine(lat, lon, c[1], c[0]);
        L.push("· M" + fmt(f.properties.mag, 1) + " · 距 " + fmt(dist, 0) + "km · 深 " + fmt(c[2], 0) + "km · " + ago(f.properties.time) + " · " + f.properties.place);
      });
    } else {
      L.push("🌋 近" + DAYS + "天 · " + RADIUS + "km内无 M" + MINMAG + "+ 地震");
    }
    const hf = hist && hist.features && hist.features[0];
    if (hf) L.push("🏛️ 历史大震(300km内): " + ymd(hf.properties.time).slice(0, 4) + "年 M" + fmt(hf.properties.mag, 1) + " · " + hf.properties.place);
    done(L.join("\n"), "🌋 本地地质 · " + placeLabel);
  }
  get(recentUrl, function (j) { recent = j; fin(); });
  get(histUrl, function (j) { hist = j; fin(); });
  get(elevUrl, function (j) { elev = j && j.elevation && j.elevation[0]; fin(); });
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
