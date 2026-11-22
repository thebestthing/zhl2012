/******************************************
 * 黑料不打烊 + 51吃瓜 定时监控推送（带封面图版 v7）
 * 更新: 2026-11-22
 * 适用: Surge（iOS 5.11.0+ 带图通知）/ Loon / Quantumult X
 * 说明:
 *  1. 解析分类页文章卡片，提取每篇的封面图（v7 起：51吃瓜抓「今日吃瓜」/category/wpcz/，
 *     黑料不打烊抓「今日看料」/category/24hcg/；首页混有置顶旧帖，不用首页）
 *  2. 两站图床的图片是 AES-128-CBC 加密的（站点前端 JS 解密后才显示），
 *     直接拿原图 URL 当通知附件，系统解不开，所以永远不显示。
 *     本脚本内置纯 JS AES 解密：下载 → 解密 → base64 附件推送。
 *  3. 不做去重（v5 起，用户要求）：每次运行直接推送首页最新 MAX_NOTIFY 条
 *  4. 卡片没提取到图时，自动抓文章页补图
 *  5. 推送细节都写进脚本日志，出问题先看日志
 *  注意: 站点以后若更换加密密钥，日志会出现“解密后仍不是有效图片”，需更新密钥
 ******************************************/

const sites = [
  {
    name: "黑料不打烊",
    domains: [
      "https://hl365.com",
      "https://dbdy3.com",
      "https://hlbdy1.com"
    ],
    path: "/category/24hcg/",
    key: "hlbdy_seen_ids"
  },
  {
    name: "51吃瓜",
    domains: [
      "https://51cg1.com",
      "https://51cgf29.com",
      "https://51cge29.com",
      "https://chigua.com"
    ],
    path: "/category/wpcz/",
    key: "51cg_seen_ids"
  }
];

const MAX_NOTIFY = 5;    // 每次每站推送最新几条
const TIMEOUT = 15;      // 请求超时（秒）
const FETCH_DETAIL_IMG = true; // 卡片没图时是否抓文章页补图
const MAX_IMG_BYTES = 3 * 1024 * 1024; // 超过这个大小的图片改用 media-url

// 两站图床的 AES 密钥（提取自站点前端 image.0821.js 的 decryptjs）
const IMG_KEY = "f5d965df75336270";
const IMG_IV = "97b60394abc2fbe1";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

(async () => {
  try {
    console.log(`运行环境: ${$environment.system} Surge ${$environment["surge-version"]}（带图通知需要 iOS Surge 5.11.0+）`);
  } catch (e) {}

  let totalNew = 0;

  for (const site of sites) {
    try {
      const result = await fetchSite(site);
      if (result && result.news.length > 0) {
        totalNew += result.news.length;
        await fillImages(result.news);
        await notifyNew(site.name, result.news);
      }
    } catch (e) {
      console.log(`[${site.name}] 失败: ${e.message || e}`);
    }
  }

  if (totalNew === 0) {
    console.log("本次未抓到内容（两站首页都抓取/解析失败）");
  }
  $done();
})();

async function fetchSite(site) {
  for (const domain of site.domains) {
    try {
      const html = await httpGet(domain + site.path);
      if (!html || html.length < 1000) continue;

      const posts = parsePosts(html, domain);
      if (posts.length === 0) continue;

      // 不去重：直接取首页最新 MAX_NOTIFY 条推送
      const news = posts.slice(0, MAX_NOTIFY);

      return { news, domain };
    } catch (e) {
      console.log(`[${site.name}] ${domain} 失败: ${e.message || e}`);
    }
  }
  return null;
}

