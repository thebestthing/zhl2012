/******************************************
 * Codec 工具箱 · Windows 硬件监控 Surge 面板
 * 数据来源：工具箱「硬件监控」子站的 /api/snapshot 接口
 * 接口地址（含 sharecode 与 token）在模块的脚本参数 argument 里填，
 * 相当于密码：只保存在你本机 Surge 里，不要提交到公开仓库、不要外传。
 ******************************************/

const API_URL = (typeof $argument !== "undefined" ? String($argument || "") : "").trim();

function done(content, title) {
  $done({
    title: title || "Windows 硬件监控",
    content: content,
    icon: "desktopcomputer",
    "icon-color": "#3B82F6"
  });
}

function fmt(n, d) {
  if (n === null || n === undefined || isNaN(n)) return "--";
  return Number(n).toFixed(d === undefined ? 1 : d);
}

function shortCpu(name) {
  if (!name) return "CPU";
  const m = name.match(/(?:Core\(TM\)\s*)?(i[3579]-\w+)|(?:Ryzen\s*\d+\s*\w+)|(?:Ultra\s*\d+\s*\w+)/i);
  return m ? (m[1] || m[2] || m[3]) : name.replace(/^.*?Intel\(R\)\s*/i, "").slice(0, 22);
}

function shortGpu(name) {
  if (!name) return "GPU";
  return name.replace(/^NVIDIA GeForce\s*/i, "").replace(/\s*Laptop GPU$/i, "").trim();
}

function fmtUptime(sec) {
  if (!sec && sec !== 0) return "--";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  return (d > 0 ? d + "天" : "") + h + "小时" + (d === 0 ? mi + "分" : "");
}

if (!API_URL || API_URL.indexOf("XXXX") >= 0) {
  done("⚠️ 还没配置监控接口地址\n到 Surge 的模块设置里，把「Codec硬件监控」脚本的参数改成你的监控接口完整地址（域名后加 /api/snapshot，带上 sharecode 和 token）。");
} else {
  $httpClient.get(
    { url: API_URL, timeout: 12, headers: { "User-Agent": "Surge" } },
    function (err, resp, data) {
      if (err || !data) {
        return done("❌ 读取失败：" + (err ? String(err) : "无数据") + "\n检查网络，或接口地址是否已过期。");
      }
      try {
        const j = JSON.parse(data);
        const m = (j.machines || [])[0];
        if (!m || !m.latest) return done("接口里暂时没有机器数据。");
        const l = m.latest;
        const lines = [];

        // 在线状态（以服务端时间为准算最后上报距今多久）
        let ageSec = null;
        if (j.serverTime && m.lastSeen) {
          ageSec = Math.max(0, Math.round((Date.parse(j.serverTime) - Date.parse(m.lastSeen)) / 1000));
        }
        if (m.online) {
          lines.push("🟢 在线" + (ageSec !== null ? " · " + ageSec + " 秒前上报" : ""));
        } else {
          lines.push("🔴 离线" + (ageSec !== null ? " · 最后上报 " + Math.floor(ageSec / 60) + " 分钟前" : ""));
        }

        // CPU
        const cpu = l.cpu || {};
        let cpuLine = "CPU " + shortCpu(cpu.name) + " · " + fmt(cpu.loadPercent, 0) + "%";
        if (cpu.currentClockMHz) cpuLine += " · " + fmt(cpu.currentClockMHz / 1000, 2) + " GHz";
        if (l.temperatures && l.temperatures.cpuCelsius !== null && l.temperatures.cpuCelsius !== undefined) {
          cpuLine += " · " + fmt(l.temperatures.cpuCelsius, 0) + "℃";
        }
        lines.push(cpuLine);

        // 内存
        const mem = l.memory || {};
        lines.push("内存 " + fmt(mem.usedPercent) + "% · " + fmt(mem.usedGiB) + "/" + fmt(mem.totalGiB) + " GB");

        // 显卡（取第一块独显/主显卡）
        const gpu = (l.gpus || []).filter(g => /NVIDIA|AMD|Radeon|Intel/i.test(g.name || ""))[0];
        if (gpu) {
          let g = "显卡 " + shortGpu(gpu.name);
          const e3d = (l.gpuEngines || []).find(e => e.engine === "3D");
          if (e3d) g += " · 3D " + fmt(e3d.percent, 0) + "%";
          if (l.gpuMemory && l.gpuMemory.dedicatedLimitBytes) {
            g += " · 显存 " + fmt(l.gpuMemory.dedicatedUsedBytes / 1073741824) + "/" + fmt(l.gpuMemory.dedicatedLimitBytes / 1073741824, 0) + " GB";
          }
          lines.push(g);
        }

        // 磁盘
        (l.disks || []).forEach(dsk => {
          let d = "磁盘 " + dsk.name + " " + fmt(dsk.usedPercent) + "% · 剩 " + fmt(dsk.freeGiB, 2) + " GB";
          if (dsk.freeGiB !== null && dsk.freeGiB !== undefined && dsk.freeGiB < 5) d += " ⚠️ 快满了";
          lines.push(d);
        });

        // 网络 + 运行时间 + 电池
        const net = l.network || {};
        let tail = "网络 ↓" + fmt(net.downloadMbps, 2) + " ↑" + fmt(net.uploadMbps, 2) + " Mbps";
        if (l.system && l.system.uptimeSeconds !== undefined) tail += " · 已运行 " + fmtUptime(l.system.uptimeSeconds);
        lines.push(tail);
        if (l.battery && l.battery.present) {
          lines.push("电池 " + fmt(l.battery.percent, 0) + "% · " + (l.battery.statusText || ""));
        }

        done(lines.join("\n"), "🖥 " + (l.machineName || "Windows") + " 硬件监控");
      } catch (e) {
        done("❌ 解析失败：" + (e.message || e));
      }
    }
  );
}
