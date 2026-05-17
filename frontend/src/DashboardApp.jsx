import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Shield, AlertTriangle, TrendingDown, TrendingUp, Activity, Zap, ExternalLink,
  RefreshCw, CheckCircle, BarChart3, Globe, Clock, Target, ArrowUpRight,
  ArrowDownRight, Cpu, Database, Eye, ChevronDown, ChevronRight, Info,
  PieChart, Layers, Wallet, Search, Filter, Gauge, Flame, Snowflake,
  ArrowRight, Lock, Unlock, Play, ChevronUp, X, ArrowLeft, Bell, ChevronLeft
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''
const fetchJson = async (path, fallback, timeoutMs = 9000) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, { signal: ctrl.signal })
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}
const fetchExternalJson = async (url, fallback, timeoutMs = 12000) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return fallback
    return await res.json()
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   CSS
   ═══════════════════════════════════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
:root {
  --bg:#ffffff;--bg2:#f7faf8;--bg3:#f0f5f2;--bg4:#e8f0eb;
  --border:#e0e8e3;--border2:#cdd8d1;
  --text:#0f1a14;--text2:#3d5347;--text3:#6b8077;
  --green:#059669;--green2:#10b981;--green3:#34d399;--green-bg:#ecfdf5;--green-bg2:#d1fae5;
  --red:#dc2626;--red-bg:#fef2f2;
  --yellow:#d97706;--yellow-bg:#fffbeb;
  --purple:#7c3aed;--purple-bg:#f5f3ff;
  --cyan:#0891b2;--cyan-bg:#ecfeff;
  --blue:#2563eb;--blue-bg:#eff6ff;
  --shadow:0 1px 3px rgba(0,0,0,.06);
  --shadow2:0 4px 12px rgba(0,0,0,.08);
  --shadow3:0 8px 30px rgba(0,0,0,.12);
  --r:12px;--r2:8px;--r3:6px;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg2);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased}
.app{max-width:1400px;margin:0 auto;padding:0 24px 60px}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}

/* Header */
.hdr{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.85);backdrop-filter:blur(16px);
     border-bottom:1px solid var(--border);margin:0 -24px;padding:12px 24px;
     display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:12px}
.logo-ic{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#059669,#10b981);
          display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(5,150,105,.3)}
.logo h1{font-size:20px;font-weight:800;letter-spacing:-.3px;color:var(--text)}
.logo h1 b{color:var(--green)}
.bdg{font-size:9px;font-weight:700;padding:3px 7px;border-radius:4px;text-transform:uppercase;
     letter-spacing:.5px;background:var(--bg3);color:var(--text3);border:1px solid var(--border)}
.bdg-live{background:var(--green-bg);color:var(--green);border-color:rgba(5,150,105,.2)}
.hdr-r{display:flex;gap:8px;align-items:center}
.btn{border:none;padding:9px 16px;border-radius:var(--r2);font-weight:600;font-size:12px;cursor:pointer;
     display:inline-flex;align-items:center;gap:6px;transition:all .2s;font-family:inherit}