function parsePosts(html, domain) {
  const posts = [];
  const seen = new Set();

  // 主解析：按文章卡片 post-card-<id> 切分，卡片里带封面图和标题
  const cardRe = /id="post-card-(\d+)"/g;
  const cards = [];
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    cards.push({ id: m[1], idx: m.index });
  }

  for (let i = 0; i < cards.length; i++) {
    const { id, idx } = cards[i];
    if (seen.has(id)) continue;

    const start = Math.max(0, idx - 900);
    let end = i + 1 < cards.length ? cards[i + 1].idx : idx + 6000;
    // 卡片之间夹着广告位（<article class="ad-item">），窗口必须在本卡片 </article> 处截断，
    // 否则会抓到下一张广告卡的图片（v5 实测把开元棋牌广告图当封面推了出去）
    const closeIdx = html.indexOf("</article>", idx);
    if (closeIdx > idx) end = Math.min(end, closeIdx + "</article>".length);
    const win = html.slice(start, Math.min(end, idx + 6000));

    // 原文链接（卡片前的 <a href="/archives/xx">）
    const hrefM = win.match(new RegExp(`href=["'](/archives/${id}(?:\\.html|/)?)["']`));
    const url = domain + (hrefM ? hrefM[1] : `/archives/${id}/`);

    const img = pickCardImage(win);
    const title = pickCardTitle(win);

    if (!title || title.length < 4 || /广告|APP下载|下载APP|回家|官方活动/.test(title)) continue;

    seen.add(id);
    posts.push({ id, title, url, img });
    if (posts.length >= 12) break;
  }

  if (posts.length > 0) return posts;

  // 备用解析：老逻辑，找不到卡片时兜底（无图）
  const re = /href=["'](\/archives\/(\d+)(?:\.html|\/)?)["'][^>]*>[\s\S]*?(?:post-card-title|headline)[^>]*>([\s\S]*?)<\/(?:span|h2|div|a)/gi;
  while ((m = re.exec(html)) !== null) {
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);

    let title = m[3]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

    if (!title || title.length < 4 || /广告|APP|下载|回家|官方/.test(title)) continue;

    posts.push({ id, title, url: domain + m[1], img: "" });
    if (posts.length >= 12) break;
  }

  return posts;
}

// 从卡片片段里提取封面图，按可靠程度排序
function pickCardImage(win) {
  const patterns = [
    /itemprop="image"\s+content="(https?:[^"]+)"/i,
    /z-bg-loader-url="(https?:[^"]+)"/i,
    /x-bg-loader-url="(https?:[^"]+)"/i,
    /z-image-loader-url="(https?:[^"]+)"/i,
    /<img[^>]+src="(https?:[^"]+\.(?:jpe?g|png|webp)[^"]*)"/i
  ];
  for (const re of patterns) {
    const mm = win.match(re);
    if (mm) {
      const url = mm[1].replace(/&amp;/g, "&");
      if (/\/usr\/themes\/|logo|icon|zw\.png|social\.png/i.test(url)) continue;
      return url;
    }
  }
  return "";
}

// 从卡片片段里提取标题（两种主题变体）
function pickCardTitle(win) {
  const patterns = [
    /post-card-bottom-text[^>]*>([\s\S]*?)<\//i,
    /itemprop="headline"[^>]*>([\s\S]*?)<\/h2>/i,
    /post-card-title[^>]*>([\s\S]*?)<\/(?:h2|span|div)>/i
  ];
  for (const re of patterns) {
    const mm = win.match(re);
    if (mm) {
      const t = mm[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (t && t.length >= 4 && !/^(热搜|热门|推荐|HOT)/.test(t)) return t;
    }
  }
  return "";
}

// 没图的文章，抓文章页补图（取 itemprop=image，og:image 是主题默认图不用）
async function fillImages(news) {
  if (!FETCH_DETAIL_IMG) return;
  const targets = news.filter(p => !p.img);
  if (targets.length === 0) return;

  await Promise.all(
    targets.map(async p => {
      try {
        const html = await httpGet(p.url);
        const mm = html.match(/itemprop="image"\s+content="(https?:[^"]+)"/i);
        if (mm && !/\/usr\/themes\/|social\.png/i.test(mm[1])) {
          p.img = mm[1].replace(/&amp;/g, "&");
        }
      } catch (e) {
        console.log(`[补图] ${p.id} 失败: ${e.message || e}`);
      }
    })
  );
}

