/******************************************
 * 黑料不打烊 + 51吃瓜 定时监控推送
 * 更新: 2026-11-21
 * 适用: Surge / Loon / Quantumult X
 * GitHub: 部署后把下面域名改成你的 raw 地址
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
    key: "hlbdy_last"
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
    key: "51cg_last"
  }
];

const MAX_NOTIFY = 5;   // 每次最多推送几条
const TIMEOUT = 15;     // 请求超时（秒）

(async () => {
  let totalNew = 0;

  for (const site of sites) {
    try {
      const result = await fetchSite(site);
      if (result && result.news.length > 0) {
        totalNew += result.news.length;
        notifyNew(site.name, result.news, result.domain);
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

      const last = $persistentStore.read(site.key) || "";
      const news = [];

      for (const p of posts) {
        if (p.id === last) break;
        news.push(p);
        if (news.length >= MAX_NOTIFY) break;
      }

      if (news.length > 0) {
        $persistentStore.write(posts[0].id, site.key);
      }

      return { news, domain };
    } catch (e) {
      console.log(`[${site.name}] ${domain} 失败: ${e.message || e}`);
    }
  }
  return null;
}

function parsePosts(html, domain) {
  const posts = [];
  const re = /href=["'](\/archives\/(\d+)(?:\.html|\/)?)["'][^>]*>[\s\S]*?(?:post-card-title|headline)[^>]*>([\s\S]*?)<\/(?:span|h2|div|a)/gi;
  let m;
  const seen = new Set();

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

    posts.push({
      id,
      title,
      url: domain + m[1]
    });

    if (posts.length >= 12) break;
  }

  // 宽松备用解析
  if (posts.length < 3) {
    const re2 = /href=["'](\/archives\/(\d+)(?:\.html|\/)?)["']/gi;
    while ((m = re2.exec(html)) !== null) {
      const id = m[2];
      if (seen.has(id)) continue;
      seen.add(id);
      posts.push({
        id,
        title: `新内容 #${id}`,
        url: domain + m[1]
      });
      if (posts.length >= 8) break;
    }
  }

  return posts;
}

function notifyNew(siteName, news, domain) {
  // 方式1：合并成一条通知（默认）
  const title = `🍉 ${siteName} 有新瓜 (${news.length})`;
  let body = news.map((p, i) => `${i + 1}. ${p.title}`).join("\n");
  body += `\n\n来源: ${domain}`;
  $notification.post(title, "", body);

  // 方式2：每条单独通知（想用这个就把上面注释掉，打开下面）
  // news.forEach(p => {
  //   $notification.post(`🍉 ${siteName}`, p.title, p.url);
  // });
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
