/******************************************
 * 黑料不打烊 + 51吃瓜 定时监控推送（带封面图版）
 * 更新: 2026-11-21
 * 适用: Surge / Loon / Quantumult X
 * 本版改动:
 *  1. 解析首页文章卡片，提取每篇的封面图
 *  2. 逐条推送，每条通知带封面图附件，点开直达原文
 *  3. 去重改成“已读ID集合”，置顶帖、排序变化也不会漏推/重复推
 *  4. 卡片没提取到图时，自动抓文章页补图
 ******************************************/

const sites = [
  {
    name: "黑料不打烊",
    domains: [
      "https://hl365.com",
      "https://dbdy3.com",
      "https://hlbdy1.com"
    ],
    path: "/",
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
    path: "/",
    key: "51cg_seen_ids"
  }
];

const MAX_NOTIFY = 5;    // 每次最多推送几条
const SEEN_KEEP = 60;    // 已读ID最多记多少个
const TIMEOUT = 15;      // 请求超时（秒）
const FETCH_DETAIL_IMG = true; // 卡片没图时是否抓文章页补图

(async () => {
  let totalNew = 0;

  for (const site of sites) {
    try {
      const result = await fetchSite(site);
      if (result && result.news.length > 0) {
        totalNew += result.news.length;
        await fillImages(result.news);
        notifyNew(site.name, result.news);
      }
    } catch (e) {
      console.log(`[${site.name}] 失败: ${e.message || e}`);
    }
  }

  if (totalNew === 0) {
    console.log("本次无新内容");
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

      // 已读ID集合（兼容旧版存的单个ID）
      const seen = new Set(
        (($persistentStore.read(site.key) || "") + "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean)
      );

      const news = posts.filter(p => !seen.has(p.id)).slice(0, MAX_NOTIFY);

      // 本次首页见过的ID都记为已读，避免下次重复推积压
      const merged = [...posts.map(p => p.id), ...seen];
      const keep = [...new Set(merged)].slice(0, SEEN_KEEP);
      $persistentStore.write(keep.join(","), site.key);

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
    const end = i + 1 < cards.length ? cards[i + 1].idx : idx + 6000;
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

function notifyNew(siteName, news) {
  // 逐条推送：每条带自己的封面图，点开直达原文
  for (const p of news) {
    const opts = { "open-url": p.url, openUrl: p.url };
    if (p.img) {
      opts["media-url"] = p.img;
      opts.mediaUrl = p.img;
    }
    postNotification(`🍉 ${siteName} 有新瓜`, p.title, p.url, opts);
  }
}

function postNotification(title, subtitle, body, opts) {
  if (typeof $notification !== "undefined") {
    $notification.post(title, subtitle, body, opts);
  } else if (typeof $notify !== "undefined") {
    $notify(title, subtitle, body, opts);
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url,
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
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
