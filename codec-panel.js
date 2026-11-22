/******************************************
 * Codec 工具箱 · Windows 硬件监控 Surge 面板（运维台全量版）
 * 数据来源：工具箱「硬件监控」子站的 /api/snapshot 接口
 * sharecode 与 token 在模块的参数表里填（模块用 {{{SHARECODE}}}/{{{TOKEN}}} 拼出接口地址），
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
  if (sec === null || sec === undefined) return "--";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const mi = Math.floor((sec % 3600) / 60);
  return (d > 0 ? d + "天" : "") + h + "小时" + (d === 0 ? mi + "分" : "");
}

function fmtRate(bps) {
  if (bps === null || bps === undefined) return "--";
  if (bps >= 1048576) return fmt(bps / 1048576) + " MB/s";
  if (bps >= 1024) return fmt(bps / 1024, 0) + " KB/s";
  return fmt(bps, 0) + " B/s";
}

function fmtMem(bytes) {
  if (bytes === null || bytes === undefined) return "--";
  if (bytes >= 1073741824) return fmt(bytes / 1073741824, 2) + " GB";
  return fmt(bytes / 1048576, 0) + " MB";
}

if (!API_URL || API_URL.indexOf("XXXX") >= 0 || API_URL.indexOf("YYYY") >= 0) {
  done("⚠️ 还没填参数\n打开 Surge 里这个模块的详情页，在参数表里填上 SHARECODE 和 TOKEN（在你的硬件监控页面地址栏里，?sharecode= 后面和 &token= 后面那两串，用复制粘贴，不要手打）。");
} else {
  $httpClient.get(
    { url: API_URL, timeout: 12, headers: { "User-Agent": "Surge" } },
    function (err, resp, data) {
      if (err || !data) {
        return done("❌ 读取失败：" + (err ? String(err) : "无数据") + "\n检查网络，或接口地址是否已过期。");
      }
      try {
        const j = JSON.parse(data);
        if (j.error) {
          return done("❌ 接口拒绝：" + j.error + "\n多半是 TOKEN 没填对：到监控页地址栏里复制 &token= 后面那整串，粘贴到模块参数里，不要手打、不要从聊天截图里抄。");
        }
        const m = (j.machines || [])[0];
        if (!m || !m.latest) return done("接口里暂时没有机器数据。");
        const l = m.latest;
        const lines = [];

        // 在线状态 + 上报延迟
        let ageSec = null;
        if (j.serverTime && m.lastSeen) {
          ageSec = Math.max(0, Math.round((Date.parse(j.serverTime) - Date.parse(m.lastSeen)) / 1000));
        }
        let head = m.online
          ? "🟢 在线" + (ageSec !== null ? " · " + ageSec + " 秒前上报" : "")
          : "🔴 离线" + (ageSec !== null ? " · 最后上报 " + Math.floor(ageSec / 60) + " 分钟前" : "");
        if (l.reportLatencyMs !== undefined && l.reportLatencyMs !== null) head += " · 延迟 " + l.reportLatencyMs + "ms";
        lines.push(head);

        // CPU
        const cpu = l.cpu || {};
        let cpuLine = "CPU " + shortCpu(cpu.name) + " · " + fmt(cpu.loadPercent, 0) + "%";
        if (cpu.currentClockMHz) cpuLine += " · " + fmt(cpu.currentClockMHz / 1000, 2) + " GHz";
        lines.push(cpuLine);
        if (cpu.cores || cpu.processCount) {
          lines.push("核心 " + (cpu.cores || "--") + "核/" + (cpu.logicalProcessors || "--") + "线程 · 进程 " + (cpu.processCount || "--") + " · 线程 " + (cpu.threadCount || "--") + " · 句柄 " + (cpu.handleCount || "--"));
        }
        if (cpu.perCoreLoad) {
          const cores = Object.keys(cpu.perCoreLoad).sort((a, b) => a - b).map(k => fmt(cpu.perCoreLoad[k], 0));
          if (cores.length) lines.push("每核 " + cores.join(" "));
        }
        if (cpu.baseClockMHz || cpu.l3CacheKB) {
          let cl = "频率 基准 " + fmt((cpu.baseClockMHz || 0) / 1000, 2) + " · 最高 " + fmt((cpu.maxClockMHz || 0) / 1000, 2) + " GHz";
          if (cpu.l2CacheKB) cl += " · L2 " + fmt(cpu.l2CacheKB / 1024) + "MB";
          if (cpu.l3CacheKB) cl += " · L3 " + fmt(cpu.l3CacheKB / 1024, 0) + "MB";
          lines.push(cl);
        }

        // 温度与功耗
        const t = l.temperatures || {};
        let tLine = "温度 CPU " + (t.cpuCelsius !== null && t.cpuCelsius !== undefined ? fmt(t.cpuCelsius, 0) + "℃" : "--");
        tLine += " · GPU " + (t.gpuCelsius !== null && t.gpuCelsius !== undefined ? fmt(t.gpuCelsius, 0) + "℃" : "不可用");
        if (t.gpuPowerWatts !== null && t.gpuPowerWatts !== undefined) tLine += " · 功耗 " + fmt(t.gpuPowerWatts, 0) + "W";
        lines.push(tLine);

        // 内存
        const mem = l.memory || {};
        let memLine = "内存 " + fmt(mem.usedPercent) + "% · " + fmt(mem.usedGiB) + "/" + fmt(mem.totalGiB) + " GB";
        if (mem.availableGiB !== undefined) memLine += " · 可用 " + fmt(mem.availableGiB) + " GB";
        lines.push(memLine);
        if (mem.commitUsedGiB !== undefined) {
          lines.push("提交 " + fmt(mem.commitUsedGiB) + "/" + fmt(mem.commitLimitGiB) + " GB · 缓存 " + fmt(mem.cachedGiB) + " GB · 池 分页 " + fmt(mem.pagedPoolGiB, 2) + "/非分页 " + fmt(mem.nonPagedPoolGiB, 2));
        }
        if ((mem.modules || []).length) {
          const md = mem.modules[0];
          lines.push("内存条 " + mem.modules.length + "×" + fmt(md.capacityGiB, 0) + "GB " + (md.manufacturer || "").replace(/\s*Technology$/i, "") + " " + (md.speedMHz || "") + "MHz");
        }

        // 显卡（名称 / 专用+共享显存 / 全部引擎）
        const gpu = (l.gpus || []).filter(g => /NVIDIA|AMD|Radeon|Intel/i.test(g.name || ""))[0];
        if (gpu) {
          lines.push("显卡 " + shortGpu(gpu.name));
          if (l.gpuMemory && l.gpuMemory.dedicatedLimitBytes) {
            let vm = "显存 专用 " + fmt(l.gpuMemory.dedicatedUsedBytes / 1073741824) + "/" + fmt(l.gpuMemory.dedicatedLimitBytes / 1073741824, 0) + " GB";
            if (l.gpuMemory.sharedLimitBytes) {
              vm += " · 共享 " + fmtMem(l.gpuMemory.sharedUsedBytes) + "/" + fmt(l.gpuMemory.sharedLimitBytes / 1073741824) + " GB";
            }
            lines.push(vm);
          }
          if ((l.gpuEngines || []).length) {
            lines.push("引擎 " + l.gpuEngines.map(e => e.engine + " " + fmt(e.percent, 0) + "%").join(" · "));
          }
          if (gpu.currentHorizontalResolution) {
            lines.push("屏幕 " + gpu.currentHorizontalResolution + "×" + gpu.currentVerticalResolution + (gpu.currentRefreshRate ? " @" + gpu.currentRefreshRate + "Hz" : "") + " · 驱动 " + (gpu.driverVersion || "--"));
          }
        }

        // 磁盘容量与活动
        (l.disks || []).forEach(dsk => {
          let d = "磁盘 " + dsk.name + " " + fmt(dsk.usedPercent) + "% · 剩 " + fmt(dsk.freeGiB, 2) + " GB";
          if (dsk.freeGiB !== null && dsk.freeGiB !== undefined && dsk.freeGiB < 5) d += " ⚠️ 快满了";
          lines.push(d);
        });
        (l.physicalDisks || []).forEach(pd => {
          lines.push("硬盘 " + String(pd.model || "").slice(0, 26) + " · " + fmt(pd.sizeGiB, 0) + " GB · " + (pd.status || ""));
        });
        const perfs = (l.diskPerformance || []).slice().sort((a, b) => (b.activePercent || 0) - (a.activePercent || 0));
        if (perfs.length) {
          const p = perfs[0];
          lines.push("磁盘活动 " + fmt(p.activePercent, 0) + "% · 读 " + fmtRate(p.readBytesPerSec) + " · 写 " + fmtRate(p.writeBytesPerSec));
        }

        // 网络（总速率 + 各网卡）
        const net = l.network || {};
        let netLine = "网络 ↓" + fmt(net.downloadMbps, 2) + " ↑" + fmt(net.uploadMbps, 2) + " Mbps";
        if (net.linkMbps) netLine += " · 链路 " + fmt(net.linkMbps, 0) + " Mbps";
        lines.push(netLine);
        (net.adapters || []).forEach(a => {
          const nm = String(a.name || "").replace(/\(R\)|\[R\]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
          lines.push("网卡 " + nm + " ↓" + fmtRate(a.downloadBytesPerSec) + " ↑" + fmtRate(a.uploadBytesPerSec));
        });

        // 电池
        if (l.battery && l.battery.present) {
          let bl = "电池 " + fmt(l.battery.percent, 0) + "% · " + (l.battery.statusText || "");
          if (!l.battery.onAc && l.battery.estimatedMinutes) bl += " · 约剩 " + Math.floor(l.battery.estimatedMinutes / 60) + "小时" + (l.battery.estimatedMinutes % 60) + "分";
          lines.push(bl);
        }

        // 系统
        const sys = l.system || {};
        let sysLine = "系统 " + (sys.os || "").replace(/^Microsoft\s*/i, "");
        if (sys.build) sysLine += " build " + sys.build;
        lines.push(sysLine);
        if (sys.model || sys.uptimeSeconds !== undefined) {
          lines.push("机型 " + (sys.model || "--") + (sys.uptimeSeconds !== undefined ? " · 已运行 " + fmtUptime(sys.uptimeSeconds) : ""));
        }
        if (sys.manufacturer || sys.baseboard || sys.biosVersion) {
          lines.push("档案 " + (sys.manufacturer || "") + " · 主板 " + (sys.baseboard || "--") + " · BIOS " + (sys.biosVersion || "--") + (sys.architecture ? " · " + sys.architecture : ""));
        }

        // 进程 CPU TOP10
        const tops = l.topProcesses || [];
        if (tops.length) {
          lines.push("进程CPU TOP10:");
          tops.slice(0, 10).forEach((p, i) => {
            lines.push((i + 1) + ". " + p.name + " " + fmt(p.cpuPercent) + "% · " + fmtMem(p.memoryBytes));
          });
        }

        // 设备清单摘要
        const inv = l.deviceInventory || {};
        if (inv.totalCount) {
          lines.push("设备清单 共 " + inv.totalCount + " 台 · 异常 " + (inv.errorCount || 0) + " 台");
        }
        if (l.collectorNotes && l.collectorNotes["gpu.nvml"]) {
          lines.push("注: GPU 温度/功耗取不到（nvidia-smi 失败）");
        }

        done(lines.join("\n"), "🖥 " + (l.machineName || "Windows") + " 硬件监控");
      } catch (e) {
        done("❌ 解析失败：" + (e.message || e));
      }
    }
  );
}