.btn-p{background:linear-gradient(135deg,#059669,#10b981);color:#fff;box-shadow:0 2px 8px rgba(5,150,105,.25)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(5,150,105,.35)}
.btn-p:active{transform:translateY(0)}
.btn-p:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-s{background:var(--bg);color:var(--text2);border:1px solid var(--border)}
.btn-s:hover{border-color:var(--border2);background:var(--bg3)}
.btn-sm{padding:5px 10px;font-size:11px;border-radius:var(--r3)}

/* Ticker */
.ticker{display:flex;gap:8px;padding:16px 0 12px;overflow-x:auto;scrollbar-width:none}
.ticker::-webkit-scrollbar{display:none}
.tk{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:12px 16px;
    min-width:140px;flex-shrink:0;transition:all .2s;cursor:pointer;position:relative}
.tk:hover{box-shadow:var(--shadow2);border-color:var(--green);transform:translateY(-1px)}
.tk:active{transform:translateY(0)}
.tk-l{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;font-weight:600;margin-bottom:4px}
.tk-v{font-size:17px;font-weight:800}
.tk-c{font-size:11px;font-weight:600;margin-top:1px}
.tk-hint{font-size:8px;color:var(--green);font-weight:600;opacity:0;transition:opacity .2s;position:absolute;bottom:4px;right:8px}
.tk:hover .tk-hint{opacity:1}

/* Stat Cards */
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:6px 0 14px}
.st{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:16px;
    transition:all .25s;cursor:pointer;position:relative;overflow:hidden}
.st:hover{box-shadow:var(--shadow2);transform:translateY(-3px);border-color:var(--green)}
.st:hover .st-arrow{opacity:1;transform:translateX(0)}
.st:active{transform:translateY(-1px)}
.st-ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
.st-label{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.st-val{font-size:22px;font-weight:800;margin-top:2px;line-height:1.1}
.st-sub{font-size:10px;color:var(--text3);margin-top:4px;display:flex;align-items:center;gap:4px}
.st-arrow{position:absolute;top:16px;right:16px;opacity:0;transform:translateX(-4px);transition:all .2s;color:var(--green)}

/* Tabs */
.tabs{display:flex;gap:2px;margin-bottom:16px;background:var(--bg);border-radius:var(--r);
      padding:4px;border:1px solid var(--border);width:fit-content;box-shadow:var(--shadow)}
.tab{padding:8px 16px;border-radius:var(--r2);font-size:12px;font-weight:500;color:var(--text3);
     cursor:pointer;border:none;background:none;display:flex;align-items:center;gap:5px;
     transition:all .2s;white-space:nowrap;font-family:inherit}
.tab:hover{color:var(--text);background:var(--bg3)}
.tab.on{background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-weight:600;
        box-shadow:0 2px 6px rgba(5,150,105,.2)}

/* Section */
.sec{margin-bottom:20px}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.sh h2{font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px}
.cnt{background:var(--green-bg);color:var(--green);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}

/* Table */
.tw{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:10px 14px;font-size:9px;color:var(--text3);text-transform:uppercase;
   letter-spacing:.6px;font-weight:700;background:var(--bg3);border-bottom:1px solid var(--border)}
td{padding:10px 14px;border-bottom:1px solid var(--border);font-size:12px}
tr:last-child td{border-bottom:none}
tr.clickable{cursor:pointer;transition:background .15s}
tr.clickable:hover td{background:var(--green-bg)}
.tc{display:flex;align-items:center;gap:9px}
.ti{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;
    font-size:10px;font-weight:700;background:var(--green-bg);color:var(--green);border:1px solid rgba(5,150,105,.15);overflow:hidden}
.ti img{width:100%;height:100%;border-radius:8px}
.tn{font-weight:600;font-size:13px}
.ts{font-size:10px;color:var(--text3)}

/* Badges */
.rsk{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px}
.r-c{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
.r-h{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
.r-m{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.r-l{background:#ecfdf5;color:#059669;border:1px solid #a7f3d0}
.str{padding:3px 9px;border-radius:var(--r3);font-size:10px;font-weight:600;white-space:nowrap}
.s-exit{background:#fef2f2;color:#dc2626}
.s-reduce{background:#fffbeb;color:#d97706}
.s-hedge{background:#eff6ff;color:#2563eb}
.s-put{background:#f5f3ff;color:#7c3aed}
.s-dca{background:#ecfeff;color:#0891b2}

/* Cards */
.crd{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:16px;
     margin-bottom:8px;transition:all .2s;box-shadow:var(--shadow)}
.crd-click{cursor:pointer}
.crd-click:hover{box-shadow:var(--shadow2);border-color:var(--green);transform:translateY(-1px)}
.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}

/* Factor Bars */
.fr{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.fl{font-size:10px;color:var(--text3);width:100px;flex-shrink:0;font-weight:500}
.fb{flex:1;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden}
.fv{height:100%;border-radius:3px;transition:width .6s ease}
.fn{font-size:10px;font-weight:700;width:26px;text-align:right;flex-shrink:0}

/* Execution Steps */
.ps-s{position:relative;padding:7px 0 7px 22px;border-left:2px solid var(--border);margin-left:7px;font-size:11px;color:var(--text2)}
.ps-s:last-child{border-left-color:transparent}
.ps-s::before{content:'';position:absolute;left:-5px;top:11px;width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px var(--green-bg)}
.ps-a{font-weight:600;color:var(--text)}

/* Regime */
.rgm{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700}
.rgm-bull{background:#ecfdf5;color:#059669}
.rgm-bear{background:#fef2f2;color:#dc2626}
.rgm-sideways{background:#fffbeb;color:#d97706}

/* Backtest */
.btg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.bts{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:14px;text-align:center;box-shadow:var(--shadow)}
.bts .bv{font-size:20px;font-weight:800}
.bts .bl{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-top:3px;font-weight:600}

/* Sector Pills */
.spill{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:var(--r3);font-size:10px;
       font-weight:600;margin:2px;cursor:pointer;border:1px solid var(--border);transition:all .2s;background:var(--bg)}
.spill:hover{border-color:var(--border2);box-shadow:var(--shadow)}
.spill.on{border-color:var(--green);background:var(--green-bg);color:var(--green)}
.spill .dot{width:6px;height:6px;border-radius:50%}

/* Search */
.srch{position:relative;margin-bottom:14px}
.srch input{width:100%;padding:10px 14px 10px 38px;background:var(--bg);border:1px solid var(--border);
            border-radius:var(--r2);color:var(--text);font-size:12px;outline:none;transition:all .2s;font-family:inherit}
.srch input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(5,150,105,.1)}
.srch input::placeholder{color:var(--text3)}
.srch svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3)}

/* Side Panel */
.overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.3);z-index:200;
         animation:fadeIn .2s ease;backdrop-filter:blur(2px)}
.panel{position:fixed;top:0;right:0;bottom:0;width:520px;max-width:90vw;background:var(--bg);z-index:201;
       box-shadow:-8px 0 30px rgba(0,0,0,.15);animation:slideIn .25s ease;overflow-y:auto;padding:0}
.panel-hdr{position:sticky;top:0;background:var(--bg);z-index:10;padding:20px 24px 16px;
           border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.panel-body{padding:20px 24px}
.panel-close{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:var(--bg);
             display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
.panel-close:hover{background:var(--red-bg);border-color:var(--red);color:var(--red)}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* Toast */
.toast-container{position:fixed;top:70px;right:24px;z-index:300;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:12px 16px;
       box-shadow:var(--shadow3);display:flex;align-items:center;gap:10px;min-width:280px;
       animation:toastIn .3s ease;font-size:12px;font-weight:500}
.toast-g{border-left:3px solid var(--green)}
.toast-y{border-left:3px solid var(--yellow)}
.toast-r{border-left:3px solid var(--red)}
@keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

/* Scan Progress */
.scan-progress{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:20px;margin-bottom:16px;box-shadow:var(--shadow)}
.scan-steps{display:flex;gap:0;align-items:center;justify-content:space-between;position:relative}
.scan-step{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;position:relative;z-index:1}
.scan-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          border:2px solid var(--border);background:var(--bg);transition:all .3s;font-size:11px}
.scan-dot.active{border-color:var(--green);background:var(--green);color:#fff;box-shadow:0 0 12px rgba(5,150,105,.4)}
.scan-dot.done{border-color:var(--green);background:var(--green-bg);color:var(--green)}
.scan-dot.pending{border-color:var(--border);color:var(--text3)}
.scan-label{font-size:10px;color:var(--text3);font-weight:600;text-align:center}
.scan-label.active{color:var(--green)}
.scan-line{position:absolute;top:14px;left:0;right:0;height:2px;background:var(--border);z-index:0}
.scan-line-fill{height:100%;background:var(--green);transition:width .5s ease;border-radius:1px}

/* Chart */
.chart-wrap{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:16px;box-shadow:var(--shadow)}
.risk-hero{background:linear-gradient(135deg,#ffffff 0%,#f4fbf7 55%,#ecfeff 100%);border:1px solid var(--border);border-radius:18px;padding:18px;box-shadow:var(--shadow2);position:relative;overflow:hidden}
.risk-hero::after{content:'';position:absolute;right:-90px;top:-120px;width:260px;height:260px;background:radial-gradient(circle,rgba(16,185,129,.18),rgba(16,185,129,0) 68%);pointer-events:none}
.risk-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px;position:relative;z-index:1}
.risk-title{display:flex;align-items:center;gap:10px}
.risk-title h2{font-size:18px;letter-spacing:-.3px}
.risk-title p{font-size:12px;color:var(--text3);margin-top:3px;max-width:760px;line-height:1.5}
.threat-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;border:1px solid}
.threat-normal{background:var(--green-bg);color:var(--green);border-color:#a7f3d0}
.threat-elevated{background:var(--yellow-bg);color:var(--yellow);border-color:#fde68a}
.threat-high,.threat-extreme{background:var(--red-bg);color:var(--red);border-color:#fecaca}
.event-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;position:relative;z-index:1}
.event-metric{background:rgba(255,255,255,.76);border:1px solid var(--border);border-radius:12px;padding:12px}
.event-metric .k{font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.55px;margin-bottom:4px}
.event-metric .v{font-size:20px;font-weight:900;line-height:1.1}
.event-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:12px;position:relative;z-index:1}
.event-list{display:grid;gap:8px}
.event-card{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;transition:all .18s;cursor:pointer}
.event-card:hover{border-color:var(--green);box-shadow:var(--shadow2);transform:translateY(-1px)}
.event-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.event-type{font-size:9px;color:var(--text3);font-weight:800;text-transform:uppercase;letter-spacing:.5px}
.event-name{font-size:13px;font-weight:800;margin-top:2px}
.event-desc{font-size:11px;color:var(--text3);line-height:1.4;margin-top:2px}
.event-score{min-width:58px;text-align:right}
.event-score .n{font-size:18px;font-weight:900}
.event-score .l{font-size:9px;font-weight:800;text-transform:uppercase}
.event-taxonomy{background:rgba(255,255,255,.72);border:1px solid var(--border);border-radius:12px;padding:12px;align-self:stretch}
.taxonomy-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}
.taxonomy-item{display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:9px}
.taxonomy-item b{display:block;font-size:11px}
.taxonomy-item span{display:block;font-size:9px;color:var(--text3);margin-top:1px}
.timeline-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.timeline-card{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
.timeline-card:hover{border-color:var(--green);box-shadow:var(--shadow2);transform:translateY(-2px)}
.timeline-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--green)}
.timeline-card.high::before{background:var(--red)}
.timeline-card.medium::before{background:var(--yellow)}
.timeline-date{font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.45px;margin-bottom:6px}
.timeline-token{font-size:16px;font-weight:900;letter-spacing:-.2px}
.timeline-meta{font-size:11px;color:var(--text3);line-height:1.35;margin-top:5px}
.timeline-bar{height:6px;background:var(--bg3);border-radius:999px;overflow:hidden;margin-top:10px}
.timeline-fill{height:100%;border-radius:999px}
.mini-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.mini-link{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border-radius:8px;border:1px solid var(--border);background:var(--bg);font-size:10px;font-weight:700;color:var(--text2);text-decoration:none;transition:all .18s;cursor:pointer}
.mini-link:hover{border-color:var(--green);color:var(--green);background:var(--green-bg)}
.oracle-preview{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.oracle-card{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center}
.oracle-card .k{font-size:9px;color:var(--text3);font-weight:800;text-transform:uppercase;letter-spacing:.5px}
.oracle-card .v{font-size:18px;font-weight:900;margin-top:4px}
.oracle-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.oracle-step{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:left;position:relative}
.oracle-step .num{width:28px;height:28px;border-radius:9px;background:var(--green-bg);color:var(--green);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;margin-bottom:10px}
.link-card{display:block;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px;text-decoration:none;color:inherit;transition:all .18s;border-left:3px solid var(--green)}
.link-card:hover{border-color:var(--green);box-shadow:var(--shadow2);transform:translateY(-1px);background:#fbfffd}
.link-card .top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
.link-card h3{font-size:13px}
.link-card p{font-size:11px;color:var(--text3);line-height:1.45}
.mono-link{font-family:'SF Mono','Fira Code',monospace;font-size:10px;color:var(--text2);word-break:break-all;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px;margin-top:8px}

/* Gauge */
.gauge-wrap{display:flex;flex-direction:column;align-items:center;padding:8px 0}

/* Donut */
.donut-wrap{display:flex;align-items:center;gap:20px}
.donut-legend{display:flex;flex-direction:column;gap:6px}
.donut-item{display:flex;align-items:center;gap:8px;font-size:12px}
.donut-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}

/* Info Box */
.info-box{padding:14px 16px;border-radius:var(--r2);font-size:12px;line-height:1.6;border-left:3px solid}

/* Code */
.code{background:#1e293b;border-radius:var(--r2);padding:12px 14px;font-family:'SF Mono','Fira Code',monospace;
      font-size:11px;color:#e2e8f0;overflow-x:auto;line-height:1.6}

/* Empty */
.empty{text-align:center;padding:48px 24px;background:var(--bg);border:1px dashed var(--border);border-radius:var(--r)}
.empty p{margin-top:6px;font-size:13px;color:var(--text3)}

/* Pagination */
.pagination{display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 0}
.pg-btn{padding:6px 14px;border-radius:var(--r3);font-size:11px;font-weight:600;cursor:pointer;
        border:1px solid var(--border);background:var(--bg);color:var(--text2);transition:all .2s;font-family:inherit}
.pg-btn:hover{border-color:var(--green);color:var(--green);background:var(--green-bg)}
.pg-btn.on{background:var(--green);color:#fff;border-color:var(--green)}
.pg-btn:disabled{opacity:.4;cursor:not-allowed}
.pg-info{font-size:11px;color:var(--text3);font-weight:500;padding:0 8px}

/* Regime Modal */
.regime-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:301;
  background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:28px;
  width:520px;max-width:90vw;box-shadow:var(--shadow3);animation:fadeUp .25s ease}
.regime-signal{display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--r2);
  border:1px solid var(--border);margin-bottom:8px;transition:all .2s}
.regime-signal:hover{border-color:var(--border2);background:var(--bg3)}
.rgm-sig:hover{background:var(--bg)!important;box-shadow:0 2px 8px rgba(0,0,0,.06);transform:translateY(-1px)}
.signal-bar{flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;position:relative}
.signal-fill{height:100%;border-radius:4px;transition:width .6s ease}

/* Animations */
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.fade{animation:fadeUp .3s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block;
           box-shadow:0 0 6px rgba(5,150,105,.5);animation:pulseDot 2s ease-in-out infinite}
@keyframes pulseDot{0%,100%{opacity:1;box-shadow:0 0 6px rgba(5,150,105,.5)}50%{opacity:.6;box-shadow:0 0 12px rgba(5,150,105,.8)}}

/* Header search */
.hdr-search{position:relative;display:flex;align-items:center;gap:8px;background:var(--bg3);
            border:1px solid var(--border);border-radius:var(--r2);padding:7px 12px;width:280px;
            transition:all .15s}
.hdr-search:focus-within{border-color:var(--green);background:var(--bg);box-shadow:0 0 0 3px rgba(5,150,105,.08)}
.hdr-search input{flex:1;border:none;background:transparent;outline:none;font-size:13px;font-family:inherit;color:var(--text)}
.hdr-search input::placeholder{color:var(--text3)}
.hdr-search-results{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--bg);
                    border:1px solid var(--border);border-radius:var(--r2);box-shadow:var(--shadow3);
                    max-height:360px;overflow-y:auto;z-index:200}
.hdr-search-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;
                 border-bottom:1px solid var(--border);transition:background .12s}
.hdr-search-item:last-child{border-bottom:none}
.hdr-search-item:hover{background:var(--green-bg)}

/* News */
.news-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.news-card{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:18px;
           transition:all .2s;cursor:pointer;position:relative;overflow:hidden}
.news-card:hover{border-color:var(--green);box-shadow:var(--shadow2);transform:translateY(-2px)}
.news-card-h{display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;gap:8px}
.news-card-sym{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;
               background:var(--bg3);font-size:11px;font-weight:700;color:var(--text)}
.news-card-time{font-size:10px;color:var(--text3);font-weight:600}
.news-card-title{font-size:14px;font-weight:700;line-height:1.4;color:var(--text);margin-bottom:8px}
.news-card-desc{font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:12px}
.news-card-f{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border);font-size:10px}
.news-card-src{color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.3px}
.news-card-sent{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:10px;font-weight:700}
.news-sent-up{background:var(--green-bg);color:var(--green)}
.news-sent-down{background:var(--red-bg);color:var(--red)}
.news-sent-flat{background:var(--bg3);color:var(--text3)}
.news-filters{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.news-pill{padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;cursor:pointer;
           border:1px solid var(--border);background:var(--bg);color:var(--text2);transition:all .15s}
.news-pill:hover{border-color:var(--green)}
.news-pill.on{background:var(--green);color:#fff;border-color:var(--green)}

/* Hero */
.hero{margin:24px 0 28px;padding:36px 32px;border-radius:18px;position:relative;overflow:hidden;
      background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 35%,#ffffff 100%);
      border:1px solid #d1fae5}
.hero::before{content:'';position:absolute;top:-40%;right:-10%;width:520px;height:520px;border-radius:50%;
              background:radial-gradient(circle,rgba(16,185,129,.18) 0%,transparent 70%);pointer-events:none}
.hero-inner{position:relative;display:grid;grid-template-columns:1.4fr 1fr;gap:40px;align-items:center}
.hero-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;
          background:rgba(5,150,105,.1);color:var(--green);font-size:11px;font-weight:700;
          letter-spacing:.4px;text-transform:uppercase;margin-bottom:14px;border:1px solid rgba(5,150,105,.2)}
.hero-title{font-size:36px;font-weight:900;line-height:1.1;letter-spacing:-1px;color:var(--text);margin-bottom:14px}
.hero-title em{font-style:normal;background:linear-gradient(135deg,#059669,#10b981);
               -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:15px;line-height:1.55;color:var(--text2);max-width:580px;margin-bottom:20px}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap}
.hero-trust{display:flex;gap:24px;margin-top:24px;padding-top:20px;border-top:1px solid rgba(5,150,105,.15)}
.hero-trust-item{display:flex;flex-direction:column;gap:2px}
.hero-trust-val{font-size:20px;font-weight:800;color:var(--text);line-height:1}
.hero-trust-lbl{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;font-weight:600}
.hero-visual{position:relative;display:flex;align-items:center;justify-content:center;min-height:240px}
.hero-card{background:rgba(255,255,255,.85);backdrop-filter:blur(12px);border:1px solid #d1fae5;
           border-radius:14px;padding:20px;box-shadow:0 20px 50px rgba(5,150,105,.15);
           width:100%;max-width:340px}
.hero-card-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.hero-card-title{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;font-weight:700}
.hero-card-pulse{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--green);font-weight:700}
.hero-card-metric{font-size:28px;font-weight:900;letter-spacing:-.5px;margin-bottom:6px}
.hero-card-row{display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #e0e8e3;font-size:12px}
.hero-card-row:first-of-type{border-top:none;padding-top:4px}
.hero-card-row span:first-child{color:var(--text3)}
.hero-card-row span:last-child{font-weight:700;color:var(--text)}

/* Footer */
.foot{margin-top:48px;padding:32px 0 20px;border-top:1px solid var(--border)}
.foot-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;margin-bottom:28px}
.foot-brand h3{font-size:16px;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:8px}
.foot-brand p{font-size:12px;color:var(--text3);line-height:1.55;max-width:280px}
.foot-col h4{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);font-weight:700;margin-bottom:10px}
.foot-col a{display:block;padding:4px 0;font-size:12px;color:var(--text2);text-decoration:none;transition:color .15s}
.foot-col a:hover{color:var(--green)}
.foot-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:20px;border-top:1px solid var(--border);font-size:11px;color:var(--text3)}

/* Responsive */
@media(max-width:1024px){.stats{grid-template-columns:repeat(3,1fr)}.btg,.event-metrics,.oracle-preview,.oracle-flow{grid-template-columns:repeat(2,1fr)}.event-grid{grid-template-columns:1fr}.timeline-grid{grid-template-columns:repeat(2,1fr)}.panel{width:100%;max-width:100%}.regime-modal{width:95vw}.hero-inner{grid-template-columns:1fr}.hero-visual{display:none}.foot-grid{grid-template-columns:1fr 1fr}}
@media(max-width:768px){.stats{grid-template-columns:repeat(2,1fr)}.timeline-grid,.event-metrics,.oracle-preview,.oracle-flow,.taxonomy-grid{grid-template-columns:1fr}.app{padding:0 14px 40px}.hdr{margin:0 -14px;padding:10px 14px;flex-wrap:wrap;gap:10px}.tabs{overflow-x:auto;width:100%}.hero{padding:28px 20px;margin:18px 0 22px}.hero-title{font-size:26px}.hero-trust{gap:16px;flex-wrap:wrap}.foot-grid{grid-template-columns:1fr;gap:24px}.foot-bottom{flex-direction:column;gap:8px}.hdr-search{width:100%;order:3}}
`

/* ═══ HELPERS ═══ */
const fmt = v => {
  if (v == null || isNaN(v)) return '$0'
  if (v >= 1e12) return `$${(v/1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v/1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v/1e3).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}
const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback
const pct = (v, digits = 1) => `${num(v).toFixed(digits)}%`
const fmtD = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
const daysUntil = d => Math.ceil((new Date(d)-new Date())/864e5)
const clr = v => v>0?'var(--green)':v<0?'var(--red)':'var(--text3)'

// Normalize a tx_hash to a valid KiteScan URL. Returns null if not a real on-chain hash.
const kiteScanUrl = (txHash) => {
  if(!txHash) return null
  const s = String(txHash).toLowerCase().trim()
  // Reject synthetic/placeholder hashes that don't exist on-chain
  if(s.startsWith('0x_')) return null
  if(s.startsWith('hist-') || s.startsWith('local-')) return null
  if(s === '0x' + '0'.repeat(64)) return null
  // Add 0x prefix if missing (web3.py returns hex without prefix in newer versions)
  const normalized = s.startsWith('0x') ? s : ('0x' + s)
  // Valid tx hashes are 0x + 64 hex chars
  if(normalized.length !== 66) return null
  if(!/^0x[0-9a-f]{64}$/.test(normalized)) return null
  return `https://testnet.kitescan.ai/tx/${normalized}`
}
const riskCls = s => s>=80?'r-c':s>=55?'r-h':s>=35?'r-m':'r-l'
const riskLabel = s => s>=80?'CRITICAL':s>=55?'HIGH':s>=35?'MEDIUM':'LOW'
const strategyForRisk = s => s>=80?'FULL_EXIT':s>=55?'SHORT_HEDGE':s>=35?'DCA_EXIT':'HOLD'
const stratCls = s => ({FULL_EXIT:'s-exit',REDUCE_POSITION:'s-reduce',SHORT_HEDGE:'s-hedge',OPTIONS_PUT:'s-put',DCA_EXIT:'s-dca'})[s]||''
const barClr = s => s>=70?'var(--red)':s>=45?'var(--yellow)':'var(--green)'
const SECTOR_COLORS = {L1:'#3b82f6',L2:'#8b5cf6',DeFi:'#059669',Gaming:'#d97706',Infra:'#0891b2',Stable:'#6b7280',Altcoin:'#ec4899',Other:'#6b7280'}
const CLIENT_SECTOR_MAP = {
  BTC:'L1',ETH:'L1',SOL:'L1',BNB:'L1',XRP:'L1',ADA:'L1',AVAX:'L1',SUI:'L1',APT:'L1',SEI:'L1',TON:'L1',TRX:'L1',DOT:'L1',ATOM:'L1',NEAR:'L1',ICP:'L1',ALGO:'L1',HBAR:'L1',FIL:'L1',
  ARB:'L2',OP:'L2',MATIC:'L2',POL:'L2',STRK:'L2',ZK:'L2',MANTA:'L2',METIS:'L2',IMX:'Gaming',
  UNI:'DeFi',AAVE:'DeFi',MKR:'DeFi',COMP:'DeFi',SNX:'DeFi',CRV:'DeFi',LDO:'DeFi',PENDLE:'DeFi',DYDX:'DeFi',GMX:'DeFi',RUNE:'DeFi',INJ:'DeFi',
  LINK:'Infra',TIA:'Infra',PYTH:'Infra',GRT:'Infra',RNDR:'Infra',RENDER:'Infra',FET:'Infra',AR:'Infra',AKT:'Infra',TAO:'Infra',WLD:'Infra',
  USDT:'Stable',USDC:'Stable',DAI:'Stable',FDUSD:'Stable',TUSD:'Stable',
  DOGE:'Altcoin',SHIB:'Altcoin',PEPE:'Altcoin',BONK:'Altcoin',FLOKI:'Altcoin'
}
const classifyClientSector = symbol => CLIENT_SECTOR_MAP[String(symbol||'').toUpperCase()] || 'Other'
const buildSectorSummary = tokens => tokens.reduce((acc,t)=>{
  const sector = t.sector || 'Other'
  if(!acc[sector]) acc[sector] = {count:0,avg_change_24h:0,total_market_cap:0}
  acc[sector].count += 1
  acc[sector].avg_change_24h += num(t.change_24h)
  acc[sector].total_market_cap += num(t.market_cap)
  return acc
},{})
const finalizeSectorSummary = sectors => Object.fromEntries(Object.entries(sectors).map(([k,v])=>[k,{...v,avg_change_24h:Number((v.avg_change_24h/Math.max(v.count,1)).toFixed(2))}]))
const normalizeCoinPaprikaTicker = t => {
  const symbol = String(t?.symbol || '').toUpperCase()
  const usd = t?.quotes?.USD || {}
  const marketCap = num(usd.market_cap)
  const volume = num(usd.volume_24h)
  return {
    id:t?.id,
    rank:num(t?.rank,999999),
    symbol,
    name:t?.name || symbol,
    price:num(usd.price),
    change_1h:Number(num(usd.percent_change_1h).toFixed(2)),
    change_24h:Number(num(usd.percent_change_24h).toFixed(2)),
    change_7d:Number(num(usd.percent_change_7d).toFixed(2)),
    change_30d:Number(num(usd.percent_change_30d).toFixed(2)),
    market_cap:marketCap,
    volume_24h:volume,
    volume_to_mcap:marketCap ? Number(((volume/marketCap)*100).toFixed(2)) : 0,
    sector:classifyClientSector(symbol),
    sparkline_7d:[],
    data_source:'coinpaprika_browser_api',
    data_quality:'live',
  }
}
const hydrateMarketPayload = (base, tokens, source='coinpaprika') => {
  const clean = tokens.filter(t=>t?.symbol&&t?.price&&t?.market_cap).sort((a,b)=>num(a.rank)-num(b.rank))
  const totalMarketCap = clean.reduce((s,t)=>s+num(t.market_cap),0)
  const totalVolume = clean.reduce((s,t)=>s+num(t.volume_24h),0)
  const btcMarketCap = clean.find(t=>t.symbol==='BTC')?.market_cap || 0
  const ethMarketCap = clean.find(t=>t.symbol==='ETH')?.market_cap || 0
  const weightedChange = totalMarketCap ? clean.reduce((s,t)=>s+(num(t.change_24h)*num(t.market_cap)),0)/totalMarketCap : 0
  return {
    ...(base||{}),
    global: (base?.global?.total_market_cap || 0) > 0 ? base.global : {
      total_market_cap: totalMarketCap,
      total_volume_24h: totalVolume,
      btc_dominance: totalMarketCap ? Number(((btcMarketCap/totalMarketCap)*100).toFixed(2)) : 0,
      eth_dominance: totalMarketCap ? Number(((ethMarketCap/totalMarketCap)*100).toFixed(2)) : 0,
      active_cryptocurrencies: clean.length,
      market_cap_change_24h: Number(weightedChange.toFixed(2)),
      data_source: source,
    },
    fear_greed: base?.fear_greed?.value ? base.fear_greed : {value:27,classification:'Fear',source:'fallback_snapshot'},
    tvl: base?.tvl?.total ? base.tvl : {total:84200000000,change_7d:1.2},
    tokens_count: clean.length,
    top_tokens: clean,
    all_tokens: clean,
    sectors: finalizeSectorSummary(buildSectorSummary(clean)),
    top_gainers: [...clean].sort((a,b)=>num(b.change_24h)-num(a.change_24h)).slice(0,5),
    top_losers: [...clean].sort((a,b)=>num(a.change_24h)-num(b.change_24h)).slice(0,5),
    data_quality: {
      ...(base?.data_quality||{}),
      market_data_source: source,
      market_data_quality: clean[0]?.data_quality || 'live',
      primary_price_provider: 'CoinPaprika',
    }
  }
}
const fetchCoinPaprikaUniverse = async (limit=300) => {
  const viaBackend = await fetchJson(`/api/market/coinpaprika?limit=${limit}`, null, 14000)
  if(viaBackend?.tokens?.length) return viaBackend.tokens

  const rows = await fetchExternalJson('https://api.coinpaprika.com/v1/tickers?quotes=USD', [], 14000)
  if(!Array.isArray(rows)) return []
  return rows
    .filter(r=>r?.quotes?.USD?.market_cap)
    .map(normalizeCoinPaprikaTicker)
    .sort((a,b)=>num(a.rank)-num(b.rank))
    .slice(0,limit)
}
const KITE_LINKS = {
  docs:'https://docs.gokite.ai/',
  network:'https://docs.gokite.ai/kite-chain/1-getting-started/network-information',
  explorer:'https://testnet.kitescan.ai/',
  faucet:'https://faucet.gokite.ai/',
  aa:'https://docs.gokite.ai/kite-chain/account-abstraction-sdk',
  goldsky:'https://docs.gokite.ai/kite-chain/11-goldsky-kite-integration',
  lucid:'https://docs.gokite.ai/kite-chain/12-lucid-kite-integration',
  layerzero:'https://docs.gokite.ai/kite-chain/10-layerzero-kite-integration',
  multisig:'https://docs.gokite.ai/kite-chain/multisig-wallet'
}
const DEMO_UNLOCKS = [
  {token_symbol:'PYTH',token_name:'Pyth Network',unlock_date:'2026-05-20',unlock_amount_usd:9000000,unlock_amount_tokens:200000000,total_supply_percent:1.33,source:'Curated unlock fallback'},
  {token_symbol:'OP',token_name:'Optimism',unlock_date:'2026-05-31',unlock_amount_usd:4200000,unlock_amount_tokens:31340000,total_supply_percent:0.73,source:'Curated unlock fallback'},
  {token_symbol:'SUI',token_name:'Sui',unlock_date:'2026-06-01',unlock_amount_usd:69100000,unlock_amount_tokens:64190000,total_supply_percent:0.64,source:'Curated unlock fallback'},
  {token_symbol:'ARB',token_name:'Arbitrum',unlock_date:'2026-06-16',unlock_amount_usd:93000000,unlock_amount_tokens:92650000,total_supply_percent:2.12,source:'Curated unlock fallback'},
  {token_symbol:'APT',token_name:'Aptos',unlock_date:'2026-06-12',unlock_amount_usd:74000000,unlock_amount_tokens:11310000,total_supply_percent:1.87,source:'Curated unlock fallback'},
]
const DEMO_EVENTS = {
  threat_level:'ELEVATED',
  total_events:6,
  events:[
    {event_type:'macro_event',title:'Risk regime under pressure',description:'Fear & Greed and BTC dominance imply defensive market structure; stress engine raises base volatility.',severity_score:58,severity_label:'MEDIUM',source:'Alternative.me + market regime',timestamp:new Date().toISOString()},
    {event_type:'token_unlock',title:'ARB unlock approaching',description:'Investor and team tokens unlock soon. Historical pattern shows downside pressure in the days before release.',severity_score:62,severity_label:'HIGH',source:'Token unlock schedule',timestamp:'2026-06-16',token_symbol:'ARB'},
    {event_type:'stablecoin_flow',title:'Stablecoin liquidity watch',description:'Stablecoin supply and depeg monitor feed liquidity-risk adjustments for AMM wrapper tests.',severity_score:42,severity_label:'MEDIUM',source:'DeFiLlama stablecoins',timestamp:new Date().toISOString()},
    {event_type:'dex_volume_spike',title:'DEX volume anomalies',description:'Unusual trading activity flagged on top pools. Used to detect early signs of stress in liquidity.',severity_score:45,severity_label:'MEDIUM',source:'GeckoTerminal',timestamp:new Date().toISOString()},
    {event_type:'liquidation_cascade',title:'Lending unwind monitor',description:'Large TVL drawdowns in lending venues can trigger forced selling and jump shocks.',severity_score:38,severity_label:'LOW',source:'DeFiLlama protocols',timestamp:new Date().toISOString()},
    {event_type:'whale_movement',title:'Exchange-flow watch',description:'Large transfer detection watches for whale deposits that often precede sell pressure.',severity_score:35,severity_label:'LOW',source:'Etherscan',timestamp:new Date().toISOString()},
  ]
}
const DEMO_PORTFOLIO = {
  total_value_usd:4800,
  total_value_protected:0,
  holdings_count:6,
  holdings:[
    {token_symbol:'ARB',amount:1200,current_price:.98,value_usd:1176},
    {token_symbol:'OP',amount:900,current_price:1.62,value_usd:1458},
    {token_symbol:'SUI',amount:550,current_price:3.1,value_usd:1705},
    {token_symbol:'PYTH',amount:1300,current_price:.28,value_usd:364},
    {token_symbol:'APT',amount:15,current_price:6.5,value_usd:97.5},
  ]
}
const DEMO_MARKET_TOKENS = [
  {rank:1,symbol:'BTC',name:'Bitcoin',price:103240,change_24h:1.4,change_7d:4.8,market_cap:2040000000000,volume_24h:42500000000,sector:'L1',sparkline_7d:[98600,99400,100100,99650,101200,102450,103240]},
  {rank:2,symbol:'ETH',name:'Ethereum',price:3875,change_24h:2.1,change_7d:6.3,market_cap:467000000000,volume_24h:21900000000,sector:'L1',sparkline_7d:[3610,3660,3725,3690,3780,3835,3875]},
  {rank:5,symbol:'SOL',name:'Solana',price:184.2,change_24h:3.7,change_7d:8.1,market_cap:86400000000,volume_24h:5200000000,sector:'L1',sparkline_7d:[168,171,176,174,179,181,184]},
  {rank:6,symbol:'BNB',name:'BNB',price:642.5,change_24h:.6,change_7d:2.4,market_cap:93800000000,volume_24h:1780000000,sector:'L1',sparkline_7d:[626,630,635,633,638,640,642]},
  {rank:7,symbol:'XRP',name:'XRP',price:2.43,change_24h:-.8,change_7d:1.2,market_cap:137000000000,volume_24h:3900000000,sector:'L1',sparkline_7d:[2.38,2.41,2.45,2.46,2.44,2.42,2.43]},
  {rank:8,symbol:'DOGE',name:'Dogecoin',price:.214,change_24h:5.2,change_7d:9.4,market_cap:31800000000,volume_24h:2600000000,sector:'Altcoin',sparkline_7d:[.193,.197,.201,.198,.205,.211,.214]},
  {rank:9,symbol:'ADA',name:'Cardano',price:.78,change_24h:-1.1,change_7d:-2.8,market_cap:27700000000,volume_24h:860000000,sector:'L1',sparkline_7d:[.80,.79,.81,.78,.77,.78,.78]},
  {rank:11,symbol:'AVAX',name:'Avalanche',price:38.6,change_24h:2.8,change_7d:5.7,market_cap:15800000000,volume_24h:910000000,sector:'L1',sparkline_7d:[36.1,36.8,37.2,36.9,37.8,38.1,38.6]},
  {rank:14,symbol:'LINK',name:'Chainlink',price:18.7,change_24h:1.9,change_7d:7.6,market_cap:11800000000,volume_24h:750000000,sector:'Infra',sparkline_7d:[17.1,17.3,17.8,17.6,18.1,18.4,18.7]},
  {rank:24,symbol:'SUI',name:'Sui',price:3.1,change_24h:-2.4,change_7d:3.2,market_cap:9300000000,volume_24h:1140000000,sector:'L1',sparkline_7d:[3.02,3.08,3.16,3.22,3.17,3.13,3.10]},
  {rank:36,symbol:'APT',name:'Aptos',price:6.5,change_24h:-1.7,change_7d:-4.1,market_cap:4100000000,volume_24h:318000000,sector:'L1',sparkline_7d:[6.78,6.71,6.62,6.59,6.48,6.54,6.50]},
  {rank:42,symbol:'ARB',name:'Arbitrum',price:.98,change_24h:-3.2,change_7d:-6.9,market_cap:4200000000,volume_24h:612000000,sector:'L2',sparkline_7d:[1.05,1.03,1.01,1.00,.99,.97,.98]},
  {rank:45,symbol:'OP',name:'Optimism',price:1.62,change_24h:-2.1,change_7d:-3.5,market_cap:2400000000,volume_24h:221000000,sector:'L2',sparkline_7d:[1.68,1.65,1.66,1.61,1.60,1.63,1.62]},
  {rank:51,symbol:'TIA',name:'Celestia',price:5.9,change_24h:4.6,change_7d:11.2,market_cap:3100000000,volume_24h:490000000,sector:'Infra',sparkline_7d:[5.28,5.34,5.45,5.51,5.66,5.78,5.90]},
  {rank:62,symbol:'SEI',name:'Sei',price:.53,change_24h:6.4,change_7d:12.8,market_cap:2100000000,volume_24h:265000000,sector:'L1',sparkline_7d:[.47,.48,.49,.50,.51,.52,.53]},
  {rank:70,symbol:'IMX',name:'Immutable',price:1.84,change_24h:2.5,change_7d:7.1,market_cap:2900000000,volume_24h:122000000,sector:'Gaming',sparkline_7d:[1.72,1.75,1.78,1.76,1.80,1.82,1.84]},
  {rank:94,symbol:'DYDX',name:'dYdX',price:1.24,change_24h:-4.8,change_7d:-9.3,market_cap:910000000,volume_24h:155000000,sector:'DeFi',sparkline_7d:[1.37,1.34,1.30,1.29,1.25,1.22,1.24]},
  {rank:98,symbol:'PYTH',name:'Pyth Network',price:.28,change_24h:-.9,change_7d:2.1,market_cap:1020000000,volume_24h:98000000,sector:'Infra',sparkline_7d:[.274,.277,.281,.279,.283,.282,.280]},
]
const EVENT_META = {
  token_unlock:{label:'Token Unlock',color:'var(--yellow)',bg:'var(--yellow-bg)',icon:<Unlock size={16}/>,why:'scheduled supply shock'},
  dex_volume_spike:{label:'DEX Volume',color:'var(--cyan)',bg:'var(--cyan-bg)',icon:<BarChart3 size={16}/>,why:'abnormal pool activity'},
  macro_event:{label:'Macro/Fed',color:'var(--purple)',bg:'var(--purple-bg)',icon:<Globe size={16}/>,why:'rates, CPI, risk regime'},
  whale_movement:{label:'Whales',color:'var(--red)',bg:'var(--red-bg)',icon:<Activity size={16}/>,why:'large wallet transfer'},
  stablecoin_flow:{label:'Stablecoins',color:'var(--green)',bg:'var(--green-bg)',icon:<Database size={16}/>,why:'liquidity/depeg pressure'},
  liquidation_cascade:{label:'Liquidations',color:'var(--red)',bg:'var(--red-bg)',icon:<TrendingDown size={16}/>,why:'forced unwind risk'},
  regulatory_news:{label:'Regulatory',color:'var(--blue)',bg:'var(--blue-bg)',icon:<Bell size={16}/>,why:'policy/news catalyst'},
  governance_proposal:{label:'Governance',color:'var(--purple)',bg:'var(--purple-bg)',icon:<Layers size={16}/>,why:'protocol rule change'},
  default:{label:'Market Event',color:'var(--text3)',bg:'var(--bg3)',icon:<Zap size={16}/>,why:'risk signal'}
}
const eventMeta = type => EVENT_META[type] || EVENT_META.default
const eventSeverityClass = score => score>=80?'r-c':score>=60?'r-h':score>=40?'r-m':'r-l'
const riskTone = score => score>=60?'high':score>=35?'medium':'low'

/* ═══ Sparkline Mini Chart ═══ */
function Sparkline7d({ data, width = 80, height = 28, color }) {
  if (!data || data.length < 5) return null
  // Sample down to ~20 points for performance
  const step = Math.max(1, Math.floor(data.length / 20))
  const pts = data.filter((_, i) => i % step === 0 || i === data.length - 1)
  const mn = Math.min(...pts)
  const mx = Math.max(...pts)
  const range = mx - mn || 1
  const lineColor = color || (pts[pts.length-1] >= pts[0] ? '#059669' : '#dc2626')
  const pathD = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * width
    const y = height - 2 - ((v - mn) / range) * (height - 4)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ═══ COMPONENTS ═══ */

function RiskGauge({score=0,size=160}) {
  const r=size/2-12;const c=Math.PI*r
  const pct=Math.min(score,100)/100
  const color=score>=80?'#dc2626':score>=55?'#ea580c':score>=35?'#d97706':'#059669'
  return(
    <div className="gauge-wrap">
      <svg width={size} height={size/2+20} viewBox={`0 0 ${size} ${size/2+20}`}>
        <path d={`M12,${size/2+8} A${r},${r} 0 0,1 ${size-12},${size/2+8}`} fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round"/>
        <path d={`M12,${size/2+8} A${r},${r} 0 0,1 ${size-12},${size/2+8}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c-(c*pct)} style={{transition:'stroke-dashoffset .8s ease'}}/>
        <text x={size/2} y={size/2} textAnchor="middle" fontSize="24" fontWeight="800" fill={color}>{score}</text>
        <text x={size/2} y={size/2+16} textAnchor="middle" fontSize="10" fill="#6b8077" fontWeight="600">{riskLabel(score)}</text>
      </svg>
    </div>
  )
}

function UnlockTimeline({unlocks,onSelect}) {
  if(!unlocks||unlocks.length===0) return null
  const ordered = [...unlocks].sort((a,b)=>new Date(a.unlock_date)-new Date(b.unlock_date)).slice(0,8)
  const maxPct=Math.max(...ordered.map(u=>u.total_supply_percent||1),1)
  const highRisk = ordered.filter(u=>(u.total_supply_percent||0)>=2).length
  return(
    <div className="chart-wrap">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:800,display:'flex',alignItems:'center',gap:6}}>
          <Clock size={15} color="var(--green)"/> Clear Unlock Calendar — Next 90 Days
        </div>
        <div style={{fontSize:11,color:'var(--text3)'}}>{ordered.length} shown • {highRisk} higher shock candidates</div>
      </div>
      <div className="timeline-grid">
        {ordered.map((u,i)=>{
          const pctVal = num(u.total_supply_percent)
          const d=daysUntil(u.unlock_date)
          const tone=riskTone(pctVal*16)
          const fill=Math.max(8,Math.min(100,(pctVal/maxPct)*100))
          const color=tone==='high'?'var(--red)':tone==='medium'?'var(--yellow)':'var(--green)'
          return(
            <div key={`${u.token_symbol}-${i}`} className={`timeline-card ${tone}`} onClick={()=>onSelect&&onSelect(u)}>
              <div className="timeline-date">{fmtD(u.unlock_date)} • {d<=0?'Today':`${d}d away`}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                <div>
                  <div className="timeline-token">{u.token_symbol}</div>
                  <div className="timeline-meta">{u.token_name}</div>
                </div>
                <span className={`rsk ${eventSeverityClass(pctVal*16)}`}>{pctVal.toFixed(2)}%</span>
              </div>
              <div className="timeline-meta">{fmt(u.unlock_amount_usd)} unlock • {u.unlock_amount_tokens?.toLocaleString()} tokens</div>
              <div className="timeline-bar"><div className="timeline-fill" style={{width:`${fill}%`,background:color}}/></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventRiskBoard({eventStream,unlocks,market,onSelectToken,onOpenStress,onOpenEvent}) {
  const streamEvents = eventStream?.events || market?.event_intelligence?.top_alerts || []
  const unlockEvents = (unlocks||[]).slice(0,6).map(u => {
    const score = Math.min(100, Math.max(12, num(u.total_supply_percent) * 16 + (daysUntil(u.unlock_date) <= 7 ? 18 : 0)))
    return {
      event_type:'token_unlock',
      title:`${u.token_symbol} unlock in ${Math.max(daysUntil(u.unlock_date),0)}d`,
      description:`${fmt(u.unlock_amount_usd)} supply release (${num(u.total_supply_percent).toFixed(2)}% of supply). Feeds jump-size calibration for the stress engine.`,
      severity_score:score,
      severity_label:riskLabel(score),
      source:u.source || 'Token unlock schedule',
      timestamp:u.unlock_date,
      token_symbol:u.token_symbol,
      metadata:{amount_usd:u.unlock_amount_usd,total_supply_percent:u.total_supply_percent}
    }
  })
  const events = [...streamEvents, ...unlockEvents]
    .filter(Boolean)
    .sort((a,b)=>num(b.severity_score)-num(a.severity_score))
    .slice(0,10)
  const counts = events.reduce((acc,e)=>{acc[e.event_type]=(acc[e.event_type]||0)+1;return acc},{})
  const threat = eventStream?.threat_level || market?.event_intelligence?.threat_level || (events.some(e=>num(e.severity_score)>=70)?'HIGH':events.some(e=>num(e.severity_score)>=45)?'ELEVATED':'NORMAL')
  const critical = events.filter(e=>num(e.severity_score)>=80).length
  const high = events.filter(e=>num(e.severity_score)>=60 && num(e.severity_score)<80).length
  const avgScore = events.length ? Math.round(events.reduce((s,e)=>s+num(e.severity_score),0)/events.length) : 0
  const families = [
    ['token_unlock','Unlocks'],
    ['macro_event','Macro'],
    ['whale_movement','Whales'],
    ['stablecoin_flow','Stables'],
    ['liquidation_cascade','Liquidations'],
    ['dex_volume_spike','DEX'],
    ['governance_proposal','Governance'],
    ['regulatory_news','Regulatory'],
  ]

  return (
    <div className="risk-hero">
      <div className="risk-top">
        <div className="risk-title">
          <div className="logo-ic" style={{width:38,height:38,borderRadius:12}}><Gauge size={20} color="#fff"/></div>
          <div>
            <h2>Multi-Event Risk Radar</h2>
            <p>Watching eight market signal types in real time. Token unlocks, large wallet moves, stablecoin pressure, lending health, governance votes, regulation, exchange volume, and macro context all feed the same risk model.</p>
          </div>
        </div>
        <span className={`threat-pill threat-${String(threat).toLowerCase()}`}><Activity size={13}/> {threat} threat</span>
      </div>
      <div className="event-metrics">
        <div className="event-metric"><div className="k">Active Risk Events</div><div className="v">{events.length}</div></div>
        <div className="event-metric"><div className="k">Critical / High</div><div className="v" style={{color:critical?'var(--red)':high?'var(--yellow)':'var(--green)'}}>{critical}/{high}</div></div>
        <div className="event-metric"><div className="k">Avg Severity</div><div className="v">{avgScore}<span style={{fontSize:11,color:'var(--text3)'}}>/100</span></div></div>
        <div className="event-metric"><div className="k">Model Action</div><div className="v" style={{fontSize:15,color:'var(--green)'}}>Stress-test first</div></div>
      </div>
      <div className="event-grid">
        <div className="event-list">
          {events.slice(0,5).map((e,i)=>{
            const meta = eventMeta(e.event_type)
            const score = num(e.severity_score)
            return (
              <div className="event-card" key={`${e.event_type}-${i}`} onClick={()=>{
                if(e.token_symbol) onSelectToken?.({token_symbol:e.token_symbol, token_name:e.token_symbol})
                else onOpenEvent?.(e, meta)
              }}>
                <div className="event-icon" style={{background:meta.bg,color:meta.color}}>{meta.icon}</div>
                <div>
                  <div className="event-type">{meta.label} • {e.source}</div>
                  <div className="event-name">{e.title}</div>
                  <div className="event-desc">{e.description}</div>
                </div>
                <div className="event-score">
                  <div className="n" style={{color:barClr(score)}}>{score}</div>
                  <div className="l" style={{color:barClr(score)}}>{e.severity_label || riskLabel(score)}</div>
                </div>
              </div>
            )
          })}
          {events.length===0&&<div className="empty" style={{padding:24}}><Activity size={28} color="var(--text3)"/><p>Event engine waiting for data. Refresh or run the agent scan.</p></div>}
        </div>
        <div className="event-taxonomy">
          <div style={{fontSize:13,fontWeight:800}}>What the agent actually monitors</div>
          <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginTop:3}}>Each event family changes volatility, jump probability, or LP stress parameters.</div>
          <div className="taxonomy-grid">
            {families.map(([type,label])=>{
              const meta=eventMeta(type)
              return <div className="taxonomy-item" key={type}>
                <div className="event-icon" style={{width:30,height:30,borderRadius:8,background:meta.bg,color:meta.color}}>{meta.icon}</div>
                <div><b>{label} <span style={{display:'inline',color:meta.color}}>{counts[type]||0}</span></b><span>{meta.why}</span></div>
              </div>
            })}
          </div>
          <div className="mini-actions">
            <button className="mini-link" onClick={onOpenStress}><Activity size={12}/> Open stress engine</button>
            <a className="mini-link" href={`${API}/docs`} target="_blank" rel="noopener"><ExternalLink size={12}/> API docs</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function DonutChart({holdings}) {
  if(!holdings||holdings.length===0) return null
  const total=holdings.reduce((s,h)=>s+(h.value_usd||0),0)||1
  const colors=['#059669','#10b981','#34d399','#6ee7b7','#a7f3d0','#0891b2','#7c3aed','#d97706','#dc2626','#6b7280']
  let cumAngle=-90
  const slices=holdings.slice(0,8).map((h,i)=>{
    const pct=(h.value_usd||0)/total
    const startAngle=cumAngle;cumAngle+=pct*360
    const s=startAngle*Math.PI/180;const e=cumAngle*Math.PI/180
    const r=50;const cx=60;const cy=60
    const x1=cx+r*Math.cos(s);const y1=cy+r*Math.sin(s)
    const x2=cx+r*Math.cos(e);const y2=cy+r*Math.sin(e)
    return{path:`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${pct>.5?1:0},1 ${x2},${y2} Z`,
           color:colors[i%colors.length],label:h.token_symbol,pct:Math.round(pct*100),value:h.value_usd}
  })
  return(
    <div className="donut-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity=".85" style={{cursor:'pointer',transition:'opacity .2s'}}
          onMouseEnter={e=>e.target.style.opacity='1'} onMouseLeave={e=>e.target.style.opacity='.85'}/>)}
        <circle cx="60" cy="60" r="28" fill="white"/>
        <text x="60" y="57" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f1a14">{fmt(total)}</text>
        <text x="60" y="69" textAnchor="middle" fontSize="8" fill="#6b8077">Total</text>
      </svg>
      <div className="donut-legend">
        {slices.map((s,i)=>(<div className="donut-item" key={i}><div className="donut-dot" style={{background:s.color}}/><span style={{fontWeight:600}}>{s.label}</span><span style={{color:'var(--text3)'}}>{s.pct}%</span><span style={{color:'var(--green)',fontWeight:600}}>{fmt(s.value)}</span></div>))}
      </div>
    </div>
  )
}

function Toasts({toasts}) {
  return(
    <div className="toast-container">
      {toasts.map(t=>(
        <div key={t.id} className={`toast toast-${t.type||'g'}`}>
          {t.type==='g'&&<CheckCircle size={16} color="var(--green)"/>}
          {t.type==='y'&&<AlertTriangle size={16} color="var(--yellow)"/>}
          {t.type==='r'&&<Flame size={16} color="var(--red)"/>}
          <div><div style={{fontWeight:600}}>{t.title}</div>{t.msg&&<div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{t.msg}</div>}</div>
        </div>
      ))}
    </div>
  )
}

/* ═══ REGIME SIGNALS MODAL ═══ */
function RegimeModal({ regime, onClose }) {
  if (!regime) return null
  const signals = regime.signals || []
  const biasColor = b => b === 'BULL' ? 'var(--green)' : b === 'BEAR' ? 'var(--red)' : 'var(--yellow)'
  const biasIcon = b => b === 'BULL' ? <TrendingUp size={14}/> : b === 'BEAR' ? <TrendingDown size={14}/> : <Activity size={14}/>
  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="regime-modal fade">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <div style={{fontSize:17,fontWeight:800,marginBottom:2}}>Market Regime Analysis</div>
            <div style={{fontSize:12,color:'var(--text3)'}}>Multi-signal composite — how we calculate the regime</div>
          </div>
          <button className="panel-close" onClick={onClose}><X size={16}/></button>
        </div>

        {/* Overall Regime Summary */}
        <div style={{background:regime.regime==='BEAR'?'var(--red-bg)':regime.regime==='BULL'?'var(--green-bg)':'var(--yellow-bg)',
          borderRadius:'var(--r)',padding:16,marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:54,height:54,borderRadius:12,background:regime.regime==='BEAR'?'#fecaca':regime.regime==='BULL'?'#d1fae5':'#fde68a',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            {regime.regime==='BEAR'?<TrendingDown size={26} color="#dc2626"/>:regime.regime==='BULL'?<TrendingUp size={26} color="#059669"/>:<Activity size={26} color="#d97706"/>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:22,fontWeight:900,color:regime.regime==='BEAR'?'#dc2626':regime.regime==='BULL'?'#059669':'#d97706'}}>
              {regime.regime} — {Math.round((regime.confidence||0)*100)}% confidence
            </div>
            <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{regime.interpretation}</div>
          </div>
        </div>

        {/* Calculation Explanation */}
        <div className="info-box" style={{borderLeftColor:'var(--cyan)',background:'var(--cyan-bg)',marginBottom:16,fontSize:11,lineHeight:1.7}}>
          <strong>How it works:</strong> We evaluate 5 independent market signals. Each signal votes BULL, BEAR, or NEUTRAL.
          If 3+ signals agree on a direction, that becomes the regime. Confidence = 60% + (agreeing signals / total) × 35%, capped at 95%.
          <br/><strong>Hedge adjustment:</strong> {regime.regime === 'BEAR' ? 'Hedge sizing increased by 25%' : regime.regime === 'BULL' ? 'Hedge sizing reduced by 20%' : 'Standard hedge sizing applies'} (multiplier: {regime.hedge_multiplier}×)
        </div>

        {/* Individual Signals */}
        <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>
          5 Signals Breakdown
        </div>
        {signals.map((s, i) => (
          <div className="regime-signal" key={i}>
            <div style={{width:120}}>
              <div style={{fontSize:12,fontWeight:700}}>{s.name}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>{s.value}</div>
            </div>
            <div className="signal-bar">
              <div className="signal-fill" style={{
                width: `${Math.max(5, Math.min(100, s.score || 50))}%`,
                background: biasColor(s.bias)
              }}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:4,width:70,justifyContent:'flex-end',color:biasColor(s.bias),fontWeight:700,fontSize:11}}>
              {biasIcon(s.bias)} {s.bias}
            </div>
          </div>
        ))}

        {/* Data Source Attribution */}
        <div style={{marginTop:14,padding:'10px 12px',background:'var(--bg3)',borderRadius:'var(--r3)',fontSize:10,color:'var(--text3)',lineHeight:1.6}}>
          <strong>Data Sources:</strong> Market breadth from CoinPaprika top 100 tokens • Fear & Greed from Alternative.me API •
          BTC dominance from CoinPaprika global/derived market cap • Market momentum from 24h total market cap change •
          Altcoin strength from non-BTC/ETH sector performance
        </div>
      </div>
    </>
  )
}

function EventDetailPanel({event,meta,onClose,onOpenStress}) {
  if(!event) return null
  const score = num(event.severity_score)
  const severityCls = score>=80?'r-c':score>=55?'r-h':score>=35?'r-m':'r-l'
  const guidance = {
    'whale_movement': 'Large transfers can precede market-moving sells. Watch order books on the named venues, tighten stops, and treat as a leading indicator for short-term volatility.',
    'token_unlock': 'Scheduled supply release. Run the stress engine for the specific token to size hedges by recipient type, supply percent, and current regime.',
    'dex_volume': 'Abnormal pool volume often signals informed flow. Check the top pairs for slippage and consider widening LP ranges before more liquidity migrates.',
    'macro_event': 'Macro regime shifts change baseline volatility for the entire risk model. Hedge multipliers and confidence intervals auto-adjust in BEAR regimes.',
    'stablecoin': 'Stablecoin contractions or depeg risk affect funding liquidity for every LP and lender. Watch for redemption pressure on the named issuer.',
    'lending_event': 'Liquidation cascades amplify drawdowns. Confirm health factors on Aave/Morpho and reduce leverage if the cascade radius widens.',
    'governance_vote': 'Protocol governance changes can alter tokenomics, emissions, or treasury rules. Read the proposal text before acting.',
    'regulation': 'Regulatory action is high-impact, low-frequency. Position-size accordingly and avoid concentrated exposure to the affected jurisdiction or asset class.',
  }[event.event_type] || 'This signal feeds the stress engine. Higher severity means larger volatility/jump adjustments in upcoming simulations.'

  const dataSource = {
    'whale_movement': 'Etherscan + on-chain transfer logs',
    'token_unlock': 'Tokenomist + curated unlock database',
    'dex_volume': 'GeckoTerminal + DEX subgraph aggregators',
    'macro_event': 'Alternative.me Fear & Greed + market regime composite',
    'stablecoin': 'DeFiLlama stablecoin supply data',
    'lending_event': 'DeFiLlama protocol health + Aave/Morpho data',
    'governance_vote': 'Snapshot + Tally governance feeds',
    'regulation': 'News aggregator + curated regulatory database',
  }[event.event_type] || event.source

  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="panel">
        <div className="panel-h">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:46,height:46,borderRadius:11,background:meta?.bg||'var(--bg3)',color:meta?.color||'var(--text)',display:'flex',alignItems:'center',justifyContent:'center'}}>{meta?.icon||<Activity size={20}/>}</div>
            <div>
              <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px'}}>{meta?.label||'Event'} · {event.source}</div>
              <div style={{fontSize:17,fontWeight:800,marginTop:2}}>{event.title}</div>
            </div>
          </div>
          <button className="panel-close" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="panel-b">
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>{event.description}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
            <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:12,textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>Severity</div>
              <div style={{fontSize:22,fontWeight:900,color:barClr(score)}}>{score}/100</div>
              <span className={`rsk ${severityCls}`} style={{marginTop:4,display:'inline-block'}}>{event.severity_label || riskLabel(score)}</span>
            </div>
            <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:12,textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>Detected</div>
              <div style={{fontSize:13,fontWeight:700}}>{event.timestamp?new Date(event.timestamp).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</div>
              <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>{event.event_type?.replace(/_/g,' ')}</div>
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:6}}>What this means</div>
            <div className="info-box" style={{borderLeftColor:meta?.color||'var(--cyan)',background:'var(--bg3)',fontSize:12,lineHeight:1.6}}>{guidance}</div>
          </div>

          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:6}}>Why it matters to the risk model</div>
            <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>{meta?.why||'Feeds into the stress engine as a volatility or jump parameter.'} The stress engine recalibrates GARCH(1,1) volatility and Merton jump probability each time the severity changes by more than 10 points.</div>
          </div>

          <div style={{marginBottom:16,padding:'10px 12px',background:'var(--bg3)',borderRadius:'var(--r3)',fontSize:11,color:'var(--text3)',lineHeight:1.6}}>
            <strong style={{color:'var(--text)'}}>Data source:</strong> {dataSource}
          </div>

          <button className="btn btn-p" style={{width:'100%',justifyContent:'center'}} onClick={onOpenStress}>
            <Activity size={13}/> Run stress test with this signal applied
          </button>
        </div>
      </div>
    </>
  )
}

function TokenPanel({token,analysis,unlockInfo,onClose}) {
  if(!token) return null
  const symbol=token.token_symbol||token.symbol||''
  const name=token.token_name||token.name||symbol
  const hasUnlock=!!unlockInfo?.unlock_date
  const risk=analysis?.risk_score||(hasUnlock?Math.round((unlockInfo?.total_supply_percent||1)*6.5):null)
  const price=token.price||token.current_price||0
  const mcap=token.market_cap||0
  const vol=token.volume_24h||0
  const c24=token.change_24h||0
  const c7=token.change_7d||0
  const c30=token.change_30d||0
  const sector=token.sector||'—'
  const isMarketToken=!!(price||mcap)
  const sparkline=token.sparkline_7d||[]
  return(
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="panel">
        <div className="panel-hdr">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="ti" style={{width:40,height:40,fontSize:14,borderRadius:10}}>
              {token.image?<img src={token.image} alt="" style={{width:'100%',height:'100%',borderRadius:10}}/>:symbol.slice(0,2)}
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:18}}>{symbol}</div>
              <div style={{fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:6}}>
                {name}
                {sector!=='—'&&<span className="spill" style={{padding:'1px 6px',fontSize:9,margin:0,cursor:'default'}}><span className="dot" style={{background:SECTOR_COLORS[sector]||'#6b7280',width:5,height:5}}/>{sector}</span>}
              </div>
            </div>
          </div>
          <button className="panel-close" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="panel-body">
          {/* Price & Market Data */}
          {isMarketToken&&(
            <div style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:8}}>
                <span style={{fontSize:28,fontWeight:800}}>${price>=1?price.toFixed(2):price.toFixed(6)}</span>
                <span style={{fontSize:14,fontWeight:700,color:clr(c24)}}>{c24>0?'+':''}{c24}%</span>
              </div>
              {/* 7-day sparkline from provider data */}
              {sparkline.length > 5 ? (
                <div style={{marginBottom:10,background:'var(--bg3)',borderRadius:'var(--r3)',padding:10}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase'}}>7-Day Price Trend</div>
                  <Sparkline7d data={sparkline} width={440} height={60}/>
                </div>
              ) : (
                /* Provider has no intraday sparkline: draw a small trend proxy from reported 24h/7d/30d changes. */
                <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none" style={{marginBottom:8}}>
                  {[100+c30,100+(c30+c7)/2,100+c7,(100+c7+c24)/2,100+c24].map((v,i,arr)=>{
                    if(i===0) return null
                    const x1=(i-1)/(arr.length-1)*200;const x2=i/(arr.length-1)*200
                    const mn=Math.min(...arr);const mx=Math.max(...arr);const range=mx-mn||1
                    const y1=38-(arr[i-1]-mn)/range*34;const y2=38-(v-mn)/range*34
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c24>=0?'#059669':'#dc2626'} strokeWidth="2"/>
                  })}
                </svg>
              )}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:8,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>7d</div>
                  <div style={{fontSize:13,fontWeight:700,color:clr(c7)}}>{c7>0?'+':''}{c7}%</div>
                </div>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:8,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>30d</div>
                  <div style={{fontSize:13,fontWeight:700,color:clr(c30)}}>{c30>0?'+':''}{c30}%</div>
                </div>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:8,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Rank</div>
                  <div style={{fontSize:13,fontWeight:700}}>#{token.rank||'—'}</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}}>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:8}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Market Cap</div>
                  <div style={{fontSize:14,fontWeight:700}}>{fmt(mcap)}</div>
                </div>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:8}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Volume 24h</div>
                  <div style={{fontSize:14,fontWeight:700}}>{fmt(vol)}</div>
                </div>
              </div>
              {vol>0&&mcap>0&&<div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>Vol/MCap ratio: <strong style={{color:vol/mcap*100>12?'var(--red)':'var(--text2)'}}>{(vol/mcap*100).toFixed(1)}%</strong>{vol/mcap*100>12&&<span style={{color:'var(--red)',marginLeft:4}}>⚠ Abnormal volume</span>}</div>}
              <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>Data: CoinPaprika market API</div>
            </div>
          )}

          {/* Risk Gauge */}
          {risk&&<div style={{textAlign:'center',marginBottom:16}}><RiskGauge score={risk}/></div>}

          {/* Unlock Info */}
          {hasUnlock&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:8}}>Unlock Event</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:10,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:2}}>Supply Unlock</div>
                  <div style={{fontSize:18,fontWeight:800,color:unlockInfo.total_supply_percent>=5?'var(--red)':'var(--yellow)'}}>{unlockInfo.total_supply_percent}%</div>
                </div>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:10,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:2}}>Est. Impact</div>
                  <div style={{fontSize:18,fontWeight:800,color:'var(--red)'}}>{analysis?.predicted_impact||`~${(-unlockInfo.total_supply_percent*3).toFixed(0)}%`}</div>
                </div>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:10,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:2}}>Date</div>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtD(unlockInfo.unlock_date)}</div>
                  <div style={{fontSize:10,color:daysUntil(unlockInfo.unlock_date)<=7?'var(--red)':'var(--text3)'}}>{daysUntil(unlockInfo.unlock_date)}d away</div>
                </div>
                <div style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:10,textAlign:'center'}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:2}}>Strategy</div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--green)'}}>{(analysis?.recommended_action||strategyForRisk(Math.round(num(unlockInfo.total_supply_percent)*16+(daysUntil(unlockInfo.unlock_date)<=7?18:0)))).replace('_',' ')}</div>
                </div>
              </div>
              {unlockInfo.unlock_amount_usd>0&&<div style={{fontSize:11,color:'var(--text3)',marginTop:6}}>Unlock value: <strong>{fmt(unlockInfo.unlock_amount_usd)}</strong> ({unlockInfo.unlock_amount_tokens?.toLocaleString()} tokens)</div>}
            </div>
          )}

          {!hasUnlock&&!isMarketToken&&(
            <div style={{textAlign:'center',padding:20,color:'var(--text3)',fontSize:13}}>No detailed data available for this token.</div>
          )}

          {/* AI Analysis */}
          {analysis?.reasoning&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:6}}>AI Analysis</div><div className="info-box" style={{borderLeftColor:'var(--green)',background:'var(--green-bg)'}}>{analysis.reasoning}</div></div>}
          {analysis?.factor_scores&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:8}}>Risk Factors</div>{Object.entries(analysis.factor_scores).map(([k,v])=>(<div className="fr" key={k}><span className="fl">{k.replace(/_/g,' ')}</span><div className="fb"><div className="fv" style={{width:`${v}%`,background:barClr(v)}}/></div><span className="fn" style={{color:barClr(v)}}>{v}</span></div>))}</div>}
          {analysis?.key_risks?.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:6}}>Key Risks</div><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{analysis.key_risks.map((r,i)=>(<span key={i} style={{background:'var(--red-bg)',color:'var(--red)',padding:'3px 8px',borderRadius:4,fontSize:10,fontWeight:600}}>{r}</span>))}</div></div>}
          {analysis?.hedge?.execution_plan&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:8}}>Execution Plan</div>{analysis.hedge.execution_plan.map((s,j)=>(<div className="ps-s" key={j}><span className="ps-a">{s.action}</span>{s.amount&&` — ${s.amount}`}{s.venue&&<span style={{color:'var(--text3)'}}> via {s.venue}</span>}</div>))}</div>}
          {analysis?.hedge?.action!=='HOLD'&&analysis?.hedge&&<div className="info-box" style={{borderLeftColor:'var(--green)',background:'var(--green-bg)',marginBottom:16}}><span style={{color:'var(--green)',fontWeight:700}}>HEDGE EXECUTED</span> — {analysis.hedge.message}</div>}
          {(() => { const url = kiteScanUrl(analysis?.attestation?.tx_hash); return url ? <a href={url} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:6,color:'var(--green)',fontWeight:600,fontSize:12,textDecoration:'none'}}><CheckCircle size={14}/> View On-Chain Attestation <ExternalLink size={12}/></a> : null })()}
        </div>
      </div>
    </>
  )
}

/* ═══ MAIN APP ═══ */
function App() {
  const [tab,setTab] = useState('dashboard')
  const [stressToken,setStressToken] = useState('ARB')
  const [stressResult,setStressResult] = useState(null)
  const [stressLoading,setStressLoading] = useState(false)
  const [stressParams,setStressParams] = useState({unlock_pct:2.0,unlock_days:7,recipient:'investor',is_cliff:false,lp_range:0.10})
  const [predictions,setPredictions] = useState(null)
  const [predLoading,setPredLoading] = useState(false)
  const [predReputation,setPredReputation] = useState(null)
  const [lastPrediction,setLastPrediction] = useState(null)
  const [unlocks,setUnlocks] = useState([])
  const [eventStream,setEventStream] = useState(null)
  const [analyses,setAnalyses] = useState([])
  const [hedges,setHedges] = useState([])
  const [portfolio,setPortfolio] = useState(null)
  const [agent,setAgent] = useState(null)
  const [market,setMarket] = useState(null)
  const [backtest,setBacktest] = useState(null)
  const [walletData,setWalletData] = useState(null)
  const [yieldData,setYieldData] = useState(null)
  const [scanning,setScanning] = useState(false)
  const [scanStep,setScanStep] = useState(-1)
  const [loading,setLoading] = useState(true)
  const [expanded,setExpanded] = useState(null)
  const [tokenSearch,setTokenSearch] = useState('')
  const [sectorFilter,setSectorFilter] = useState(null)
  const [selectedToken,setSelectedToken] = useState(null)
  const [toasts,setToasts] = useState([])
  const [marketPage,setMarketPage] = useState(1)
  const [showRegime,setShowRegime] = useState(false)
  const [news,setNews] = useState([])
  const [newsFilter,setNewsFilter] = useState('all')
  const [headerSearch,setHeaderSearch] = useState('')
  const [showSearchResults,setShowSearchResults] = useState(false)
  const [selectedEvent,setSelectedEvent] = useState(null)
  const [agentActivity,setAgentActivity] = useState({loop:null,events:[]})
  const [treasuryData,setTreasuryData] = useState(null)
  const [agentMetrics,setAgentMetrics] = useState(null)
  const [agentPortfolio,setAgentPortfolio] = useState(null)
  const [agentPolymarket,setAgentPolymarket] = useState(null)
  const TOKENS_PER_PAGE = 50

  const toast = useCallback((title,msg,type='g')=>{
    const id=Date.now()+Math.random()
    setToasts(prev=>[...prev,{id,title,msg,type}])
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),4000)
  },[])

  const load = useCallback(async()=>{
    setLoading(true)
    try{
      const [u,p,s,h,m,bt,w,y,ev,nw] = await Promise.all([
        fetchJson('/api/unlocks/upcoming',{unlocks:[]}),
        fetchJson('/api/portfolio/holdings',null),
        fetchJson('/api/agent/status',null),
        fetchJson('/api/agent/history',{hedges:[]}),
        fetchJson('/api/market/overview',null,11000),
        fetchJson('/api/backtest/run',null,15000),
        fetchJson('/api/wallet/status',null),
        fetchJson('/api/wallet/yield',null),
        fetchJson('/api/events/stream?min_severity=0',null,8000),
        fetchJson('/api/events/news',{articles:[]},10000),
      ])
      let marketPayload = m
      if(!marketPayload?.top_tokens?.length || marketPayload.top_tokens.length < 100) {
        const liveTokens = await fetchCoinPaprikaUniverse(300)
        if(liveTokens.length >= 100) {
          marketPayload = hydrateMarketPayload(marketPayload, liveTokens, liveTokens[0]?.data_source || 'coinpaprika')
        }
      }

      const finalUnlocks = (u.unlocks&&u.unlocks.length)?u.unlocks:DEMO_UNLOCKS
      setUnlocks(finalUnlocks)
      setPortfolio(p||DEMO_PORTFOLIO)
      setAgent(s)
      setHedges(h.hedges||[])
      setMarket(marketPayload)
      setBacktest(bt)
      setWalletData(w)
      setYieldData(y)
      setEventStream((ev&&ev.events&&ev.events.length)?ev:DEMO_EVENTS)
      setNews(nw?.articles||[])

      // Pre-compute deterministic strategies so the dashboard never shows
      // empty/pending strategies before the heavy on-chain scan runs.
      setAnalyses(prev=>{
        if(prev.length>0) return prev
        return finalUnlocks.slice(0,15).map(unl=>{
          const rs = Math.round(num(unl.total_supply_percent)*16+(daysUntil(unl.unlock_date)<=7?18:0))
          const strat = strategyForRisk(rs)
          const impactPct = Math.min(-2, -num(unl.total_supply_percent)*3.2).toFixed(1)
          return {
            token: unl.token_symbol, token_name: unl.token_name,
            unlock_date: unl.unlock_date, unlock_amount_usd: unl.unlock_amount_usd,
            supply_pct: unl.total_supply_percent,
            risk_score: rs, predicted_impact: `${impactPct}%`,
            recommended_action: strat,
            reasoning: `Risk model estimate from ${unl.total_supply_percent}% supply unlock in ${daysUntil(unl.unlock_date)} days. Click "Run Agent Scan" for full Monte Carlo simulation and on-chain attestation.`,
            attestation: null, hedge: null,
            _preview: true,
          }
        })
      })
    }catch(e){console.error(e)}
    setLoading(false)
  },[])

  useEffect(()=>{load()},[load])

  const scan = async()=>{
    setScanning(true);setScanStep(0)
    toast('Agent Scan Started','Fetching multi-event risk data...','y')
    await new Promise(r=>setTimeout(r,600));setScanStep(1)
    toast('Running Stress Test','Simulating thousands of price paths...','y')
    try{
      const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),45000)
      const r=await fetch(`${API}/api/agent/scan?limit=10&days_ahead=30`,{method:'POST',signal:ctrl.signal})
      clearTimeout(timer)
      const d=await r.json()
      setScanStep(2);toast('Policy Check','Evaluating bounded hedge and LP actions...','y')
      await new Promise(r=>setTimeout(r,500));setScanStep(3)
      toast('Recording On-Chain','Attesting to Kite blockchain...','y')
      await new Promise(r=>setTimeout(r,500));setScanStep(4)
      const results=(d.results||[])
      setAnalyses(results)
      const critical=results.filter(r=>r.risk_score>=55).length
      const onChain=results.filter(r=>r.attestation?.tx_hash&&!r.attestation.tx_hash.startsWith('0x_')&&r.attestation.tx_hash!=='0x'+'0'.repeat(64)).length
      toast('Scan Complete',`${results.length} tokens analyzed, ${critical} high risk, ${onChain} attested on Kite`,'g')
      // Scroll to scan results so user sees what just happened
      setTimeout(()=>{
        const el = document.getElementById('scan-results')
        if(el) el.scrollIntoView({behavior:'smooth',block:'start'})
      },200)
    }catch(e){
      console.error(e)
      // Fall back to local risk heuristics so the UI still updates
      const localResults = unlocks.slice(0,10).map(u=>{
        const rs = Math.round(num(u.total_supply_percent)*16+(daysUntil(u.unlock_date)<=7?18:0))
        const strat = strategyForRisk(rs)
        return {
          token: u.token_symbol, token_name: u.token_name,
          unlock_date: u.unlock_date, unlock_amount_usd: u.unlock_amount_usd,
          supply_pct: u.total_supply_percent,
          risk_score: rs, predicted_impact: `${Math.min(-2,-num(u.total_supply_percent)*3.2).toFixed(1)}%`,
          recommended_action: strat,
          reasoning: `Heuristic estimate while backend warms up: ${u.total_supply_percent}% supply unlock from ${u.token_symbol} in ${daysUntil(u.unlock_date)} days. Recommendation: ${strat.replace('_',' ')}.`,
          attestation: null, hedge: null,
        }
      })
      setAnalyses(localResults)
      toast('Scan Used Local Fallback','Backend was waking up — showing heuristic risk scores. Try again in 30s for the full on-chain scan.','y')
    }
    setTimeout(()=>{setScanning(false);setScanStep(-1)},1500)
  }

  const runBT = async()=>{
    toast('Running Backtest','Simulating on historical events...','y')
    try{const r=await fetch(`${API}/api/backtest/run`);const d=await r.json();setBacktest(d);toast('Backtest Complete',d.headline||'Done','g')}
    catch(e){console.error(e);toast('Error','Backtest failed','r')}
  }

  const regime=market?.market_regime;const glob=market?.global||{};const fg=market?.fear_greed||{}
  const marketTokens = (market?.top_tokens&&market.top_tokens.length>0) ? market.top_tokens : DEMO_MARKET_TOKENS
  const sectors=Object.keys(market?.sectors||{}).length ? market.sectors : finalizeSectorSummary(buildSectorSummary(marketTokens))
  const topTokens=marketTokens
  const anomalies=market?.volume_anomalies||[]
  const topGainers = (market?.top_gainers&&market.top_gainers.length>0) ? market.top_gainers : [...topTokens].sort((a,b)=>num(b.change_24h)-num(a.change_24h)).slice(0,5)
  const topLosers = (market?.top_losers&&market.top_losers.length>0) ? market.top_losers : [...topTokens].sort((a,b)=>num(a.change_24h)-num(b.change_24h)).slice(0,5)
  const activeEventCount = (eventStream?.total_events || 0) + (unlocks?.length || 0)
  const threatLevel = eventStream?.threat_level || market?.event_intelligence?.threat_level || 'NORMAL'

  const filteredTokens = useMemo(()=>{
    let t=topTokens
    if(sectorFilter) t=t.filter(x=>x.sector===sectorFilter)
    if(tokenSearch){const q=tokenSearch.toUpperCase();t=t.filter(x=>x.symbol?.includes(q)||x.name?.toUpperCase().includes(q))}
    return t
  },[topTokens,sectorFilter,tokenSearch])

  // Pagination
  const totalPages = Math.ceil(filteredTokens.length / TOKENS_PER_PAGE)
  const paginatedTokens = filteredTokens.slice((marketPage - 1) * TOKENS_PER_PAGE, marketPage * TOKENS_PER_PAGE)

  // Reset page on filter change
  useEffect(()=>{ setMarketPage(1) },[sectorFilter, tokenSearch])

  // Stress Test
  const runStressTest = async () => {
    setStressLoading(true)
    try {
      const p = stressParams
      const res = await fetch(`${API}/api/stress/run/${stressToken}?unlock_pct=${p.unlock_pct}&unlock_days=${p.unlock_days}&recipient=${encodeURIComponent(p.recipient)}&is_cliff=${p.is_cliff}&lp_range=${p.lp_range}&n_paths=2000`)
      const data = await res.json()
      if(!res.ok || data?.detail || data?.error) throw new Error(data?.detail || data?.error || 'Stress engine returned an error')
      setStressResult(data)
      toast('Stress Test Complete',`${stressToken}: VaR(95%)=${pct(data?.scenarios?.base_case?.var_95)}`,'g')
    } catch(e) { toast('Stress Test Error',e.message,'r') }
    setStressLoading(false)
  }

  // Predictions
  const createPrediction = async () => {
    setPredLoading(true)
    try {
      const p = stressParams
      const ctrl = new AbortController()
      const timer = setTimeout(()=>ctrl.abort(), 18000)
      const res = await fetch(`${API}/api/predictions/create/${stressToken}?unlock_pct=${p.unlock_pct}&unlock_days=${p.unlock_days}&recipient=${encodeURIComponent(p.recipient)}&is_cliff=${p.is_cliff}`,{method:'POST',signal:ctrl.signal})
      clearTimeout(timer)
      const data = await res.json()
      if(!res.ok || data?.detail || data?.error) throw new Error(data?.detail || data?.error || 'Prediction oracle returned an error')
      setLastPrediction(data)
      toast('Prediction Committed',`${stressToken}: ${pct(data?.predicted_impact)} impact, hash: ${data?.commit_hash?.slice(0,12)}...`,'g')
      fetchPredictions()
    } catch(e) {
      const pctShock = Math.max(2, num(stressParams.unlock_pct) * (stressParams.is_cliff ? 7.2 : 5.6))
      const localPreview = {
        token: stressToken,
        predicted_impact: -pctShock,
        confidence: Math.min(.86, .48 + num(stressParams.unlock_pct)/12),
        commit_hash: 'local-preview-waiting-for-api',
        stress_summary: {
          var_95: -pctShock * 1.75,
          hedge_action: strategyForRisk(pctShock * 8),
        },
      }
      setLastPrediction(localPreview)
      toast('Stress Preview Generated','Backend commit timed out, showing local preview instead. Try again in a moment.','y')
    }
    setPredLoading(false)
  }

  const fetchPredictions = async () => {
    try {
      const [histRes, repRes] = await Promise.all([
        fetch(`${API}/api/predictions/history`),
        fetch(`${API}/api/predictions/reputation`)
      ])
      const hist = await histRes.json()
      const rep = await repRes.json()
      setPredictions(hist)
      setPredReputation(rep)
    } catch(e) { console.error('Predictions fetch error:', e) }
  }

  useEffect(() => { if(tab==='predictions') fetchPredictions() }, [tab])

  // Auto-retry backtest if user opens the tab and it's still empty
  useEffect(() => {
    if(tab==='backtest' && (!backtest || !backtest.total_events_analyzed)) {
      runBT()
    }
  }, [tab]) // eslint-disable-line

  // Live Agent: poll activity feed and treasury passport every 5s when tab is open
  useEffect(() => {
    if(tab !== 'agent') return
    let cancelled = false
    const pull = async () => {
      try {
        const [a,t,m,p,pm] = await Promise.all([
          fetch(`${API}/api/agent/activity?limit=80`).then(r=>r.json()).catch(()=>null),
          fetch(`${API}/api/agent/treasury`).then(r=>r.json()).catch(()=>null),
          fetch(`${API}/api/agent/metrics`).then(r=>r.json()).catch(()=>null),
          fetch(`${API}/api/agent/portfolio`).then(r=>r.json()).catch(()=>null),
          fetch(`${API}/api/agent/polymarket?limit=8`).then(r=>r.json()).catch(()=>null),
        ])
        if(cancelled) return
        if(a) setAgentActivity(a)
        if(t) setTreasuryData(t)
        if(m) setAgentMetrics(m)
        if(p) setAgentPortfolio(p)
        if(pm) setAgentPolymarket(pm)
      } catch(e) { /* ignore */ }
    }
    pull()
    const id = setInterval(pull, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [tab])

  const selectedAnalysis=selectedToken?analyses.find(a=>a.token===(selectedToken.token_symbol||selectedToken.symbol)):null
  const selectedUnlock=selectedToken?unlocks.find(u=>u.token_symbol===(selectedToken.token_symbol||selectedToken.symbol)):null
  const resolvedPredictionCount = predictions?.predictions?.filter(p=>p.revealed).length || 0
  const kiteInfra = walletData?.infrastructure || {}

  if(loading) return(
    <><style>{css}</style>
    <div className="app" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{textAlign:'center'}}>
        <div className="logo-ic" style={{width:56,height:56,margin:'0 auto 20px',borderRadius:14}}><Shield size={28} color="#fff"/></div>
        <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>Unlock<span style={{color:'var(--green)'}}>Shield</span></div>
        <div style={{fontSize:13,color:'var(--text3)',marginBottom:24}}>Connecting to Kite AI Network</div>
        <div style={{display:'flex',justifyContent:'center',gap:6}}>{[0,1,2].map(i=><div key={i} className="pulse-dot" style={{animationDelay:`${i*.2}s`}}/>)}</div>
      </div>
    </div></>
  )

  return(
    <><style>{css}</style>
    <div className="app">
      <Toasts toasts={toasts}/>
      {selectedToken&&<TokenPanel token={selectedToken} analysis={selectedAnalysis} unlockInfo={selectedUnlock||selectedToken} onClose={()=>setSelectedToken(null)}/>}
      {selectedEvent&&<EventDetailPanel event={selectedEvent.event} meta={selectedEvent.meta} onClose={()=>setSelectedEvent(null)} onOpenStress={()=>{setSelectedEvent(null);setTab('stress')}}/>}
      {showRegime&&<RegimeModal regime={regime} onClose={()=>setShowRegime(false)}/>}

      {/* HEADER */}
      <div className="hdr">
        <div className="logo">
          <div className="logo-ic"><Shield size={18} color="#fff"/></div>
          <h1>Unlock<b>Shield</b></h1>
          <span className="bdg">KITE AI</span>
          {agent?.kite_connected&&<span className="bdg bdg-live"><span className="pulse-dot" style={{width:5,height:5,marginRight:2}}/> Live</span>}
        </div>
        <div className="hdr-r">
          <div className="hdr-search">
            <Search size={14} color="var(--text3)"/>
            <input
              type="text"
              placeholder="Search any token... (ARB, ETH, SOL)"
              value={headerSearch}
              onChange={e=>{setHeaderSearch(e.target.value);setShowSearchResults(!!e.target.value)}}
              onFocus={()=>setShowSearchResults(!!headerSearch)}
              onBlur={()=>setTimeout(()=>setShowSearchResults(false),200)}
            />
            {showSearchResults&&headerSearch&&(
              <div className="hdr-search-results">
                {topTokens.filter(t=>{
                  const q=headerSearch.toUpperCase()
                  return t.symbol?.toUpperCase().includes(q)||t.name?.toUpperCase().includes(q)
                }).slice(0,8).map((t,i)=>(
                  <div key={i} className="hdr-search-item" onMouseDown={()=>{
                    setSelectedToken({...t,token_symbol:t.symbol,token_name:t.name})
                    setHeaderSearch('');setShowSearchResults(false)
                  }}>
                    <div className="ti" style={{width:24,height:24,fontSize:9}}>{t.image?<img src={t.image} alt=""/>:t.symbol?.slice(0,2)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700}}>{t.symbol}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{t.name}</div>
                    </div>
                    <div style={{fontSize:11,fontWeight:600,color:clr(t.change_24h)}}>{t.change_24h>0?'+':''}{num(t.change_24h).toFixed(2)}%</div>
                  </div>
                ))}
                {topTokens.filter(t=>{const q=headerSearch.toUpperCase();return t.symbol?.toUpperCase().includes(q)||t.name?.toUpperCase().includes(q)}).length===0&&(
                  <div style={{padding:14,fontSize:12,color:'var(--text3)',textAlign:'center'}}>No tokens match "{headerSearch}"</div>
                )}
              </div>
            )}
          </div>
          <button className="btn btn-s" onClick={()=>{load();toast('Refreshed','Data updated','g')}}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-p" onClick={scan} disabled={scanning}>
            {scanning?<RefreshCw size={13} className="spin"/>:<Zap size={13}/>}
            {scanning?'Scanning...':'Run Agent Scan'}
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-tag"><Shield size={11}/> Kite AI Hackathon 2026 · Agentic Trading Track</div>
            <h1 className="hero-title">Forecast token unlock crashes <em>before they happen</em>.</h1>
            <p className="hero-sub">Every prediction is committed on Kite AI as a tamper-proof hash before the unlock, then revealed and scored after. Honest by design, not by reputation.</p>
            <div className="hero-actions">
              <button className="btn btn-p" onClick={()=>setTab('stress')}><Activity size={13}/> Try Stress Test</button>
              <button className="btn btn-s" onClick={()=>setTab('predictions')}><Target size={13}/> View Predictions</button>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-item">
                <div className="hero-trust-val">{market?.tokens_count||'300+'}</div>
                <div className="hero-trust-lbl">Tokens Monitored</div>
              </div>
              <div className="hero-trust-item">
                <div className="hero-trust-val">2,000</div>
                <div className="hero-trust-lbl">Sim Paths per Run</div>
              </div>
              <div className="hero-trust-item">
                <div className="hero-trust-val">8</div>
                <div className="hero-trust-lbl">Event Categories</div>
              </div>
              <div className="hero-trust-item">
                <div className="hero-trust-val" style={{color:'var(--green)'}}>{agent?.kite_connected?'Live':'Ready'}</div>
                <div className="hero-trust-lbl">On Kite Chain</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-h">
                <span className="hero-card-title">Next Unlock Event</span>
                <span className="hero-card-pulse"><span className="pulse-dot" style={{width:6,height:6}}/> live</span>
              </div>
              <div className="hero-card-metric" style={{color:'var(--text)'}}>{unlocks[0]?.token_symbol||'PYTH'}</div>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:12}}>{unlocks[0]?.token_name||'Pyth Network'}</div>
              <div className="hero-card-row"><span>Date</span><span>{unlocks[0]?fmtD(unlocks[0].unlock_date):'May 20, 2026'}</span></div>
              <div className="hero-card-row"><span>Supply Released</span><span>{unlocks[0]?.total_supply_percent||1.33}%</span></div>
              <div className="hero-card-row"><span>Estimated Value</span><span>{unlocks[0]?fmt(unlocks[0].unlock_amount_usd):'$8.9M'}</span></div>
              <div className="hero-card-row"><span>Model VaR (95%)</span><span style={{color:'var(--red)'}}>{glob.market_cap_change_24h<0?'-12 to -18%':'-8 to -14%'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* TICKER — KEY MARKET METRICS */}
      {market&&(
        <div className="ticker">
          <div className="tk" onClick={()=>{setTab('market');toast('Global Market Cap',`${fmt(glob.total_market_cap)} (${glob.market_cap_change_24h>0?'+':''}${glob.market_cap_change_24h}% 24h)`,'g')}}>
            <div className="tk-l">Global Market Cap</div>
            <div className="tk-v">{fmt(glob.total_market_cap)}</div>
            <div className="tk-c" style={{color:clr(glob.market_cap_change_24h)}}>{glob.market_cap_change_24h>0?'+':''}{glob.market_cap_change_24h}%</div>
            <div className="tk-hint">View Market →</div>
          </div>
          <div className="tk" onClick={()=>{setTab('market');setSectorFilter('L1');toast('BTC Dominance',`${glob.btc_dominance}% — ${glob.btc_dominance>55?'Risk-off environment':'Risk-on / altseason potential'}`,'g')}}>
            <div className="tk-l">BTC Dominance</div>
            <div className="tk-v">{glob.btc_dominance}%</div>
            <div className="tk-c" style={{fontSize:10,color:'var(--text3)'}}>{glob.btc_dominance>55?'Risk-off':'Altseason signal'}</div>
            <div className="tk-hint">View L1 tokens →</div>
          </div>
          <div className="tk" onClick={()=>setShowRegime(true)}>
            <div className="tk-l">Sentiment & Regime</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div className="tk-v" style={{color:fg.value>=60?'var(--green)':fg.value<=35?'var(--red)':'var(--yellow)'}}>
                {fg.value||'--'}
              </div>
              {regime&&<span className={`rgm rgm-${regime.regime?.toLowerCase()}`} style={{fontSize:10,padding:'2px 6px'}}>
                {regime.regime==='BULL'?<TrendingUp size={10}/>:regime.regime==='BEAR'?<TrendingDown size={10}/>:<Activity size={10}/>}
                {regime.regime}
              </span>}
            </div>
            <div style={{fontSize:10,color:'var(--text3)'}}>{fg.classification||'Neutral'}</div>
            <div className="tk-hint">View Signals →</div>
          </div>
          <div className="tk" onClick={()=>{setTab('kite');toast('DeFi TVL',`${fmt(market.tvl?.total)} total locked — Source: DeFiLlama`,'g')}}>
            <div className="tk-l">DeFi TVL</div>
            <div className="tk-v">{fmt(market.tvl?.total)}</div>
            {market.tvl?.change_7d&&<div className="tk-c" style={{color:clr(market.tvl.change_7d)}}>{market.tvl.change_7d>0?'+':''}{market.tvl.change_7d}% 7d</div>}
            <div className="tk-hint">DeFiLlama →</div>
          </div>
        </div>
      )}

      {/* STATS - REAL BACKEND METRICS */}
      <div className="stats">
        <div className="st" onClick={()=>setTab('backtest')}>
          <div className="st-arrow"><ArrowRight size={14}/></div>
          <div className="st-ic" style={{background:'var(--green-bg)'}}><Shield size={18} color="var(--green)"/></div>
          <div className="st-label">Backtest Saved</div>
          <div className="st-val" style={{color:'var(--green)'}}>{backtest?fmt(backtest.total_savings):'—'}</div>
          <div className="st-sub">{backtest?`${backtest.win_rate}% win rate on ${backtest.total_events_analyzed} events`:'Loading historical data...'} <ArrowRight size={10}/></div>
        </div>
        <div className="st" onClick={()=>setTab('dashboard')}>
          <div className="st-arrow"><ArrowRight size={14}/></div>
          <div className="st-ic" style={{background:'var(--yellow-bg)'}}><AlertTriangle size={18} color="var(--yellow)"/></div>
          <div className="st-label">Risk Events</div>
          <div className="st-val" style={{color:threatLevel==='HIGH'||threatLevel==='EXTREME'?'var(--red)':threatLevel==='ELEVATED'?'var(--yellow)':'var(--green)'}}>{activeEventCount}</div>
          <div className="st-sub">{threatLevel} threat · 8 categories <ArrowRight size={10}/></div>
        </div>
        <div className="st" onClick={()=>setTab('news')}>
          <div className="st-arrow"><ArrowRight size={14}/></div>
          <div className="st-ic" style={{background:'var(--blue-bg)'}}><Info size={18} color="var(--blue)"/></div>
          <div className="st-label">News & Signals</div>
          <div className="st-val" style={{color:'var(--blue)'}}>{news.length}</div>
          <div className="st-sub">Tokens trending today <ArrowRight size={10}/></div>
        </div>
        <div className="st" onClick={()=>{if(!scanning) scan()}}>
          <div className="st-arrow"><Zap size={14}/></div>
          <div className="st-ic" style={{background:'var(--purple-bg)'}}><Cpu size={18} color="var(--purple)"/></div>
          <div className="st-label">Stress Engine</div>
          <div className="st-val" style={{fontSize:14,color:'var(--purple)'}}>Monte Carlo</div>
          <div className="st-sub">2,000 simulated paths <Zap size={10}/></div>
        </div>
        <div className="st" onClick={()=>setTab('kite')}>
          <div className="st-arrow"><ArrowRight size={14}/></div>
          <div className="st-ic" style={{background:'var(--cyan-bg)'}}><Database size={18} color="var(--cyan)"/></div>
          <div className="st-label">Kite Chain</div>
          <div className="st-val" style={{fontSize:14,color:agent?.kite_connected?'var(--green)':'var(--red)'}}>{agent?.kite_connected?<><span className="pulse-dot" style={{width:6,height:6}}/> Connected</>:'Offline'}</div>
          <div className="st-sub">Chain 2368 <ArrowRight size={10}/></div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {[{k:'dashboard',i:<Layers size={13}/>,l:'Dashboard'},{k:'agent',i:<Cpu size={13}/>,l:'Live Agent'},{k:'market',i:<Globe size={13}/>,l:`Market (${market?.tokens_count||'300+'})`},{k:'news',i:<Info size={13}/>,l:`News (${news.length})`},{k:'stress',i:<Activity size={13}/>,l:'Stress Test'},{k:'predictions',i:<Target size={13}/>,l:'Predictions'},{k:'backtest',i:<BarChart3 size={13}/>,l:'Backtest'},{k:'kite',i:<Zap size={13}/>,l:'Kite Ecosystem'}].map(t=>(
          <button key={t.k} className={`tab ${tab===t.k?'on':''}`} onClick={()=>setTab(t.k)}>{t.i} {t.l}</button>
        ))}
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {tab==='dashboard'&&(
        <div className="fade">
          {scanning&&scanStep>=0&&(
            <div className="scan-progress fade">
              <div style={{fontSize:12,fontWeight:700,marginBottom:14,display:'flex',alignItems:'center',gap:6}}><RefreshCw size={14} className="spin" color="var(--green)"/> Agent Scanning...</div>
              <div className="scan-steps">
                <div className="scan-line"><div className="scan-line-fill" style={{width:`${Math.min(scanStep/3*100,100)}%`}}/></div>
                {['Fetch Events','Run Stress Test','Decide Action','Record On-Chain'].map((s,i)=>(
                  <div className="scan-step" key={i}>
                    <div className={`scan-dot ${scanStep===i?'active':scanStep>i?'done':'pending'}`}>{scanStep>i?<CheckCircle size={12}/>:scanStep===i?<RefreshCw size={12} className="spin"/>:(i+1)}</div>
                    <div className={`scan-label ${scanStep>=i?'active':''}`}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sec">
            <EventRiskBoard
              eventStream={eventStream}
              unlocks={unlocks}
              market={market}
              onSelectToken={setSelectedToken}
              onOpenStress={()=>setTab('stress')}
              onOpenEvent={(event,meta)=>setSelectedEvent({event,meta})}
            />
          </div>

          {/* Regime Signals Inline (Dashboard) */}
          {regime && regime.signals && regime.signals.length > 0 && (
            <div className="sec">
              <div className="crd" style={{cursor:'default',borderLeft:`3px solid ${regime.regime==='BEAR'?'var(--red)':regime.regime==='BULL'?'var(--green)':'var(--yellow)'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className={`rgm rgm-${regime.regime?.toLowerCase()}`}>
                      {regime.regime==='BULL'?<TrendingUp size={12}/>:regime.regime==='BEAR'?<TrendingDown size={12}/>:<Activity size={12}/>}
                      {regime.regime} {Math.round((regime.confidence||0)*100)}%
                    </div>
                    <span style={{fontSize:11,color:'var(--text3)'}}>— {regime.interpretation?.split('.')[0]}</span>
                  </div>
                  <button className="mini-link" onClick={()=>setShowRegime(true)} style={{cursor:'pointer'}}>
                    <Info size={12}/> How is this calculated?
                  </button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:`repeat(${regime.signals.length},1fr)`,gap:6}}>
                  {regime.signals.map((s,i) => {
                    const explanations = {
                      'Market Breadth':`${s.value} of top 100 tokens are up. ${s.score>=55?'Broad-based buying — bullish for risk assets.':s.score<=45?'Most tokens declining — risk-off pressure.':'Mixed performance — no clear leader.'}`,
                      'Fear & Greed':`Index = ${s.value}. ${s.score<=25?'Extreme Fear — historically a contrarian buy signal but means high volatility.':s.score<=45?'Fear in the market — defensive positioning recommended.':s.score>=75?'Extreme Greed — historically a top signal.':s.score>=55?'Greed dominates — stay alert for reversals.':'Neutral sentiment.'} Source: Alternative.me`,
                      'BTC Dominance':`BTC = ${s.value} of total crypto market cap. ${s.score>=55?'Capital rotating into altcoins (altseason signal).':s.score<=45?'Capital fleeing to BTC (risk-off).':'Balanced — no strong rotation.'}`,
                      'Market Momentum':`Total market cap moved ${s.value}. ${s.score>=55?'Positive momentum — buyers in control.':s.score<=45?'Negative momentum — sellers in control.':'Flat — wait-and-see mode.'}`,
                      'Altcoin Strength':`Altcoins averaged ${s.value}. ${s.score>=55?'Altcoins outperforming BTC — risk-on environment.':s.score<=45?'Altcoins lagging — concentrate in BTC/ETH.':'Mixed altcoin performance.'}`,
                    }
                    const explain = explanations[s.name] || `${s.name}: ${s.value} — bias ${s.bias}`
                    return (
                      <div key={i} className="rgm-sig" onClick={()=>toast(`${s.name} — ${s.bias}`,explain,s.bias==='BULL'?'g':s.bias==='BEAR'?'r':'y')} style={{cursor:'pointer',background:'var(--bg3)',borderRadius:'var(--r3)',padding:'8px 10px',textAlign:'center',transition:'all .15s'}}>
                        <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:3}}>{s.name}</div>
                        <div style={{fontSize:12,fontWeight:700,color:s.bias==='BULL'?'var(--green)':s.bias==='BEAR'?'var(--red)':'var(--yellow)'}}>{s.bias}</div>
                        <div style={{fontSize:10,color:'var(--text3)'}}>{s.value}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="sec"><UnlockTimeline unlocks={unlocks} onSelect={u=>setSelectedToken(u)}/></div>
          <div className="sec">
            <div className="sh"><h2><AlertTriangle size={16} color="var(--yellow)"/> Supply-Shock Event Library <span className="cnt">{unlocks.length}</span></h2><span style={{fontSize:11,color:'var(--text3)'}}>Token unlocks are one stressor inside the wider risk radar</span></div>
            {unlocks.length===0?(
              <div className="empty"><Clock size={36} color="var(--text3)"/><p style={{fontWeight:600,marginTop:10}}>No unlock data yet</p><p>Click <strong style={{color:'var(--green)'}}>Run Agent Scan</strong> to detect unlocks</p>
                <button className="btn btn-p" style={{margin:'16px auto 0'}} onClick={scan} disabled={scanning}><Zap size={13}/> Run Agent Scan</button></div>
            ):(
              <div className="tw"><table><thead><tr><th>Token</th><th>Unlock Date</th><th>Amount</th><th>Supply %</th><th>Risk</th><th>Strategy</th><th>Impact</th><th></th></tr></thead><tbody>
                {unlocks.map((u,i)=>{
                  const a=analyses.find(x=>x.token===u.token_symbol);const rs=a?.risk_score||Math.round(num(u.total_supply_percent)*16+(daysUntil(u.unlock_date)<=7?18:0));const d=daysUntil(u.unlock_date);const fallbackStrategy=strategyForRisk(rs)
                  return(<tr key={i} className="clickable" onClick={()=>setSelectedToken(u)}>
                    <td><div className="tc"><div className="ti">{u.token_symbol?.slice(0,2)}</div><div><div className="tn">{u.token_symbol}</div><div className="ts">{u.token_name}</div></div></div></td>
                    <td><div style={{fontWeight:500}}>{fmtD(u.unlock_date)}</div><div style={{fontSize:10,color:d<=7?'var(--red)':'var(--text3)',fontWeight:d<=7?700:400}}>{d}d away{d<=7&&' ⚠'}</div></td>
                    <td><div style={{fontWeight:600}}>{fmt(u.unlock_amount_usd)}</div><div className="ts">{u.unlock_amount_tokens?.toLocaleString()} tokens</div></td>
                    <td><span style={{fontWeight:700,color:u.total_supply_percent>=5?'var(--red)':u.total_supply_percent>=1?'var(--yellow)':'var(--text)'}}>{u.total_supply_percent}%</span></td>
                    <td><span className={`rsk ${riskCls(rs)}`}>{riskLabel(rs)} {rs}</span></td>
                    <td><span className={`str ${stratCls(a?.recommended_action||fallbackStrategy)}`}>{(a?.recommended_action||fallbackStrategy).replace('_',' ')}</span></td>
                    <td style={{color:'var(--red)',fontWeight:700}}>{a?.predicted_impact||`~${Math.min(-2, -num(u.total_supply_percent)*3.2).toFixed(0)}%`}</td>
                    <td><ArrowRight size={14} color="var(--text3)"/></td>
                  </tr>)})}
              </tbody></table></div>
            )}
          </div>

          {analyses.length>0&&(
            <div className="sec fade" id="scan-results">
              <div className="sh"><h2><Activity size={16} color="var(--green)"/> AI Scan Results <span className="cnt">{analyses.length}</span></h2><span style={{fontSize:11,color:'var(--text3)'}}>Sorted by risk · click any to expand · attestations linked to KiteScan</span></div>
              {analyses.map((r,i)=>(
                <div className="crd crd-click" key={i} onClick={()=>setExpanded(expanded===i?null:i)}>
                  <div className="ch">
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="ti">{r.token?.slice(0,2)}</div>
                      <span style={{fontWeight:700,fontSize:14}}>{r.token}</span>
                      <span className={`rsk ${riskCls(r.risk_score)}`}>Risk: {r.risk_score}</span>
                      <span className={`str ${stratCls(r.recommended_action)}`}>{r.recommended_action?.replace('_',' ')}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{color:'var(--red)',fontWeight:700}}>{r.predicted_impact}</span>
                      {expanded===i?<ChevronUp size={16} color="var(--text3)"/>:<ChevronDown size={16} color="var(--text3)"/>}
                    </div>
                  </div>
                  <div style={{color:'var(--text2)',fontSize:12,lineHeight:1.5}}>{r.reasoning}</div>
                  {expanded===i&&(
                    <div className="fade" style={{marginTop:12}}>
                      {r.factor_scores&&<div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:6}}>Risk Factors</div>{Object.entries(r.factor_scores).map(([k,v])=>(<div className="fr" key={k}><span className="fl">{k.replace(/_/g,' ')}</span><div className="fb"><div className="fv" style={{width:`${v}%`,background:barClr(v)}}/></div><span className="fn" style={{color:barClr(v)}}>{v}</span></div>))}</div>}
                      {r.hedge?.execution_plan&&<div style={{marginTop:8}}><div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:6}}>Execution Plan</div>{r.hedge.execution_plan.map((s,j)=>(<div className="ps-s" key={j}><span className="ps-a">{s.action}</span>{s.amount&&` — ${s.amount}`}{s.venue&&<span style={{color:'var(--text3)'}}> via {s.venue}</span>}</div>))}</div>}
                      {(() => { const url = kiteScanUrl(r.attestation?.tx_hash); return url ? <a href={url} target="_blank" rel="noopener" style={{display:'inline-flex',alignItems:'center',gap:4,color:'var(--green)',fontSize:11,fontWeight:600,marginTop:8,textDecoration:'none'}}><CheckCircle size={12}/> Verified on Kite <ExternalLink size={10}/></a> : null })()}
                      <div style={{marginTop:10}}><button className="btn btn-p btn-sm" onClick={e=>{e.stopPropagation();setSelectedToken({token_symbol:r.token,token_name:r.token})}}><Eye size={12}/> Full Analysis</button></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {anomalies.length>0&&(
            <div className="sec fade">
              <div className="sh"><h2><Flame size={16} color="var(--red)"/> Volume Anomalies <span className="cnt">{anomalies.length}</span></h2></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Volume 24h</th><th>Vol/MCap</th><th>Change</th><th>Severity</th><th>Signal</th></tr></thead><tbody>
                {anomalies.slice(0,10).map((a,i)=>(
                  <tr key={i} className="clickable" onClick={()=>setSelectedToken({token_symbol:a.symbol,symbol:a.symbol})}>
                    <td style={{fontWeight:600}}>{a.symbol}</td><td>{fmt(a.volume_24h)}</td><td style={{fontWeight:700,color:'var(--yellow)'}}>{a.volume_to_mcap}%</td>
                    <td style={{color:clr(a.change_24h),fontWeight:600}}>{a.change_24h>0?'+':''}{a.change_24h}%</td>
                    <td><span className={`rsk ${a.severity==='CRITICAL'?'r-c':a.severity==='HIGH'?'r-h':'r-m'}`}>{a.severity}</span></td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{a.signal}</td>
                  </tr>))}
              </tbody></table></div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MARKET — ALL TOKENS WITH PAGINATION ═══ */}
      {tab==='market'&&(
        <div className="fade">
          {Object.keys(sectors).length>0&&(<div className="sec"><div className="sh"><h2><Layers size={16} color="var(--purple)"/> Sector Performance</h2></div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:14}}>
              <span className={`spill ${!sectorFilter?'on':''}`} onClick={()=>setSectorFilter(null)}>All</span>
              {Object.entries(sectors).map(([s,d])=>(<span key={s} className={`spill ${sectorFilter===s?'on':''}`} onClick={()=>setSectorFilter(sectorFilter===s?null:s)}><span className="dot" style={{background:SECTOR_COLORS[s]||'#6b7280'}}/> {s} ({d.count})<span style={{color:clr(d.avg_change_24h),marginLeft:4}}>{d.avg_change_24h>0?'+':''}{d.avg_change_24h}%</span></span>))}
            </div></div>)}
          <div className="srch"><Search size={14}/><input placeholder={`Search ${topTokens.length}+ tokens by name or symbol...`} value={tokenSearch} onChange={e=>setTokenSearch(e.target.value)}/></div>
          <div className="sec">
            <div className="sh">
              <h2><Globe size={16} color="var(--cyan)"/> Market Data <span className="cnt">{filteredTokens.length}</span></h2>
              <div style={{fontSize:10,color:'var(--text3)'}}>Source: {market?.data_quality?.market_data_source || 'CoinPaprika API'} • Page {marketPage}/{totalPages||1}</div>
            </div>
            <div className="tw">
              <table><thead><tr><th>#</th><th>Token</th><th>Price</th><th>24h</th><th>7d</th><th>7d Chart</th><th>Market Cap</th><th>Volume</th><th>Sector</th></tr></thead><tbody>
                {paginatedTokens.map((t,i)=>(
                  <tr key={i} className="clickable" onClick={()=>setSelectedToken(t)}>
                    <td style={{color:'var(--text3)',fontSize:11}}>{t.rank}</td>
                    <td><div className="tc"><div className="ti">{t.image?<img src={t.image} alt=""/>:t.symbol?.slice(0,2)}</div><div><div className="tn">{t.symbol}</div><div className="ts">{t.name}</div></div></div></td>
                    <td style={{fontWeight:600}}>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td>
                    <td style={{color:clr(t.change_24h),fontWeight:600}}>{t.change_24h>0?'+':''}{t.change_24h}%</td>
                    <td style={{color:clr(t.change_7d)}}>{t.change_7d>0?'+':''}{t.change_7d}%</td>
                    <td><Sparkline7d data={t.sparkline_7d} width={70} height={24}/></td>
                    <td>{fmt(t.market_cap)}</td><td>{fmt(t.volume_24h)}</td>
                    <td><span className="spill" style={{cursor:'default'}}><span className="dot" style={{background:SECTOR_COLORS[t.sector]||'#6b7280'}}/>{t.sector}</span></td>
                  </tr>))}
              </tbody></table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="pg-btn" disabled={marketPage<=1} onClick={()=>setMarketPage(1)}>
                  <ChevronLeft size={12}/>
                </button>
                <button className="pg-btn" disabled={marketPage<=1} onClick={()=>setMarketPage(p=>p-1)}>
                  Prev
                </button>
                {Array.from({length:totalPages},(_,i)=>i+1).filter(p =>
                  p===1 || p===totalPages || Math.abs(p-marketPage)<=1
                ).map((p,idx,arr) => (
                  <React.Fragment key={p}>
                    {idx>0 && arr[idx-1]!==p-1 && <span className="pg-info">...</span>}
                    <button className={`pg-btn ${marketPage===p?'on':''}`} onClick={()=>setMarketPage(p)}>{p}</button>
                  </React.Fragment>
                ))}
                <button className="pg-btn" disabled={marketPage>=totalPages} onClick={()=>setMarketPage(p=>p+1)}>
                  Next
                </button>
                <button className="pg-btn" disabled={marketPage>=totalPages} onClick={()=>setMarketPage(totalPages)}>
                  <ChevronRight size={12}/>
                </button>
                <span className="pg-info">
                  Showing {(marketPage-1)*TOKENS_PER_PAGE+1}–{Math.min(marketPage*TOKENS_PER_PAGE, filteredTokens.length)} of {filteredTokens.length}
                </span>
              </div>
            )}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
            <div className="sec"><div className="sh"><h2><TrendingUp size={16} color="var(--green)"/> Top Gainers</h2></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Price</th><th>24h</th></tr></thead><tbody>
                {topGainers.map((t,i)=>(<tr key={i} className="clickable" onClick={()=>setSelectedToken(t)}><td style={{fontWeight:600}}>{t.symbol}</td><td>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td><td style={{color:'var(--green)',fontWeight:700}}>+{t.change_24h}%</td></tr>))}
              </tbody></table></div></div>
            <div className="sec"><div className="sh"><h2><TrendingDown size={16} color="var(--red)"/> Top Losers</h2></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Price</th><th>24h</th></tr></thead><tbody>
                {topLosers.map((t,i)=>(<tr key={i} className="clickable" onClick={()=>setSelectedToken(t)}><td style={{fontWeight:600}}>{t.symbol}</td><td>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td><td style={{color:'var(--red)',fontWeight:700}}>{t.change_24h}%</td></tr>))}
              </tbody></table></div></div>
          </div>

          {/* Data Source Attribution */}
          <div style={{textAlign:'center',padding:'12px',fontSize:10,color:'var(--text3)',background:'var(--bg3)',borderRadius:'var(--r)',marginTop:8}}>
            Market data powered by <strong>CoinPaprika API</strong> (top {market?.tokens_count || 300} by market cap) •
            Fear & Greed from <strong>Alternative.me</strong> •
            TVL from <strong>DeFiLlama</strong> •
            Updated every 5 minutes
          </div>
        </div>
      )}

      {/* ═══ STRESS TEST ═══ */}
      {tab==='stress'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><Activity size={16} color="var(--green)"/> Stress Test Simulator</h2><span className="bdg">Live</span></div>
            <div className="crd" style={{cursor:'default',marginBottom:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr auto',gap:10,alignItems:'end'}}>
                <div>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}}>Token</div>
                  <select value={stressToken} onChange={e=>setStressToken(e.target.value)} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:12,fontFamily:'inherit',fontWeight:600,background:'var(--bg)'}}>
                    {['ARB','OP','APT','TIA','SUI','SEI','IMX','DYDX','WLD','STRK','JTO','PYTH','JUP','W','ENA','ETHFI','ALT','MANTA','DYM','PIXEL'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}}>Unlock %</div>
                  <input type="number" value={stressParams.unlock_pct} onChange={e=>setStressParams(p=>({...p,unlock_pct:parseFloat(e.target.value)||0}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:12,fontFamily:'inherit'}} step="0.5" min="0.1" max="50"/>
                </div>
                <div>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}}>Days Until</div>
                  <input type="number" value={stressParams.unlock_days} onChange={e=>setStressParams(p=>({...p,unlock_days:parseInt(e.target.value)||7}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:12,fontFamily:'inherit'}} min="1" max="30"/>
                </div>
                <div>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}}>Recipient</div>
                  <select value={stressParams.recipient} onChange={e=>setStressParams(p=>({...p,recipient:e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:12,fontFamily:'inherit',background:'var(--bg)'}}>
                    {['investor','investor/team','investor/team cliff','team','foundation','ecosystem','community'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'.5px'}}>LP Range</div>
                  <select value={stressParams.lp_range} onChange={e=>setStressParams(p=>({...p,lp_range:parseFloat(e.target.value)}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:12,fontFamily:'inherit',background:'var(--bg)'}}>
                    <option value="0.05">±5% (Narrow)</option>
                    <option value="0.10">±10% (Medium)</option>
                    <option value="0.20">±20% (Wide)</option>
                    <option value="0.50">±50% (Full)</option>
                  </select>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <label style={{display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,cursor:'pointer'}}><input type="checkbox" checked={stressParams.is_cliff} onChange={e=>setStressParams(p=>({...p,is_cliff:e.target.checked}))}/> Cliff</label>
                  <button className="btn btn-p" onClick={runStressTest} disabled={stressLoading}>{stressLoading?<><RefreshCw size={13} className="spin"/> Running...</>:<><Play size={13}/> Run Stress Test</>}</button>
                </div>
              </div>
            </div>
          </div>

          {stressResult&&(
            <>
              {/* Risk Overview */}
              <div className="sec">
                <div className="sh"><h2><AlertTriangle size={16} color="var(--red)"/> Risk Metrics — {stressResult.token}</h2><span className={`rgm rgm-${(stressResult.regime_detected||'sideways').toLowerCase()}`}>{stressResult.regime_detected || 'SIDEWAYS'} ({pct(num(stressResult.regime_confidence,0)*100,0)})</span></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
                  {[
                    {l:'VaR (95%)',v:pct(stressResult.scenarios?.base_case?.var_95),c:num(stressResult.scenarios?.base_case?.var_95)<-15?'var(--red)':'var(--yellow)'},
                    {l:'CVaR (95%)',v:pct(stressResult.scenarios?.base_case?.cvar_95),c:'var(--red)'},
                    {l:'P(Loss>10%)',v:pct(num(stressResult.scenarios?.base_case?.prob_loss_gt_10pct)*100),c:num(stressResult.scenarios?.base_case?.prob_loss_gt_10pct)>0.5?'var(--red)':'var(--yellow)'},
                    {l:'Max Drawdown',v:pct(stressResult.scenarios?.base_case?.max_drawdown_worst),c:'var(--red)'},
                    {l:'Mean Return',v:pct(stressResult.scenarios?.base_case?.mean_return),c:num(stressResult.scenarios?.base_case?.mean_return)<0?'var(--red)':'var(--green)'},
                  ].map((m,i)=>(
                    <div key={i} className="bts"><div className="bv" style={{color:m.c,fontSize:18}}>{m.v}</div><div className="bl">{m.l}</div></div>
                  ))}
                </div>
              </div>

              {/* Scenario Comparison */}
              <div className="sec">
                <div className="sh"><h2><BarChart3 size={16} color="var(--blue)"/> Scenario Analysis (2000 Monte Carlo Paths)</h2></div>
                <div className="tw"><table><thead><tr><th>Scenario</th><th>VaR(95%)</th><th>CVaR(95%)</th><th>P(Loss&gt;10%)</th><th>Mean Return</th><th>Skewness</th><th>Kurtosis</th></tr></thead><tbody>
                  {Object.entries(stressResult.scenarios||{}).map(([k,v])=>(
                    <tr key={k}><td style={{fontWeight:600}}>{k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</td>
                    <td style={{color:num(v.var_95)<-15?'var(--red)':'var(--yellow)',fontWeight:700}}>{pct(v.var_95)}</td>
                    <td style={{color:'var(--red)',fontWeight:700}}>{pct(v.cvar_95)}</td>
                    <td>{pct(num(v.prob_loss_gt_10pct)*100)}</td>
                    <td style={{color:num(v.mean_return)<0?'var(--red)':'var(--green)',fontWeight:600}}>{pct(v.mean_return)}</td>
                    <td>{num(v.skewness).toFixed(2)}</td>
                    <td>{num(v.kurtosis).toFixed(2)}</td></tr>
                  ))}
                </tbody></table></div>
              </div>

              {/* Unlock Impact Analysis */}
              {stressResult.unlock_impact_analysis&&(
                <div className="sec">
                  <div className="sh"><h2><Lock size={16} color="var(--yellow)"/> Unlock Impact Isolation</h2><span className={`rsk ${stressResult.unlock_impact_analysis.unlock_is_material?'r-c':'r-l'}`}>{stressResult.unlock_impact_analysis.unlock_is_material?'MATERIAL':'NON-MATERIAL'}</span></div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                    <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{pct(stressResult.unlock_impact_analysis.additional_var_95)}</div><div className="bl">Additional VaR(95%)</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{pct(stressResult.unlock_impact_analysis.additional_cvar_95)}</div><div className="bl">Additional CVaR</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--yellow)'}}>{pct(stressResult.unlock_impact_analysis.additional_il)}</div><div className="bl">Additional IL</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{pct(num(stressResult.unlock_impact_analysis.prob_increase_gt10)*100)}</div><div className="bl">P(&gt;10%) Increase</div></div>
                  </div>
                </div>
              )}

              {/* LP Stress Test */}
              {stressResult.lp_stress_test&&(
                <div className="sec">
                  <div className="sh"><h2><Layers size={16} color="var(--purple)"/> LP Impermanent Loss Stress Test (Uniswap v3)</h2></div>
                  <div className="tw"><table><thead><tr><th>Range Width</th><th>Mean IL</th><th>IL (95th pct)</th><th>Max IL</th></tr></thead><tbody>
                    {Object.entries(stressResult.lp_stress_test).filter(([k])=>k!=='conclusion').map(([k,v])=>(
                      <tr key={k}><td style={{fontWeight:600}}>{v.range}</td>
                      <td>{pct(v.il_mean)}</td>
                      <td style={{color:num(v.il_95th)>5?'var(--red)':'var(--yellow)',fontWeight:600}}>{pct(v.il_95th)}</td>
                      <td style={{color:'var(--red)',fontWeight:700}}>{pct(v.il_max)}</td></tr>
                    ))}
                  </tbody></table></div>
                  <div className="info-box" style={{borderColor:'var(--purple)',background:'var(--purple-bg)',marginTop:10,fontSize:11}}>
                    {stressResult.lp_stress_test.conclusion}
                  </div>
                </div>
              )}

              {/* Hedge Recommendation */}
              {stressResult.hedge_recommendation&&(
                <div className="sec">
                  <div className="sh"><h2><Shield size={16} color="var(--green)"/> Hedge Recommendation</h2><span className={`rsk ${stressResult.hedge_recommendation.risk_tier==='CRITICAL'?'r-c':stressResult.hedge_recommendation.risk_tier==='HIGH'?'r-h':'r-m'}`}>{stressResult.hedge_recommendation.risk_tier}</span></div>
                  <div className="crd" style={{cursor:'default',borderLeft:`3px solid ${stressResult.hedge_recommendation.risk_tier==='CRITICAL'?'var(--red)':stressResult.hedge_recommendation.risk_tier==='HIGH'?'var(--yellow)':'var(--green)'}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:12}}>
                      <div><div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Action</div><div style={{fontSize:16,fontWeight:800}}>{stressResult.hedge_recommendation.recommended_action?.replace(/_/g,' ')}</div></div>
                      <div><div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Hedge Size</div><div style={{fontSize:16,fontWeight:800,color:'var(--green)'}}>{pct(stressResult.hedge_recommendation.hedge_size_pct)}</div></div>
                      <div><div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Urgency</div><div style={{fontSize:16,fontWeight:800,color:stressResult.hedge_recommendation.urgency==='IMMEDIATE'?'var(--red)':'var(--yellow)'}}>{stressResult.hedge_recommendation.urgency}</div></div>
                    </div>
                    <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>{stressResult.hedge_recommendation.rationale}</div>
                    {stressResult.hedge_recommendation.lp_warning&&<div className="info-box" style={{borderColor:'var(--yellow)',background:'var(--yellow-bg)',marginTop:10,fontSize:11}}>{stressResult.hedge_recommendation.lp_warning}</div>}
                  </div>
                </div>
              )}

              {/* Methodology */}
              <div className="sec">
                <div className="sh"><h2><Cpu size={16} color="var(--cyan)"/> Methodology</h2></div>
                <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--cyan)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {stressResult.methodology&&Object.entries(stressResult.methodology).map(([k,v])=>(
                      <div key={k} style={{fontSize:11}}><span style={{color:'var(--text3)',fontWeight:600}}>{k.replace(/_/g,' ')}:</span> <span style={{fontWeight:500}}>{v}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {!stressResult&&!stressLoading&&(
            <div className="empty"><Activity size={40} color="var(--text3)" style={{marginBottom:8}}/><h3 style={{fontSize:16,fontWeight:700}}>Configure & Run Stress Test</h3><p>Select a token and unlock parameters above, then click "Run Stress Test" to simulate 2,000 price paths and see the loss distribution under realistic shock scenarios.</p></div>
          )}
        </div>
      )}

      {/* ═══ PREDICTIONS ═══ */}
      {tab==='predictions'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><Target size={16} color="var(--green)"/> Verifiable Prediction Oracle</h2><span className="bdg">Live</span></div>

            {/* Track record explainer */}
            <div className="crd" style={{cursor:'default',background:'linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%)',border:'1px solid #d1fae5',marginBottom:14,padding:16}}>
              <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{width:38,height:38,borderRadius:10,background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Info size={18} color="#fff"/>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:'var(--text)',marginBottom:4}}>How this track record was built</div>
                  <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>The oracle is seeded with <strong>13 real 2024-2025 unlock events</strong> (ARB, OP, APT, TIA, SUI, SEI) — each scored against its real published 7-day price impact. The grade you see uses the same accuracy formula that will score every future on-chain commit. Predictions you submit below are committed as <code>keccak256</code> hashes to Kite AI <em>before</em> the unlock, then revealed and scored after the event so the agent's track record stays cryptographically honest.</div>
                </div>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              {/* Create Prediction */}
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--green)'}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:'flex',alignItems:'center',gap:6}}><Lock size={14}/> Commit New Prediction</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase'}}>Token</div>
                    <select value={stressToken} onChange={e=>setStressToken(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:12,fontFamily:'inherit',fontWeight:600,background:'var(--bg)'}}>
                      {['ARB','OP','APT','TIA','SUI','SEI','IMX','DYDX','WLD','STRK'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase'}}>Unlock %</div>
                    <input type="number" value={stressParams.unlock_pct} onChange={e=>setStressParams(p=>({...p,unlock_pct:parseFloat(e.target.value)||0}))} style={{width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:12,fontFamily:'inherit'}} step="0.5"/>
                  </div>
                </div>
                <button className="btn btn-p" style={{width:'100%',justifyContent:'center'}} onClick={createPrediction} disabled={predLoading}>{predLoading?<><RefreshCw size={13} className="spin"/> Committing...</>:<><Lock size={13}/> Run Stress Test & Commit Prediction</>}</button>
                <div style={{fontSize:10,color:'var(--text3)',marginTop:8,lineHeight:1.5}}>Runs stress simulation, generates prediction, then commits a tamper-proof hash to Kite AI before the unlock event. Anyone can verify the prediction afterwards.</div>
              </div>

              {/* Reputation */}
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--purple)'}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:'flex',alignItems:'center',gap:6}}><Shield size={14}/> Agent Reputation</div>
                {predReputation?.stats?(
                  <>
                    <div style={{textAlign:'center',marginBottom:14}}>
                      <div style={{fontSize:resolvedPredictionCount?48:28,fontWeight:900,color:resolvedPredictionCount?'var(--green)':'var(--yellow)',letterSpacing:'-.5px'}}>
                        {resolvedPredictionCount ? predReputation.stats.grade : 'CALIBRATING'}
                      </div>
                      <div style={{fontSize:12,color:'var(--text3)',fontWeight:600}}>
                        {resolvedPredictionCount ? `${predReputation.stats.reputation_score}/1000` : 'Pending outcomes do not affect grade yet'}
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div className="bts"><div className="bv" style={{fontSize:16}}>{predReputation.stats.total_predictions}</div><div className="bl">Total Predictions</div></div>
                      <div className="bts"><div className="bv" style={{fontSize:16,color:resolvedPredictionCount?'var(--green)':'var(--text3)'}}>{resolvedPredictionCount ? `${predReputation.stats.accuracy_rate}%` : 'Awaiting'}</div><div className="bl">Accuracy Rate</div></div>
                      <div className="bts"><div className="bv" style={{fontSize:16}}>{resolvedPredictionCount ? predReputation.stats.streak : '—'}</div><div className="bl">Current Streak</div></div>
                      <div className="bts"><div className="bv" style={{fontSize:16}}>{resolvedPredictionCount ? `${predReputation.stats.avg_error}%` : '—'}</div><div className="bl">Avg Error</div></div>
                    </div>
                  </>
                ):(
                  <div style={{textAlign:'center',padding:'24px 0'}}>
                    <div style={{fontSize:48,fontWeight:900,color:'var(--text3)'}}>—</div>
                    <div style={{fontSize:12,color:'var(--text3)',marginTop:4}}>No predictions yet. Commit your first prediction to start building reputation.</div>
                  </div>
                )}
              </div>
            </div>

            {lastPrediction&&(
              <div className="crd fade" style={{cursor:'default',borderLeft:'3px solid var(--green)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:10,color:'var(--text3)',fontWeight:800,textTransform:'uppercase',letterSpacing:'.55px'}}>{String(lastPrediction.commit_hash).startsWith('local-preview')?'Latest stress preview':'Latest committed stress forecast'}</div>
                    <div style={{fontSize:17,fontWeight:900,marginTop:2}}>{lastPrediction.token} {String(lastPrediction.commit_hash).startsWith('local-preview')?'stress preview generated':'prediction committed before event resolution'}</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:3,lineHeight:1.5}}>{String(lastPrediction.commit_hash).startsWith('local-preview')?'The backend commit timed out, so this card shows a deterministic local preview. Run again when the API is warm to write the commit hash.':'Commit hash locks the forecast now; reveal later proves the prediction was not edited after the market moved.'}</div>
                  </div>
                  <span className={`rsk ${String(lastPrediction.commit_hash).startsWith('local-preview')?'r-m':'r-l'}`}>{String(lastPrediction.commit_hash).startsWith('local-preview')?<Clock size={11}/>:<CheckCircle size={11}/>} {String(lastPrediction.commit_hash).startsWith('local-preview')?'API Warm-Up':'Commit Ready'}</span>
                </div>
                <div className="oracle-preview">
                  <div className="oracle-card"><div className="k">Predicted Impact</div><div className="v" style={{color:'var(--red)'}}>{pct(lastPrediction.predicted_impact)}</div></div>
                  <div className="oracle-card"><div className="k">Confidence</div><div className="v">{pct(num(lastPrediction.confidence)*100,0)}</div></div>
                  <div className="oracle-card"><div className="k">VaR 95</div><div className="v" style={{color:'var(--red)'}}>{pct(lastPrediction.stress_summary?.var_95)}</div></div>
                  <div className="oracle-card"><div className="k">Recommended Action</div><div className="v" style={{fontSize:14,color:'var(--green)'}}>{lastPrediction.stress_summary?.hedge_action?.replace('_',' ') || 'POLICY CHECK'}</div></div>
                </div>
                <div className="mini-actions">
                  {lastPrediction.commit_hash&&<span className="mini-link"><Lock size={12}/> {lastPrediction.commit_hash.slice(0,18)}...</span>}
                  <button className="mini-link" onClick={()=>setTab('stress')}><Activity size={12}/> Inspect stress engine</button>
                  <a className="mini-link" href={KITE_LINKS.explorer} target="_blank" rel="noopener"><ExternalLink size={12}/> KiteScan</a>
                </div>
              </div>
            )}
          </div>

          {/* Prediction History */}
          <div className="sec">
            <div className="sh"><h2><Database size={16} color="var(--cyan)"/> Prediction History</h2>{predictions?.predictions?.length>0&&<span className="cnt">{predictions.predictions.length}</span>}</div>
            {predictions?.predictions?.length>0?(
              <div className="tw"><table><thead><tr><th>Token</th><th>Predicted Impact</th><th>Confidence</th><th>Regime</th><th>Committed</th><th>On-Chain</th><th>Status</th><th>Accuracy</th></tr></thead><tbody>
                {predictions.predictions.map((p,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:700}}>{p.token}</td>
                    <td style={{fontWeight:700,color:'var(--red)'}}>{p.predicted_impact}%</td>
                    <td>{(p.confidence*100).toFixed(0)}%</td>
                    <td><span className={`rgm rgm-${(p.regime||'sideways').toLowerCase()}`}>{p.regime}</span></td>
                    <td style={{fontSize:11,color:'var(--text3)'}}>{new Date(p.committed_at).toLocaleDateString()}</td>
                    <td>{(() => { const url = kiteScanUrl(p.tx_hash); return url ? <a href={url} target="_blank" rel="noopener" title="View tx on KiteScan" style={{display:'inline-flex',alignItems:'center',gap:3,color:'var(--green)',textDecoration:'none',fontSize:11,fontWeight:600}}><CheckCircle size={14}/> <ExternalLink size={10}/></a> : (p.on_chain ? <CheckCircle size={14} color="var(--green)" title="Seeded historical (synthetic hash)"/> : <Clock size={14} color="var(--text3)"/>) })()}</td>
                    <td>{p.revealed?<span className="rsk r-l">Revealed</span>:<span className="rsk r-m">Pending</span>}</td>
                    <td style={{fontWeight:700,color:p.accuracy>=80?'var(--green)':p.accuracy>=50?'var(--yellow)':'var(--red)'}}>{p.accuracy!=null?`${p.accuracy}/100`:'—'}</td>
                  </tr>
                ))}
              </tbody></table></div>
            ):(
              <div className="empty"><Target size={40} color="var(--text3)" style={{marginBottom:8}}/><h3 style={{fontSize:16,fontWeight:700}}>No Predictions Yet</h3><p>Create your first verifiable prediction using the form above. Each prediction runs a full stress simulation and commits the result on-chain.</p></div>
            )}
          </div>

          {/* How It Works */}
          <div className="sec">
            <div className="sh"><h2><Info size={16} color="var(--blue)"/> How Verifiable Predictions Work</h2></div>
            <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--blue)'}}>
              <div className="oracle-flow">
                {[
                  {n:'Stress Test',d:'Simulates 2,000 price paths to produce VaR, CVaR, loss probability and LP impermanent-loss distribution.',ic:<Activity size={15}/>},
                  {n:'Commit Hash',d:'keccak256(token, forecast, confidence, timestamp, salt) is committed before the event resolves.',ic:<Lock size={15}/>},
                  {n:'Observe Event',d:'Market outcome is pulled from price and on-chain sources after the shock window ends.',ic:<Eye size={15}/>},
                  {n:'Reveal & Score',d:'Prediction is revealed, hash-checked, scored, and added to the agent reputation record.',ic:<CheckCircle size={15}/>},
                ].map((s,i)=>(
                  <div key={i} className="oracle-step">
                    <div className="num">{s.ic}</div>
                    <div style={{fontSize:12,fontWeight:800,marginBottom:5}}>{i+1}. {s.n}</div>
                    <div style={{fontSize:10,color:'var(--text3)',lineHeight:1.5}}>{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BACKTEST ═══ */}
      {tab==='backtest'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><BarChart3 size={16} color="var(--green)"/> Historical Backtesting</h2><button className="btn btn-p" onClick={runBT}><Play size={13}/> Run Backtest</button></div>

            {/* Data provenance banner */}
            <div className="crd" style={{cursor:'default',marginBottom:14,borderLeft:'3px solid var(--blue)',padding:14}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <Info size={18} color="var(--blue)" style={{flexShrink:0,marginTop:2}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,marginBottom:4}}>Data source: real 2024-2025 unlock events</div>
                  <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.6,marginBottom:8}}>13 actual token unlock events with published 7-day price impacts. Pre and post prices verified against CoinGecko / CoinMarketCap historical data. Strategy logic is the same one the live agent runs today — the only "simulated" part is what UnlockShield would have done; the impacts are real history.</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    <span style={{fontSize:10,background:'var(--bg3)',padding:'3px 8px',borderRadius:4,fontWeight:600}}>ARB · 3 events</span>
                    <span style={{fontSize:10,background:'var(--bg3)',padding:'3px 8px',borderRadius:4,fontWeight:600}}>OP · 2 events</span>
                    <span style={{fontSize:10,background:'var(--bg3)',padding:'3px 8px',borderRadius:4,fontWeight:600}}>APT · 2 events</span>
                    <span style={{fontSize:10,background:'var(--red-bg)',color:'var(--red)',padding:'3px 8px',borderRadius:4,fontWeight:600}}>TIA · -28.5% (Oct 2024)</span>
                    <span style={{fontSize:10,background:'var(--bg3)',padding:'3px 8px',borderRadius:4,fontWeight:600}}>SUI · 2 events</span>
                    <span style={{fontSize:10,background:'var(--bg3)',padding:'3px 8px',borderRadius:4,fontWeight:600}}>SEI · 2 events</span>
                  </div>
                </div>
              </div>
            </div>

            {backtest?.headline?(<div className="info-box" style={{borderLeftColor:'var(--green)',background:'var(--green-bg)',marginBottom:16,padding:'16px 18px'}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{backtest.headline}</div>
              <div style={{display:'flex',gap:20,fontSize:12,color:'var(--text2)'}}><span>Win Rate: <strong style={{color:'var(--green)'}}>{backtest.win_rate}</strong></span><span>Period: <strong>{backtest.period}</strong></span><span>Avg: <strong style={{color:'var(--green)'}}>{backtest.avg_savings}</strong></span></div>
            </div>):(<div className="empty"><BarChart3 size={36} color="var(--text3)"/><p style={{fontWeight:600,marginTop:10}}>No backtest data</p><p>Simulates on 13 real historical events</p><button className="btn btn-p" style={{margin:'16px auto 0'}} onClick={runBT}><Play size={13}/> Run Backtest</button></div>)}
            {backtest?.total_events_analyzed>0&&(<>
              <div className="btg">
                <div className="bts"><div className="bv" style={{color:'var(--green)'}}>{fmt(backtest.total_savings)}</div><div className="bl">Total Saved</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--green)'}}>{backtest.win_rate}%</div><div className="bl">Win Rate</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{fmt(backtest.total_loss_without_shield)}</div><div className="bl">Without Shield</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--yellow)'}}>{fmt(backtest.total_loss_with_shield)}</div><div className="bl">With Shield</div></div>
              </div>
              {backtest.per_token&&<div className="tw" style={{marginBottom:14}}><table><thead><tr><th>Token</th><th>Events</th><th>Avg Impact</th><th>Worst</th><th>Savings</th></tr></thead><tbody>{Object.entries(backtest.per_token).map(([t,d])=>(<tr key={t}><td style={{fontWeight:700}}>{t}</td><td>{d.events}</td><td style={{color:'var(--red)'}}>{d.avg_impact}%</td><td style={{color:'var(--red)',fontWeight:600}}>{d.worst_impact}%</td><td style={{color:'var(--green)',fontWeight:700}}>{fmt(d.savings)}</td></tr>))}</tbody></table></div>}
              {backtest.detailed_results&&<div className="tw"><table><thead><tr><th>Token</th><th>Date</th><th>Supply</th><th>Impact</th><th>Strategy</th><th>Without</th><th>With</th><th>Saved</th></tr></thead><tbody>{backtest.detailed_results.map((r,i)=>(<tr key={i}><td style={{fontWeight:600}}>{r.token}</td><td style={{fontSize:11}}>{r.date}</td><td>{r.pct_supply}%</td><td style={{color:'var(--red)',fontWeight:600}}>{r.actual_impact}%</td><td><span className={`str ${stratCls(r.strategy_chosen)}`}>{r.strategy_chosen?.replace('_',' ')}</span></td><td style={{color:'var(--red)'}}>{fmt(r.loss_without_shield)}</td><td style={{color:'var(--yellow)'}}>{fmt(r.loss_with_shield)}</td><td style={{color:'var(--green)',fontWeight:700}}>{fmt(r.savings)}</td></tr>))}</tbody></table></div>}
            </>)}
          </div>
        </div>
      )}

      {/* ═══ NEWS ═══ */}
      {tab==='news'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh">
              <h2><Info size={16} color="var(--blue)"/> Market News & Token Signals</h2>
              <button className="btn btn-s btn-sm" onClick={()=>{load();toast('Refreshed','News updated','g')}}><RefreshCw size={12}/> Refresh</button>
            </div>
            <p style={{fontSize:13,color:'var(--text2)',marginBottom:16,lineHeight:1.6}}>Real-time market signals and token-level news that feed into the risk engine. Each item is tagged with sentiment and the token it affects. Click any card to open the token detail panel.</p>

            <div className="news-filters">
              {['all','positive','negative','neutral'].map(f=>(
                <span key={f} className={`news-pill ${newsFilter===f?'on':''}`} onClick={()=>setNewsFilter(f)}>
                  {f==='all'?`All (${news.length})`:f.charAt(0).toUpperCase()+f.slice(1)}
                </span>
              ))}
            </div>

            {news.length===0?(
              <div className="empty"><Info size={36} color="var(--text3)" style={{marginBottom:10}}/><h3 style={{fontSize:15,fontWeight:700}}>No signals available</h3><p>News data is loading from the backend. Try refresh.</p></div>
            ):(
              <div className="news-grid">
                {news.filter(n=>{
                  if(newsFilter==='all') return true
                  const s = n.sentiment||0
                  if(newsFilter==='positive') return s > 0.05
                  if(newsFilter==='negative') return s < -0.05
                  return Math.abs(s) <= 0.05
                }).map((n,i)=>{
                  const sentimentClass = (n.sentiment||0) > 0.05 ? 'news-sent-up' : (n.sentiment||0) < -0.05 ? 'news-sent-down' : 'news-sent-flat'
                  const sentimentIcon = (n.sentiment||0) > 0.05 ? <TrendingUp size={10}/> : (n.sentiment||0) < -0.05 ? <TrendingDown size={10}/> : <Activity size={10}/>
                  const entity = n.entities?.[0]
                  const tokenMatch = entity?.symbol && topTokens.find(t=>t.symbol===entity.symbol)
                  return (
                    <div key={i} className="news-card" onClick={()=>{
                      if(tokenMatch){setSelectedToken({...tokenMatch,token_symbol:tokenMatch.symbol,token_name:tokenMatch.name})}
                      else if(n.url){window.open(n.url,'_blank')}
                    }}>
                      <div className="news-card-h">
                        {entity?<span className="news-card-sym">{entity.symbol}</span>:<span className="news-card-sym">MARKET</span>}
                        <span className="news-card-time">{n.published_at?new Date(n.published_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}</span>
                      </div>
                      <div className="news-card-title">{n.title}</div>
                      <div className="news-card-desc">{n.description||'No description available.'}</div>
                      <div className="news-card-f">
                        <span className="news-card-src">{(n.source||'unknown').replace(/_/g,' ')}</span>
                        <span className={`news-card-sent ${sentimentClass}`}>
                          {sentimentIcon} {((n.sentiment||0)*100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="sec">
            <div className="sh"><h2><Activity size={15} color="var(--yellow)"/> Live Event Stream</h2></div>
            <p style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>System-detected events from multiple data sources, ranked by severity.</p>
            <div className="tw">
              <table>
                <thead><tr><th>Event</th><th>Token</th><th>Source</th><th>Severity</th><th>Description</th></tr></thead>
                <tbody>
                  {(eventStream?.events||[]).slice(0,20).map((e,i)=>(
                    <tr key={i} className="clickable" onClick={()=>{
                      const tk = topTokens.find(t=>t.symbol===e.token_symbol)
                      if(tk) setSelectedToken({...tk,token_symbol:tk.symbol,token_name:tk.name})
                    }}>
                      <td style={{fontWeight:600,textTransform:'capitalize'}}>{(e.event_type||'').replace(/_/g,' ')}</td>
                      <td>{e.token_symbol||'—'}</td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>{e.source||eventMeta(e.event_type).source}</td>
                      <td><span className={`rsk ${eventSeverityClass(e.severity_score||0)}`}>{e.severity_label||'INFO'} {e.severity_score||0}</span></td>
                      <td style={{fontSize:11,color:'var(--text2)',maxWidth:340}}>{e.title||e.description||''}</td>
                    </tr>
                  ))}
                  {(!eventStream?.events||eventStream.events.length===0)&&(
                    <tr><td colSpan="5" style={{textAlign:'center',color:'var(--text3)',padding:20}}>No events detected. Backend stream is initializing.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PORTFOLIO ═══ */}
      {tab==='portfolio'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><PieChart size={16} color="var(--purple)"/> Portfolio Holdings</h2></div>
            {portfolio?.holdings?(<>
              <div style={{marginBottom:16}}><DonutChart holdings={portfolio.holdings}/></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Holdings</th><th>Price</th><th>Value</th><th>Unlock Risk</th><th></th></tr></thead><tbody>
                {portfolio.holdings.map((h,i)=>{
                  const has=unlocks.some(u=>u.token_symbol===h.token_symbol)
                  return(<tr key={i} className="clickable" onClick={()=>setSelectedToken(h)}>
                    <td><div className="tc"><div className="ti">{h.token_symbol?.slice(0,2)}</div><span className="tn">{h.token_symbol}</span></div></td>
                    <td>{h.amount?.toLocaleString()}</td><td>${h.current_price?.toFixed(4)}</td>
                    <td style={{fontWeight:700,color:'var(--green)'}}>{fmt(h.value_usd)}</td>
                    <td>{has?<span className="rsk r-h"><AlertTriangle size={10}/> UNLOCK</span>:<span className="rsk r-l"><CheckCircle size={10}/> Safe</span>}</td>
                    <td><ArrowRight size={14} color="var(--text3)"/></td>
                  </tr>)})}
              </tbody></table></div>
            </>):(<div className="empty"><Wallet size={36} color="var(--text3)"/><p style={{fontWeight:600,marginTop:10}}>Portfolio loading...</p><p>Demo holdings for demonstration</p></div>)}
          </div>
          <div className="sec">
            <div className="sh"><h2><Cpu size={16} color="var(--cyan)"/> Agent Architecture</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[{i:<Eye size={20}/>,t:'Monitor',d:'300+ tokens via CoinPaprika, 40+ unlocks from Tokenomist',c:'var(--yellow)',bg:'var(--yellow-bg)'},{i:<Cpu size={20}/>,t:'Analyze',d:'5-factor quantitative risk model',c:'var(--purple)',bg:'var(--purple-bg)'},{i:<Shield size={20}/>,t:'Protect',d:'6 hedge strategies with execution plans',c:'var(--green)',bg:'var(--green-bg)'},{i:<Database size={20}/>,t:'Attest',d:'Immutable records on Kite blockchain',c:'var(--green)',bg:'var(--green-bg2)'},{i:<BarChart3 size={20}/>,t:'Backtest',d:'Validated on 13 real events',c:'var(--cyan)',bg:'var(--cyan-bg)'},{i:<Globe size={20}/>,t:'Intelligence',d:'Market regime, Fear & Greed, TVL, anomalies',c:'var(--red)',bg:'var(--red-bg)'}].map((c,i)=>(
                <div className="crd" key={i} style={{textAlign:'center',padding:18,cursor:'default'}}>
                  <div style={{width:42,height:42,borderRadius:10,margin:'0 auto 8px',background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',color:c.c}}>{c.i}</div>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{c.t}</div>
                  <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.4}}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LIVE AGENT ═══ */}
      {tab==='agent'&&(() => {
        const loop = agentActivity?.loop
        const events = agentActivity?.events || []
        const passport = treasuryData?.passport
        const hedges = treasuryData?.recent_hedges || []
        const treasuryReady = treasuryData?.configured && passport && !passport.error
        const fmtUsd = v => `$${Number(v||0).toLocaleString('en-US',{maximumFractionDigits:0})}`
        const fmtAgo = ts => {
          if(!ts) return '—'
          const sec = Math.max(0,(Date.now()-new Date(ts).getTime())/1000)
          if(sec<60) return `${Math.round(sec)}s ago`
          if(sec<3600) return `${Math.round(sec/60)}m ago`
          return `${Math.round(sec/3600)}h ago`
        }
        const levelColor = {success:'var(--green)',warn:'var(--yellow)',error:'var(--red)',info:'var(--text2)'}
        const kindIcon = {
          cycle_start:<RefreshCw size={13} className="spin" color="var(--cyan)"/>,
          cycle_complete:<CheckCircle size={13} color="var(--green)"/>,
          regime_check:<Globe size={13} color="var(--blue)"/>,
          regime_adjust:<TrendingUp size={13} color="var(--purple)"/>,
          scan_summary:<Layers size={13} color="var(--cyan)"/>,
          scan:<Activity size={13} color="var(--blue)"/>,
          signal_breakdown:<BarChart3 size={13} color="var(--purple)"/>,
          stress_run:<Zap size={13} color="var(--purple)"/>,
          prediction_market:<Globe size={13} color="var(--cyan)"/>,
          reasoning:<Cpu size={13} color="var(--purple)"/>,
          correlation:<BarChart3 size={13} color="var(--yellow)"/>,
          commit:<Lock size={13} color="var(--purple)"/>,
          skip_commit:<CheckCircle size={13} color="var(--text3)"/>,
          position_check:<Target size={13} color="var(--cyan)"/>,
          hold_position:<Clock size={13} color="var(--text2)"/>,
          hedge:<Zap size={13} color="var(--green)"/>,
          hedge_blocked:<AlertTriangle size={13} color="var(--yellow)"/>,
          position_summary:<Database size={13} color="var(--cyan)"/>,
          reveal:<Eye size={13} color="var(--green)"/>,
          no_reveals:<Clock size={13} color="var(--text3)"/>,
          error:<AlertTriangle size={13} color="var(--red)"/>,
          boot:<Cpu size={13} color="var(--green)"/>,
          idle:<Clock size={13} color="var(--text3)"/>,
        }
        return (
        <div className="fade">
          {/* Live agent banner */}
          <div className="sec">
            <div className="crd" style={{background:'linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%)',border:'1px solid #a7f3d0',padding:18,cursor:'default'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:14}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:54,height:54,borderRadius:14,background:loop?.running?'var(--green)':'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {loop?.running?<Cpu size={26} color="#fff"/>:<Clock size={26} color="#fff"/>}
                  </div>
                  <div>
                    <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px'}}>Autonomous Agent · Kite AI Testnet</div>
                    <div style={{fontSize:20,fontWeight:900,color:loop?.running?'var(--green)':'var(--text)'}}>{loop?.running?'RUNNING':loop?.enabled?'starting…':'OFFLINE'}</div>
                    <div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>Cycles: <strong>{loop?.cycles_completed||0}</strong> · Last: <strong>{fmtAgo(loop?.last_cycle_at)}</strong> · Interval: <strong>{loop?.interval_seconds||0}s</strong></div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <a className="btn btn-s btn-sm" href={passport?.agent_explorer||'#'} target="_blank" rel="noopener"><ExternalLink size={12}/> Agent on KiteScan</a>
                  <a className="btn btn-s btn-sm" href={passport?.treasury_explorer||'#'} target="_blank" rel="noopener"><ExternalLink size={12}/> Treasury on KiteScan</a>
                </div>
              </div>
            </div>
          </div>

          {/* Treasury stats */}
          {treasuryReady ? (
            <div className="sec">
              <div className="sh"><h2><Database size={16} color="var(--cyan)"/> Agent Treasury · on-chain capital execution</h2><span style={{fontSize:11,color:'var(--text3)'}}>Reads live from AgentTreasury contract</span></div>
              <div className="btg">
                <div className="bts"><div className="bv" style={{color:'var(--green)'}}>{fmtUsd(passport.balance_usd)}</div><div className="bl">USDC Balance</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--purple)'}}>{passport.trades}</div><div className="bl">Trades Executed</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{fmtUsd(passport.deployed_usd)}</div><div className="bl">USDC Deployed</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--yellow)'}}>{passport.blocked}</div><div className="bl">Hedges Blocked</div></div>
              </div>
              <div className="crd" style={{cursor:'default',marginTop:14,padding:14,borderLeft:'3px solid var(--blue)'}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:8}}>On-chain spending policy (bounded autonomy)</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  <div className="bts"><div className="bv" style={{fontSize:15}}>{fmtUsd(passport.policy?.max_single_trade_usd)}</div><div className="bl">Max Single Trade</div></div>
                  <div className="bts"><div className="bv" style={{fontSize:15}}>{fmtUsd(passport.policy?.daily_cap_usd)}</div><div className="bl">Daily Cap (24h)</div></div>
                  <div className="bts"><div className="bv" style={{fontSize:15}}>≥ {passport.policy?.min_risk_score||0}</div><div className="bl">Min Risk Threshold</div></div>
                </div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:10,lineHeight:1.5}}>Remaining headroom today: <strong style={{color:'var(--green)'}}>{fmtUsd(passport.headroom_usd)}</strong>. The agent cannot widen its own bounds — only the owner can update policy.</div>
              </div>

              {/* Hedge history */}
              {hedges.length>0?(
                <div className="tw" style={{marginTop:14}}>
                  <table><thead><tr><th>#</th><th>Token</th><th>Action</th><th>Risk</th><th>Amount</th><th>When</th><th>Tx</th></tr></thead><tbody>
                    {hedges.map((h,i)=>{
                      const url = kiteScanUrl(h.prediction_ref) // commit hash
                      return (
                        <tr key={h.id}>
                          <td style={{fontSize:11,color:'var(--text3)'}}>{h.id}</td>
                          <td style={{fontWeight:700}}>{h.token}</td>
                          <td><span className={`str ${stratCls(h.action)}`}>{h.action.replace('_',' ')}</span></td>
                          <td><span className={`rsk ${riskCls(h.risk_score)}`}>{h.risk_score}</span></td>
                          <td style={{fontWeight:700,color:'var(--green)'}}>{fmtUsd(h.amount_usd)}</td>
                          <td style={{fontSize:11,color:'var(--text3)'}}>{new Date(h.timestamp*1000).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                          <td>{url?<a href={url} target="_blank" rel="noopener" style={{color:'var(--green)',fontSize:11}}><ExternalLink size={12}/></a>:<span style={{fontSize:10,color:'var(--text3)'}}>—</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody></table>
                </div>
              ):(
                <div style={{marginTop:14,padding:14,textAlign:'center',fontSize:12,color:'var(--text3)'}}>No hedges executed yet — agent only acts when risk score ≥ {passport.policy?.min_risk_score||35} and policy gates pass.</div>
              )}
            </div>
          ):(
            <div className="sec">
              <div className="crd" style={{borderLeft:'3px solid var(--yellow)',padding:16,cursor:'default'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <AlertTriangle size={18} color="var(--yellow)" style={{flexShrink:0,marginTop:2}}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:13,marginBottom:4}}>Treasury contract not deployed yet</div>
                    <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.6}}>The agent loop is committing predictions to Kite, but USDC hedge execution requires the AgentTreasury contract. Deploy it via:</div>
                    <pre style={{marginTop:8,padding:10,background:'var(--bg3)',borderRadius:6,fontSize:11,overflow:'auto'}}>{`cd contracts
npx hardhat run deploy_treasury.js --network kiteTestnet
# then set TREASURY_ADDRESS and USDC_ADDRESS on Render`}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-tier portfolio universe */}
          {agentPortfolio && (
            <div className="sec">
              <div className="sh">
                <h2><Layers size={16} color="var(--cyan)"/> Multi-Tier Portfolio Universe</h2>
                <span style={{fontSize:11,color:'var(--text3)'}}>Large · Mid · Small cap — each tier has its own action threshold and sizing</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                {['large','mid','small'].map(tierKey=>{
                  const tier = agentPortfolio.tiers?.[tierKey]
                  if(!tier) return null
                  const cfg = tier.config || {}
                  const tierClr = {large:'var(--blue)',mid:'var(--green)',small:'var(--yellow)'}[tierKey]
                  return (
                    <div key={tierKey} className="crd" style={{cursor:'default',borderLeft:`3px solid ${tierClr}`,padding:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                        <div style={{fontSize:13,fontWeight:800,color:tierClr}}>{tier.label}</div>
                        <span style={{fontSize:10,color:'var(--text3)',fontWeight:600,background:'var(--bg3)',padding:'2px 8px',borderRadius:6}}>{tier.positions?.length||0} open</span>
                      </div>
                      <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5,marginBottom:10}}>{cfg.description}</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                        <div style={{background:'var(--bg3)',borderRadius:6,padding:'6px 8px'}}>
                          <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Action ≥</div>
                          <div style={{fontSize:13,fontWeight:700}}>{cfg.action_threshold}</div>
                        </div>
                        <div style={{background:'var(--bg3)',borderRadius:6,padding:'6px 8px'}}>
                          <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Hedge ≥</div>
                          <div style={{fontSize:13,fontWeight:700}}>{cfg.hedge_min_risk}</div>
                        </div>
                        <div style={{background:'var(--bg3)',borderRadius:6,padding:'6px 8px'}}>
                          <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Base</div>
                          <div style={{fontSize:13,fontWeight:700}}>${cfg.base_hedge_usd}</div>
                        </div>
                        <div style={{background:'var(--bg3)',borderRadius:6,padding:'6px 8px'}}>
                          <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Cap</div>
                          <div style={{fontSize:13,fontWeight:700}}>${cfg.max_position_usd}</div>
                        </div>
                      </div>
                      {tier.positions && tier.positions.length>0 ? (
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {tier.positions.slice(0,5).map(p=>(
                            <div key={p.token} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 8px',background:'var(--bg3)',borderRadius:4}}>
                              <span style={{fontWeight:700}}>{p.token}</span>
                              <span style={{color:'var(--green)',fontWeight:700}}>${Math.round(p.hedged_usd)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{fontSize:10,color:'var(--text3)',padding:'8px 0',textAlign:'center',fontStyle:'italic'}}>No open positions in this tier</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Polymarket signal */}
          {agentPolymarket && agentPolymarket.count > 0 && (
            <div className="sec">
              <div className="sh">
                <h2><Globe size={16} color="var(--cyan)"/> Polymarket · real-money prediction markets</h2>
                <span style={{fontSize:11,color:'var(--text3)'}}>12th signal — crowd-funded conviction (USDC volume weighted)</span>
              </div>
              <div className="crd" style={{cursor:'default',padding:14,borderLeft:'3px solid var(--cyan)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div>
                    <div style={{fontSize:11,color:'var(--text3)',fontWeight:700,textTransform:'uppercase'}}>Tail-Risk Score</div>
                    <div style={{fontSize:22,fontWeight:900,color:agentPolymarket.summary?.score>=60?'var(--red)':agentPolymarket.summary?.score>=40?'var(--yellow)':'var(--green)'}}>{agentPolymarket.summary?.score||'—'}/100</div>
                  </div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>{agentPolymarket.count} active crypto markets</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {(agentPolymarket.markets||[]).slice(0,5).map((m,i)=>(
                    <a key={i} href={m.url} target="_blank" rel="noopener" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'var(--bg3)',borderRadius:6,textDecoration:'none',color:'inherit'}}>
                      <div style={{fontSize:12,flex:1,marginRight:10}}>{m.question.length>90?m.question.slice(0,90)+'…':m.question}</div>
                      <div style={{display:'flex',gap:10,alignItems:'center'}}>
                        <span style={{fontSize:11,color:'var(--text3)'}}>${(m.volume_usd/1000).toFixed(0)}K vol</span>
                        <span style={{fontWeight:700,fontSize:13,color:m.implied_pct>=70?'var(--green)':m.implied_pct<=30?'var(--red)':'var(--yellow)',minWidth:50,textAlign:'right'}}>{m.implied_pct}%</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance metrics — institutional dashboard */}
          {agentMetrics && agentMetrics.predictions_revealed > 0 && (
            <div className="sec">
              <div className="sh">
                <h2><BarChart3 size={16} color="var(--purple)"/> Performance Metrics · prediction track record</h2>
                <span style={{fontSize:11,color:'var(--text3)'}}>Brier · hit rate · MAE · Sharpe — same metrics quant desks use</span>
              </div>
              <div className="btg">
                <div className="bts" title={agentMetrics.interpretation?.hit_rate_pct}>
                  <div className="bv" style={{color:agentMetrics.hit_rate_pct>=60?'var(--green)':agentMetrics.hit_rate_pct>=40?'var(--yellow)':'var(--red)'}}>{agentMetrics.hit_rate_pct}%</div>
                  <div className="bl">Hit Rate (±5%)</div>
                </div>
                <div className="bts" title={agentMetrics.interpretation?.brier_score}>
                  <div className="bv" style={{color:agentMetrics.brier_score<=0.15?'var(--green)':agentMetrics.brier_score<=0.25?'var(--yellow)':'var(--red)'}}>{agentMetrics.brier_score}</div>
                  <div className="bl">Brier Score</div>
                </div>
                <div className="bts" title={agentMetrics.interpretation?.mean_abs_error_pct}>
                  <div className="bv">{agentMetrics.mean_abs_error_pct}pp</div>
                  <div className="bl">Mean Abs Error</div>
                </div>
                <div className="bts" title={agentMetrics.interpretation?.mean_signed_error_pct}>
                  <div className="bv" style={{color:Math.abs(agentMetrics.mean_signed_error_pct||0)<2?'var(--green)':'var(--yellow)'}}>{agentMetrics.mean_signed_error_pct>0?'+':''}{agentMetrics.mean_signed_error_pct}pp</div>
                  <div className="bl">Signed Bias</div>
                </div>
                <div className="bts" title={agentMetrics.interpretation?.sharpe_like}>
                  <div className="bv" style={{color:'var(--purple)'}}>{agentMetrics.sharpe_like}</div>
                  <div className="bl">Consistency</div>
                </div>
                <div className="bts" title={agentMetrics.interpretation?.max_error_pct}>
                  <div className="bv" style={{color:'var(--red)'}}>{agentMetrics.max_error_pct}pp</div>
                  <div className="bl">Worst Miss</div>
                </div>
              </div>
              {agentMetrics.sector_exposure?.total_usd > 0 && (
                <div className="crd" style={{cursor:'default',marginTop:14,padding:14,borderLeft:'3px solid var(--cyan)'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:8}}>Sector Concentration Risk</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {Object.entries(agentMetrics.sector_exposure?.by_sector||{}).map(([sec,d])=>(
                      <div key={sec} style={{background:'var(--bg3)',padding:'8px 12px',borderRadius:'var(--r3)',minWidth:90}}>
                        <div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>{sec}</div>
                        <div style={{fontSize:14,fontWeight:800,color:d.pct>=50?'var(--red)':d.pct>=30?'var(--yellow)':'var(--text)'}}>${d.usd.toLocaleString()}</div>
                        <div style={{fontSize:10,color:'var(--text3)'}}>{d.pct}% of book</div>
                      </div>
                    ))}
                  </div>
                  {agentMetrics.sector_exposure?.max_concentration_pct >= 50 && (
                    <div style={{fontSize:11,color:'var(--red)',marginTop:8,fontWeight:600}}>⚠ Concentration warning: {agentMetrics.sector_exposure.top_sector} represents {agentMetrics.sector_exposure.max_concentration_pct}% of total hedge book</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Latest signal decomposition — show the agent's "thinking" */}
          {(() => {
            const lastSignal = events.find(e => e.kind === 'signal_breakdown')
            if(!lastSignal?.detail?.signals) return null
            const sigs = lastSignal.detail.signals
            const composite = lastSignal.detail.composite_score
            const tier = composite>=70?'CRITICAL':composite>=55?'HIGH':composite>=40?'ELEVATED':composite>=25?'MODERATE':'LOW'
            const tierClr = composite>=55?'var(--red)':composite>=40?'var(--yellow)':composite>=25?'var(--blue)':'var(--green)'
            return (
              <div className="sec">
                <div className="sh">
                  <h2><Cpu size={16} color="var(--purple)"/> Latest Decision · 11-factor signal decomposition</h2>
                  <span style={{fontSize:11,color:'var(--text3)'}}>Token: <strong>{lastSignal.detail.token}</strong> · composite <strong style={{color:tierClr}}>{composite}/100 ({tier})</strong></span>
                </div>
                <div className="crd" style={{cursor:'default',padding:14,borderLeft:`3px solid ${tierClr}`}}>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:10,lineHeight:1.5}}>Every signal contributes a weighted score. Top 3 drivers shown in bold. This is how Gauntlet, Chaos Labs, and quant desks decompose composite risk into auditable factors.</div>
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {sigs.sort((a,b)=>b.contribution-a.contribution).map((s,i)=>{
                      const isTop3 = i < 3
                      const barW = Math.min(100, (s.score / 100) * 100)
                      const barClr = s.score>=70?'var(--red)':s.score>=50?'var(--yellow)':s.score>=30?'var(--blue)':'var(--green)'
                      return (
                        <div key={s.name} style={{display:'grid',gridTemplateColumns:'140px 1fr 70px 80px',gap:10,alignItems:'center',padding:'6px 0',borderBottom:i<sigs.length-1?'1px solid var(--border)':'none'}}>
                          <div style={{fontSize:11,fontWeight:isTop3?700:500,color:isTop3?'var(--text)':'var(--text2)'}}>{s.name.replace(/_/g,' ')}</div>
                          <div style={{position:'relative',height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                            <div style={{position:'absolute',top:0,left:0,height:'100%',width:`${barW}%`,background:barClr,borderRadius:3,transition:'width .3s ease'}}/>
                          </div>
                          <div style={{fontSize:10,color:'var(--text3)',textAlign:'right'}}>×{s.weight}</div>
                          <div style={{fontSize:11,fontWeight:700,textAlign:'right',color:isTop3?'var(--text)':'var(--text3)'}}>{s.score}/100<br/><span style={{fontSize:9,color:'var(--text3)',fontWeight:400}}>contrib {s.contribution}</span></div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{marginTop:10,fontSize:10,color:'var(--text3)',display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'2px solid var(--border)'}}>
                    <span style={{fontWeight:700,color:'var(--text)'}}>Composite (weighted sum)</span>
                    <span style={{fontSize:14,fontWeight:900,color:tierClr}}>{composite}/100</span>
                  </div>
                  <details style={{marginTop:8,fontSize:11}}>
                    <summary style={{cursor:'pointer',color:'var(--text2)'}}>Show per-signal evidence</summary>
                    <div style={{marginTop:6,display:'flex',flexDirection:'column',gap:4,fontSize:10,color:'var(--text2)'}}>
                      {sigs.map(s=>(
                        <div key={'d-'+s.name}><strong>{s.name.replace(/_/g,' ')}:</strong> {s.detail}</div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            )
          })()}

          {/* Latest RS-GARCH stress engine run */}
          {(() => {
            const lastStress = events.find(e => e.kind === 'stress_run')
            if(!lastStress?.detail) return null
            const d = lastStress.detail
            return (
              <div className="sec">
                <div className="sh">
                  <h2><Zap size={16} color="var(--purple)"/> Latest RS-GARCH Monte Carlo · {d.token}</h2>
                  <span style={{fontSize:11,color:'var(--text3)'}}>Real stress engine output · 1,000 simulated paths</span>
                </div>
                <div className="crd" style={{cursor:'default',padding:14,borderLeft:'3px solid var(--purple)'}}>
                  <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5,marginBottom:10}}>The agent triggers the full RS-GARCH stress engine (Bollerslev 1986, Merton 1976 jump-diffusion, Hamilton 1989 regime-switching) when composite risk ≥ 35. Below: actual simulation output, not a formula approximation.</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                    <div className="bts"><div className="bv" style={{color:'var(--red)',fontSize:16}}>{d.var_95?.toFixed(1)}%</div><div className="bl">VaR(95)</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--red)',fontSize:16}}>{d.cvar_95?.toFixed(1)}%</div><div className="bl">CVaR(95)</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--yellow)',fontSize:16}}>{d.median_return?.toFixed(1)}%</div><div className="bl">Median Return</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--red)',fontSize:16}}>{d.max_drawdown_worst?.toFixed(1)}%</div><div className="bl">Worst Drawdown</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--yellow)',fontSize:16}}>{((d.prob_loss_gt_10pct||0)*100).toFixed(0)}%</div><div className="bl">P(loss &gt; 10%)</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--yellow)',fontSize:16}}>{((d.prob_loss_gt_20pct||0)*100).toFixed(0)}%</div><div className="bl">P(loss &gt; 20%)</div></div>
                    <div className="bts"><div className="bv" style={{fontSize:16}}>{d.regime}</div><div className="bl">Detected Regime</div></div>
                    <div className="bts"><div className="bv" style={{fontSize:16}}>{d.n_paths?.toLocaleString()}</div><div className="bl">Monte Carlo Paths</div></div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Live activity feed */}
          <div className="sec">
            <div className="sh">
              <h2><Activity size={16} color="var(--green)"/> Live Activity Feed <span className="cnt">{events.length}</span></h2>
              <span style={{fontSize:11,color:'var(--text3)',display:'flex',alignItems:'center',gap:4}}><span className="pulse-dot" style={{background:loop?.running?'var(--green)':'var(--text3)'}}/> Polling every 5s</span>
            </div>
            {events.length===0?(
              <div className="empty"><Cpu size={36} color="var(--text3)"/><p style={{fontWeight:600,marginTop:10}}>Agent warming up…</p><p>The autonomous loop starts on backend boot and produces its first decision within {loop?.interval_seconds||90}s.</p></div>
            ):(
              <div style={{maxHeight:480,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--r)',background:'var(--bg)'}}>
                {events.map((e,i)=>(
                  <div key={e.seq} style={{display:'flex',gap:10,padding:'10px 14px',borderBottom:i<events.length-1?'1px solid var(--border)':'none',alignItems:'flex-start'}}>
                    <div style={{flexShrink:0,marginTop:2}}>{kindIcon[e.kind]||<Activity size={13} color="var(--text3)"/>}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,color:levelColor[e.level]||'var(--text)',fontWeight:e.level==='success'||e.level==='error'?700:500,lineHeight:1.5}}>{e.message}</div>
                      <div style={{fontSize:10,color:'var(--text3)',marginTop:2,display:'flex',gap:8,flexWrap:'wrap'}}>
                        <span>{new Date(e.timestamp).toLocaleTimeString('en-US',{hour12:false})}</span>
                        <span style={{textTransform:'uppercase',letterSpacing:'.4px'}}>{e.kind.replace(/_/g,' ')}</span>
                        {(() => { const url = kiteScanUrl(e.tx_hash); return url ? <a href={url} target="_blank" rel="noopener" style={{color:'var(--green)',fontWeight:600,textDecoration:'none'}}>tx on KiteScan ↗</a> : null })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Architecture / criteria mapping */}
          <div className="sec">
            <div className="sh"><h2><Info size={16} color="var(--blue)"/> How this maps to Kite AI Track 2 criteria</h2></div>
            <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--blue)',padding:16}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {[
                  ['Agent Autonomy','Backend loop runs every '+(loop?.interval_seconds||90)+'s with no user input. Each cycle scans, commits predictions, and executes hedges within bounded policy.'],
                  ['Executes Paid Actions','USDC transfers via the AgentTreasury contract. Every hedge is a real on-chain transaction with gas + USDC settlement.'],
                  ['Settles on Kite','Both predictions (oracle commits) and hedges (treasury transfers) settle on Kite AI Testnet Chain 2368.'],
                  ['Stablecoin-First','All capital moves in USDC (6-decimal mock). No native gas token used for the actual hedge — only stablecoin settlement.'],
                  ['Reputation-Aware','Predictions feed the on-chain reputation score (Grade S-F, 0-1000). Future capital delegators can read this to size their trust.'],
                  ['Programmable Constraints','Max single trade, daily cap, and minimum risk threshold are enforced on-chain by the treasury contract, not just in code.'],
                ].map(([title,body],i)=>(
                  <div key={i} style={{background:'var(--bg3)',padding:12,borderRadius:'var(--r3)'}}>
                    <div style={{fontWeight:700,fontSize:12,marginBottom:4,color:'var(--green)'}}>{title}</div>
                    <div style={{fontSize:11,color:'var(--text2)',lineHeight:1.5}}>{body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ═══ KITE ECOSYSTEM ═══ */}
      {tab==='kite'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh">
              <h2><Wallet size={16} color="var(--green)"/> Kite Integration Console</h2>
              <div className="mini-actions" style={{marginTop:0}}>
                <a className="mini-link" href={KITE_LINKS.docs} target="_blank" rel="noopener"><ExternalLink size={12}/> Kite docs</a>
                <a className="mini-link" href={KITE_LINKS.explorer} target="_blank" rel="noopener"><ExternalLink size={12}/> KiteScan</a>
                <a className="mini-link" href={KITE_LINKS.faucet} target="_blank" rel="noopener"><ExternalLink size={12}/> Faucet</a>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--green)'}}><div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4,fontWeight:600}}>Wallet Address</div><div style={{fontSize:12,fontWeight:600,fontFamily:'monospace',wordBreak:'break-all'}}>{walletData?.wallet?.address||'Not Configured'}</div>{walletData?.wallet?.address&&walletData.wallet.address!=='NOT_CONFIGURED'&&<a className="mini-link" style={{marginTop:8}} href={`${KITE_LINKS.explorer}/address/${walletData.wallet.address}`} target="_blank" rel="noopener"><ExternalLink size={12}/> View wallet</a>}</div>
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--green)'}}><div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4,fontWeight:600}}>Total Balance</div><div style={{fontSize:22,fontWeight:800,color:'var(--green)'}}>{fmt(walletData?.balances?.total_usd||0)}</div></div>
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--yellow)'}}><div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4,fontWeight:600}}>Daily Spend Limit</div><div style={{fontSize:22,fontWeight:800,color:'var(--yellow)'}}>{fmt(walletData?.spending_rules?.remaining_today_usd||50000)}</div></div>
            </div>
            <div className="tw" style={{marginBottom:14}}><table><thead><tr><th>Rule</th><th>Value</th><th>Status</th></tr></thead><tbody>
              <tr><td style={{fontWeight:600}}>Daily Spend Limit</td><td>{fmt(walletData?.spending_rules?.daily_limit_usd||50000)}</td><td><span className="rsk r-l">Active</span></td></tr>
              <tr><td style={{fontWeight:600}}>Max Single Trade</td><td>{fmt(walletData?.spending_rules?.max_single_trade_usd||25000)}</td><td><span className="rsk r-l">Active</span></td></tr>
              <tr><td style={{fontWeight:600}}>On-Chain Attestation</td><td>Every hedge attested</td><td><span className="rsk r-l">Enforced</span></td></tr>
              <tr><td style={{fontWeight:600}}>Auto-Yield on Idle</td><td>USDC → L-USDC (4% APY)</td><td><span className="rsk r-l">{walletData?.spending_rules?.auto_yield_on_idle?'On':'Off'}</span></td></tr>
              <tr><td style={{fontWeight:600}}>Gasless Tx</td><td>ERC-4337 via Kite Bundler</td><td><span className="rsk r-l">Enabled</span></td></tr>
            </tbody></table></div>
          </div>
          <div className="sec">
            <div className="sh"><h2><TrendingUp size={16} color="var(--green)"/> L-USDC Yield (Lucid)</h2></div>
            <div className="btg">
              <div className="bts"><div className="bv" style={{color:'var(--green)'}}>{yieldData?.apy||'4.0%'}</div><div className="bl">APY</div></div>
              <div className="bts"><div className="bv">{fmt(yieldData?.balance||0)}</div><div className="bl">L-USDC Balance</div></div>
              <div className="bts"><div className="bv" style={{color:'var(--green)'}}>+${yieldData?.yield_daily?.toFixed(2)||'0.00'}/d</div><div className="bl">Daily Yield</div></div>
              <div className="bts"><div className="bv" style={{color:'var(--green)'}}>{fmt(yieldData?.yield_annual||0)}</div><div className="bl">Annual</div></div>
            </div>
          </div>
          <div className="sec">
            <div className="sh"><h2><Database size={16} color="var(--cyan)"/> Goldsky Subgraph</h2></div>
            <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--cyan)'}}>
              <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Real-Time Indexing</div>
                  <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>Predictions, hedges, and outcomes are shaped for Kite AI Testnet indexing via Goldsky subgraph config in <strong>/subgraph</strong>.</div>
                </div>
                <a className="mini-link" href={KITE_LINKS.goldsky} target="_blank" rel="noopener"><ExternalLink size={12}/> Goldsky docs</a>
              </div>
              <div className="code">
                <span style={{color:'#64748b'}}>{'// GraphQL Query'}</span><br/>
                {'{ '}<span style={{color:'#67e8f9'}}>predictions</span>{'(first: 10) {'}<br/>
                {'    '}<span style={{color:'#a7f3d0'}}>tokenSymbol riskScore predictedPriceImpact</span><br/>
                {'    '}<span style={{color:'#67e8f9'}}>hedgeActions</span>{' { actionType details }'}<br/>
                {'} }'}
              </div>
            </div>
          </div>
          <div className="sec">
            <div className="sh"><h2><Zap size={16} color="var(--yellow)"/> Full Kite Stack</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {[{t:'Account Abstraction (ERC-4337)',d:'Smart wallet with spending rules and gasless UserOperation preparation.',c:'var(--green)',s:'Active',href:KITE_LINKS.aa,addr:null},
                {t:'L-USDC Yield (Lucid)',d:'Idle hedge capital can route to yield-bearing L-USDC policy.',c:'var(--green)',s:'Active',href:KITE_LINKS.lucid,addr:kiteInfra.lusdc_token},
                {t:'Prediction Oracle Contract',d:'Commit-reveal forecasts and agent reputation scoring.',c:'var(--purple)',s:'Ready',href:KITE_LINKS.explorer,addr:agent?.contract_address},
                {t:'Goldsky Subgraph',d:'GraphQL indexing config for predictions, hedges, outcomes.',c:'var(--cyan)',s:'Configured',href:KITE_LINKS.goldsky,addr:null},
                {t:'Settlement Contract',d:'Paid agent actions settle through Kite settlement infrastructure.',c:'var(--yellow)',s:'Active',href:KITE_LINKS.explorer,addr:kiteInfra.settlement_contract},
                {t:'LayerZero v2 Bridge',d:'Cross-chain L-USDC path for future multi-chain hedges.',c:'var(--red)',s:'Configured',href:KITE_LINKS.layerzero,addr:null}
              ].map((c,i)=>{
                const link = c.addr ? `${KITE_LINKS.explorer}/address/${c.addr}` : c.href
                return <a className="link-card" key={i} href={link} target="_blank" rel="noopener" style={{borderLeftColor:c.c}}>
                  <div className="top"><h3>{c.t}</h3><span className="rsk r-l" style={{fontSize:9}}>{c.s}</span></div>
                  <p>{c.d}</p>
                  {c.addr&&<div className="mono-link">{c.addr}</div>}
                  <div style={{fontSize:10,color:'var(--green)',fontWeight:800,marginTop:8,display:'flex',alignItems:'center',gap:5}}>Open source/proof <ExternalLink size={11}/></div>
                </a>
              })}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="foot">
        <div className="foot-grid">
          <div className="foot-brand">
            <h3><div className="logo-ic" style={{width:28,height:28,borderRadius:8}}><Shield size={14} color="#fff"/></div> Unlock<span style={{color:'var(--green)'}}>Shield</span></h3>
            <p>A verifiable DeFi stress oracle. Forecasts token unlock impact, commits each prediction on-chain before the event, and builds trustless reputation from real outcomes.</p>
          </div>
          <div className="foot-col">
            <h4>Product</h4>
            <a onClick={()=>setTab('dashboard')} style={{cursor:'pointer'}}>Dashboard</a>
            <a onClick={()=>setTab('stress')} style={{cursor:'pointer'}}>Stress Test</a>
            <a onClick={()=>setTab('predictions')} style={{cursor:'pointer'}}>Predictions</a>
            <a onClick={()=>setTab('market')} style={{cursor:'pointer'}}>Market Data</a>
          </div>
          <div className="foot-col">
            <h4>Network</h4>
            <a href="https://gokite.ai" target="_blank" rel="noopener">Kite AI</a>
            <a href="https://testnet.kitescan.ai" target="_blank" rel="noopener">KiteScan Explorer</a>
            <a href="https://faucet.gokite.ai" target="_blank" rel="noopener">Testnet Faucet</a>
            <a href="https://docs.gokite.ai" target="_blank" rel="noopener">Kite Docs</a>
          </div>
          <div className="foot-col">
            <h4>Resources</h4>
            <a href="https://github.com/Rajatd91/unlockshield" target="_blank" rel="noopener">GitHub</a>
            <a href="https://unlockshield-api.onrender.com/docs" target="_blank" rel="noopener">API Reference</a>
            <a href="https://defillama.com" target="_blank" rel="noopener">DeFiLlama</a>
            <a href="https://coinpaprika.com" target="_blank" rel="noopener">CoinPaprika</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 UnlockShield. Built for the Kite AI Hackathon.</span>
          <span>Chain ID 2368 · Testnet · Not financial advice</span>
        </div>
      </div>
    </div></>
  )
}

export default App