async function notifyNew(siteName, news) {
  // 逐条推送：每条带自己的封面图，点开直达原文
  for (const p of news) {
    const imgOpts = { url: p.img || "" };
    if (p.img) {
      const b64 = await fetchImageBase64(p.img);
      if (b64) {
        imgOpts.base64 = b64.data;
        imgOpts.mime = b64.mime;
      }
    }
    console.log(
      `[推送] ${siteName} | ${p.title} | 图: ${p.img || "无"} | 方式: ${imgOpts.base64 ? "解密+base64附件" : imgOpts.url ? "media-url(可能不显示)" : "无图"}`
    );
    postNotification(`🍉 ${siteName} 有新瓜`, p.title, p.url, p.url, imgOpts);
  }
}

// 下载图片 → 未加密直接用，加密的先 AES 解密 → 转 base64
async function fetchImageBase64(imgUrl) {
  try {
    let data = await httpGetBinary(imgUrl);
    if (!data || data.length === 0 || data.length > MAX_IMG_BYTES) return null;

    let mime = imageMime(data);
    if (!mime) {
      const dec = aes128CbcDecrypt(data, IMG_KEY, IMG_IV);
      if (dec) {
        mime = imageMime(dec);
        if (mime) data = dec;
      }
    }
    if (!mime) {
      console.log(`[图片] ${imgUrl} 解密后仍不是有效图片（可能站点换了密钥），改用 media-url`);
      return null;
    }
    return { data: bytesToBase64(data), mime };
  } catch (e) {
    console.log(`[图片下载] 失败 ${imgUrl}: ${e.message || e}`);
    return null;
  }
}

// 按文件头判断真实图片类型
function imageMime(b) {
  if (!b || b.length < 12) return "";
  if (b[0] === 0xff && b[1] === 0xd8) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "image/webp";
  return "";
}

function bytesToBase64(bytes) {
  const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? bytes[i + 1] : 0;
    const c = hasC ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += table[(n >> 18) & 63];
    out += table[(n >> 12) & 63];
    out += hasB ? table[(n >> 6) & 63] : "=";
    out += hasC ? table[n & 63] : "=";
  }
  return out;
}

function postNotification(title, subtitle, body, link, imgOpts) {
  if (typeof $notification !== "undefined") {
    // Surge / Loon：按 Surge 官方手册的键名（url + media-url / media-base64）
    const opts = { url: link };
    if (imgOpts.base64) {
      opts["media-base64"] = imgOpts.base64;
      opts["media-base64-mime"] = imgOpts.mime || "image/jpeg";
    } else if (imgOpts.url) {
      opts["media-url"] = imgOpts.url;
    }
    $notification.post(title, subtitle, body, opts);
  } else if (typeof $notify !== "undefined") {
    // Quantumult X（不支持 base64 附件，只能给原图 URL，加密图可能不显示）
    const opts = { "open-url": link };
    if (imgOpts.url) opts["media-url"] = imgOpts.url;
    $notify(title, subtitle, body, opts);
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url,
        headers: {
          "User-Agent": UA,
          "Accept-Language": "zh-CN,zh;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        timeout: TIMEOUT
      },
      (err, resp, data) => {
        if (err) return reject(err);
        if (resp.status >= 400) return reject(new Error(`HTTP ${resp.status}`));
        resolve(data);
      }
    );
  });
}

function httpGetBinary(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url,
        headers: { "User-Agent": UA },
        timeout: TIMEOUT,
        "binary-mode": true
      },
      (err, resp, data) => {
        if (err) return reject(err);
        if (resp.status >= 400) return reject(new Error(`HTTP ${resp.status}`));
        resolve(data);
      }
    );
  });
}

/* ---------- 纯 JS AES-128-CBC 解密（S盒由 GF 运算生成，避免抄错表） ---------- */

function gfMul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

