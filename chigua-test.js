/******************************************
 * 吃瓜推送图片测试（v4，含图片解密）
 * 手动运行：给每个站各推一条最新内容，验证带图通知是否正常
 * 适用: Surge（iOS 5.11.0+）/ Loon
 ******************************************/

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const TIMEOUT = 15;
const IMG_KEY = "f5d965df75336270";
const IMG_IV = "97b60394abc2fbe1";

const targets = [
  { name: "黑料不打烊", url: "https://hl365.com/" },
  { name: "51吃瓜", url: "https://51cg1.com/" }
];

(async () => {
  try {
    console.log(`运行环境: ${$environment.system} Surge ${$environment["surge-version"]}（带图通知需要 iOS Surge 5.11.0+）`);
  } catch (e) {}

  for (const t of targets) {
    try {
      const html = await httpGet(t.url);
      const post = parseFirst(html, t.url);
      if (!post) {
        console.log(`[${t.name}] 没解析到文章`);
        $notification.post(`【测试】${t.name}`, "没解析到文章", t.url, { url: t.url });
        continue;
      }
      const opts = { url: post.url };
      let mode = "无图";
      if (post.img) {
        const data = await httpGetBinary(post.img).catch(() => null);
        if (data && data.length > 0) {
          let bytes = data;
          let mime = imageMime(bytes);
          if (!mime) {
            const dec = aes128CbcDecrypt(bytes, IMG_KEY, IMG_IV);
            if (dec) { mime = imageMime(dec); if (mime) bytes = dec; }
          }
          if (mime) {
            opts["media-base64"] = bytesToBase64(bytes);
            opts["media-base64-mime"] = mime;
            mode = "解密+base64附件";
          } else {
            opts["media-url"] = post.img;
            mode = "media-url(解密失败)";
          }
        } else {
          opts["media-url"] = post.img;
          mode = "media-url(下载失败)";
        }
      }
      console.log(`[测试推送] ${t.name} | ${post.title} | 图: ${post.img || "无"} | 方式: ${mode}`);
      $notification.post(`【测试】🍉 ${t.name}`, post.title, post.url, opts);
    } catch (e) {
      console.log(`[${t.name}] 测试失败: ${e.message || e}`);
      $notification.post(`【测试】${t.name}`, "测试失败", String(e.message || e), { url: t.url });
    }
  }
  $done();
})();

function parseFirst(html, base) {
  const m = html.match(/id="post-card-(\d+)"/);
  if (!m) return null;
  const id = m[1];
  const domain = base.replace(/\/$/, "");
  const win = html.slice(Math.max(0, m.index - 900), m.index + 6000);

  const hrefM = win.match(new RegExp(`href=["'](/archives/${id}(?:\.html|/)?)["']`));
  const url = domain + (hrefM ? hrefM[1] : `/archives/${id}/`);

  let img = "";
  const imgPatterns = [
    /itemprop="image"\s+content="(https?:[^"]+)"/i,
    /x-bg-loader-url="(https?:[^"]+)"/i,
    /z-image-loader-url="(https?:[^"]+)"/i
  ];
  for (const re of imgPatterns) {
    const mm = win.match(re);
    if (mm && !/\/usr\/themes\/|social\.png/i.test(mm[1])) {
      img = mm[1].replace(/&amp;/g, "&");
      break;
    }
  }

  let title = "";
  const titlePatterns = [
    /post-card-bottom-text[^>]*>([\s\S]*?)<\//i,
    /itemprop="headline"[^>]*>([\s\S]*?)<\/h2>/i,
    /post-card-title[^>]*>([\s\S]*?)<\/(?:h2|span|div)>/i
  ];
  for (const re of titlePatterns) {
    const mm = win.match(re);
    if (mm) {
      const t = mm[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (t && t.length >= 4 && !/^(热搜|热门|推荐|HOT)/.test(t)) {
        title = t;
        break;
      }
    }
  }

  return { id, title: title || `新内容 #${id}`, url, img };
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      { url, headers: { "User-Agent": UA }, timeout: TIMEOUT },
      (err, resp, data) => {
        if (err) return reject(err);
        if (resp.status >= 400) return reject(new Error(`HTTP ${resp.status}`));
        resolve(data);
      }
    );
  });
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