const AES_TABLES = (() => {
  // 乘法逆元
  const inv = new Uint8Array(256);
  for (let i = 1; i < 256; i++) {
    for (let j = 1; j < 256; j++) {
      if (gfMul(i, j) === 1) { inv[i] = j; break; }
    }
  }
  const rotl = (x, n) => ((x << n) | (x >> (8 - n))) & 0xff;
  const sbox = new Uint8Array(256);
  const invSbox = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const y = inv[i];
    const s = (y ^ rotl(y, 1) ^ rotl(y, 2) ^ rotl(y, 3) ^ rotl(y, 4) ^ 0x63) & 0xff;
    sbox[i] = s;
    invSbox[s] = i;
  }
  return { sbox, invSbox };
})();

function aesKeyExpansion(keyBytes) {
  const { sbox } = AES_TABLES;
  const rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
  const w = new Uint8Array(176);
  w.set(keyBytes.subarray(0, 16));
  for (let i = 16; i < 176; i += 4) {
    let t0 = w[i - 4], t1 = w[i - 3], t2 = w[i - 2], t3 = w[i - 1];
    if (i % 16 === 0) {
      const r = t0;
      t0 = sbox[t1] ^ rcon[i / 16 - 1];
      t1 = sbox[t2];
      t2 = sbox[t3];
      t3 = sbox[r];
    }
    w[i] = w[i - 16] ^ t0;
    w[i + 1] = w[i - 15] ^ t1;
    w[i + 2] = w[i - 14] ^ t2;
    w[i + 3] = w[i - 13] ^ t3;
  }
  return w;
}

function aesDecryptBlock(input, off, rk, out) {
  const { invSbox } = AES_TABLES;
  const s = new Uint8Array(16);
  // state 按列优先：s[r + 4c]
  for (let i = 0; i < 16; i++) s[i] = input[off + i];

  const addRoundKey = round => {
    for (let i = 0; i < 16; i++) s[i] ^= rk[round * 16 + i];
  };
  const invSubBytes = () => {
    for (let i = 0; i < 16; i++) s[i] = invSbox[s[i]];
  };
  const invShiftRows = () => {
    const t = new Uint8Array(16);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        t[r + 4 * c] = s[r + 4 * ((c - r + 4) % 4)];
      }
    }
    s.set(t);
  };
  const invMixColumns = () => {
    for (let c = 0; c < 4; c++) {
      const i = 4 * c;
      const a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3];
      s[i]     = gfMul(a0, 14) ^ gfMul(a1, 11) ^ gfMul(a2, 13) ^ gfMul(a3, 9);
      s[i + 1] = gfMul(a0, 9)  ^ gfMul(a1, 14) ^ gfMul(a2, 11) ^ gfMul(a3, 13);
      s[i + 2] = gfMul(a0, 13) ^ gfMul(a1, 9)  ^ gfMul(a2, 14) ^ gfMul(a3, 11);
      s[i + 3] = gfMul(a0, 11) ^ gfMul(a1, 13) ^ gfMul(a2, 9)  ^ gfMul(a3, 14);
    }
  };

  addRoundKey(10);
  for (let round = 9; round >= 1; round--) {
    invShiftRows();
    invSubBytes();
    addRoundKey(round);
    invMixColumns();
  }
  invShiftRows();
  invSubBytes();
  addRoundKey(0);

  out.set(s);
}

// 成功返回去填充后的 Uint8Array，失败返回 null
function aes128CbcDecrypt(data, keyStr, ivStr) {
  if (!data || data.length === 0 || data.length % 16 !== 0) return null;
  const key = new Uint8Array(16);
  const iv = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    key[i] = keyStr.charCodeAt(i) & 0xff;
    iv[i] = ivStr.charCodeAt(i) & 0xff;
  }
  const rk = aesKeyExpansion(key);
  const out = new Uint8Array(data.length);
  const block = new Uint8Array(16);
  let prev = iv;
  for (let off = 0; off < data.length; off += 16) {
    aesDecryptBlock(data, off, rk, block);
    for (let i = 0; i < 16; i++) out[off + i] = block[i] ^ prev[i];
    prev = data.subarray(off, off + 16);
  }
  const pad = out[out.length - 1];
  if (pad < 1 || pad > 16) return null;
  for (let i = out.length - pad; i < out.length; i++) {
    if (out[i] !== pad) return null;
  }
  return out.subarray(0, out.length - pad);
}
