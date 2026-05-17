import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Shield, AlertTriangle, TrendingDown, TrendingUp, Activity, Zap, ExternalLink,
  RefreshCw, CheckCircle, BarChart3, Globe, Clock, Target, ArrowUpRight,
  ArrowDownRight, Cpu, Database, Eye, ChevronDown, ChevronRight, Info,
  PieChart, Layers, Wallet, Search, Filter, Gauge, Flame, Snowflake,
  ArrowRight, Lock, Unlock, Play, ChevronUp, X, ArrowLeft, Bell, ChevronLeft
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

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

/* Responsive */
@media(max-width:1024px){.stats{grid-template-columns:repeat(3,1fr)}.btg{grid-template-columns:repeat(2,1fr)}.panel{width:100%;max-width:100%}.regime-modal{width:95vw}}
@media(max-width:768px){.stats{grid-template-columns:repeat(2,1fr)}.app{padding:0 14px 40px}.hdr{margin:0 -14px;padding:10px 14px}.tabs{overflow-x:auto;width:100%}}
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
const fmtD = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
const daysUntil = d => Math.ceil((new Date(d)-new Date())/864e5)
const clr = v => v>0?'var(--green)':v<0?'var(--red)':'var(--text3)'
const riskCls = s => s>=80?'r-c':s>=55?'r-h':s>=35?'r-m':'r-l'
const riskLabel = s => s>=80?'CRITICAL':s>=55?'HIGH':s>=35?'MEDIUM':'LOW'
const stratCls = s => ({FULL_EXIT:'s-exit',REDUCE_POSITION:'s-reduce',SHORT_HEDGE:'s-hedge',OPTIONS_PUT:'s-put',DCA_EXIT:'s-dca'})[s]||''
const barClr = s => s>=70?'var(--red)':s>=45?'var(--yellow)':'var(--green)'
const SECTOR_COLORS = {L1:'#3b82f6',L2:'#8b5cf6',DeFi:'#059669',Gaming:'#d97706',Infra:'#0891b2',Stable:'#6b7280',Meme:'#ec4899',Other:'#6b7280'}

/* ═══ Sparkline Mini Chart (7d from CoinGecko sparkline data) ═══ */
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
  const maxPct=Math.max(...unlocks.map(u=>u.total_supply_percent||1),1)
  return(
    <div className="chart-wrap">
      <div style={{fontSize:13,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
        <Clock size={15} color="var(--green)"/> Unlock Timeline — Next 90 Days
      </div>
      <svg width="100%" height="130" viewBox="0 0 700 130" preserveAspectRatio="xMidYMid meet">
        <line x1="30" y1="100" x2="680" y2="100" stroke="#e0e8e3" strokeWidth="2"/>
        {unlocks.slice(0,15).map((u,i)=>{
          const d=daysUntil(u.unlock_date)
          const x=30+Math.min(Math.max(d,0),90)/90*650
          const h=Math.max((u.total_supply_percent/maxPct)*60,10)
          const risk=u.total_supply_percent>=5?'#dc2626':u.total_supply_percent>=2?'#d97706':'#059669'
          return(
            <g key={i} style={{cursor:'pointer'}} onClick={()=>onSelect&&onSelect(u)}>
              <rect x={x-10} y={100-h} width="20" height={h} rx="4" fill={risk} opacity=".75" onMouseEnter={e=>e.target.style.opacity='1'} onMouseLeave={e=>e.target.style.opacity='.75'}/>
              <text x={x} y={114} textAnchor="middle" fontSize="9" fill="#6b8077" fontWeight="600">{u.token_symbol}</text>
              <text x={x} y={93-h} textAnchor="middle" fontSize="9" fill={risk} fontWeight="700">{u.total_supply_percent}%</text>
            </g>
          )
        })}
        <text x="30" y="126" fontSize="9" fill="#9ca3af">Today</text>
        <text x="680" y="126" fontSize="9" fill="#9ca3af" textAnchor="end">90 days</text>
      </svg>
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
          <strong>Data Sources:</strong> Market breadth from CoinGecko top 100 tokens • Fear & Greed from Alternative.me API •
          BTC dominance from CoinGecko global • Market momentum from 24h total market cap change •
          Meme coin strength from sector average performance
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
              {/* 7-day sparkline from CoinGecko data */}
              {sparkline.length > 5 ? (
                <div style={{marginBottom:10,background:'var(--bg3)',borderRadius:'var(--r3)',padding:10}}>
                  <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,marginBottom:4,textTransform:'uppercase'}}>7-Day Price Chart (CoinGecko)</div>
                  <Sparkline7d data={sparkline} width={440} height={60}/>
                </div>
              ) : (
                /* Fallback sparkline from price changes */
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
              <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>Data: CoinGecko API (real-time)</div>
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
                  <div style={{fontSize:13,fontWeight:700,color:'var(--green)'}}>{analysis?.recommended_action?.replace('_',' ')||'PENDING'}</div>
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
          {analysis?.attestation?.tx_hash!=='0x'+'0'.repeat(64)&&analysis?.attestation&&<a href={analysis.attestation.explorer_url} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:6,color:'var(--green)',fontWeight:600,fontSize:12,textDecoration:'none'}}><CheckCircle size={14}/> View On-Chain Attestation <ExternalLink size={12}/></a>}
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
  const [unlocks,setUnlocks] = useState([])
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
  const TOKENS_PER_PAGE = 50

  const toast = useCallback((title,msg,type='g')=>{
    const id=Date.now()+Math.random()
    setToasts(prev=>[...prev,{id,title,msg,type}])
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),4000)
  },[])

  const load = useCallback(async()=>{
    setLoading(true)
    try{
      const [u,p,s,h,m,bt,w,y] = await Promise.all([
        fetch(`${API}/api/unlocks/upcoming`).then(r=>r.json()).catch(()=>({unlocks:[]})),
        fetch(`${API}/api/portfolio/holdings`).then(r=>r.json()).catch(()=>null),
        fetch(`${API}/api/agent/status`).then(r=>r.json()).catch(()=>null),
        fetch(`${API}/api/agent/history`).then(r=>r.json()).catch(()=>({hedges:[]})),
        fetch(`${API}/api/market/overview`).then(r=>r.json()).catch(()=>null),
        fetch(`${API}/api/backtest/summary`).then(r=>r.json()).catch(()=>null),
        fetch(`${API}/api/wallet/status`).then(r=>r.json()).catch(()=>null),
        fetch(`${API}/api/wallet/yield`).then(r=>r.json()).catch(()=>null),
      ])
      setUnlocks(u.unlocks||[]);setPortfolio(p);setAgent(s);setHedges(h.hedges||[]);setMarket(m);setBacktest(bt);setWalletData(w);setYieldData(y)
    }catch(e){console.error(e)}
    setLoading(false)
  },[])

  useEffect(()=>{load()},[load])

  const scan = async()=>{
    setScanning(true);setScanStep(0)
    toast('Agent Scan Started','Fetching unlock data...','y')
    await new Promise(r=>setTimeout(r,800));setScanStep(1)
    toast('Analyzing Risk','AI evaluating risk factors...','y')
    try{
      const r=await fetch(`${API}/api/agent/scan`,{method:'POST'});const d=await r.json()
      setScanStep(2);toast('Executing Hedges','Applying strategies...','y')
      await new Promise(r=>setTimeout(r,600));setScanStep(3)
      toast('Recording On-Chain','Attesting to Kite blockchain...','y')
      await new Promise(r=>setTimeout(r,500));setScanStep(4)
      setAnalyses(d.results||[])
      const critical=(d.results||[]).filter(r=>r.risk_score>=55).length
      toast('Scan Complete',`${(d.results||[]).length} tokens analyzed, ${critical} alerts`,'g')
      await load()
    }catch(e){console.error(e);toast('Scan Error','Failed to connect','r')}
    setTimeout(()=>{setScanning(false);setScanStep(-1)},1500)
  }

  const runBT = async()=>{
    toast('Running Backtest','Simulating on historical events...','y')
    try{const r=await fetch(`${API}/api/backtest/run`);const d=await r.json();setBacktest(d);toast('Backtest Complete',d.headline||'Done','g')}
    catch(e){console.error(e);toast('Error','Backtest failed','r')}
  }

  const regime=market?.market_regime;const glob=market?.global||{};const fg=market?.fear_greed||{}
  const sectors=market?.sectors||{};const topTokens=market?.top_tokens||[];const anomalies=market?.volume_anomalies||[]

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
      setStressResult(data)
      toast('Stress Test Complete',`${stressToken}: VaR(95%)=${data?.scenarios?.base_case?.var_95}%`,'g')
    } catch(e) { toast('Stress Test Error',e.message,'r') }
    setStressLoading(false)
  }

  // Predictions
  const createPrediction = async () => {
    setPredLoading(true)
    try {
      const p = stressParams
      const res = await fetch(`${API}/api/predictions/create/${stressToken}?unlock_pct=${p.unlock_pct}&unlock_days=${p.unlock_days}&recipient=${encodeURIComponent(p.recipient)}&is_cliff=${p.is_cliff}`,{method:'POST'})
      const data = await res.json()
      toast('Prediction Committed',`${stressToken}: ${data?.predicted_impact}% impact, hash: ${data?.commit_hash?.slice(0,12)}...`,'g')
      fetchPredictions()
    } catch(e) { toast('Prediction Error',e.message,'r') }
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

  const selectedAnalysis=selectedToken?analyses.find(a=>a.token===(selectedToken.token_symbol||selectedToken.symbol)):null
  const selectedUnlock=selectedToken?unlocks.find(u=>u.token_symbol===(selectedToken.token_symbol||selectedToken.symbol)):null

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
          <button className="btn btn-s" onClick={()=>{load();toast('Refreshed','Data updated','g')}}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-p" onClick={scan} disabled={scanning}>
            {scanning?<RefreshCw size={13} className="spin"/>:<Zap size={13}/>}
            {scanning?'Scanning...':'Run Agent Scan'}
          </button>
        </div>
      </div>

      {/* TICKER — ALL ITEMS INTERACTIVE */}
      {market&&(
        <div className="ticker">
          <div className="tk" onClick={()=>{setTab('market');toast('Global Market Cap',`${fmt(glob.total_market_cap)} (${glob.market_cap_change_24h>0?'+':''}${glob.market_cap_change_24h}% 24h)`,'g')}}>
            <div className="tk-l">Global Market Cap</div>
            <div className="tk-v">{fmt(glob.total_market_cap)}</div>
            <div className="tk-c" style={{color:clr(glob.market_cap_change_24h)}}>{glob.market_cap_change_24h>0?'+':''}{glob.market_cap_change_24h}%</div>
            <div className="tk-hint">View Market →</div>
          </div>
          <div className="tk" onClick={()=>{setTab('market');toast('24h Trading Volume',fmt(glob.total_volume_24h),'g')}}>
            <div className="tk-l">24h Volume</div>
            <div className="tk-v">{fmt(glob.total_volume_24h)}</div>
            <div className="tk-hint">View Market →</div>
          </div>
          <div className="tk" onClick={()=>{setTab('market');setSectorFilter('L1');toast('BTC Dominance',`${glob.btc_dominance}% — ${glob.btc_dominance>55?'Risk-off environment':'Risk-on / altseason potential'}`,'g')}}>
            <div className="tk-l">BTC Dominance</div>
            <div className="tk-v">{glob.btc_dominance}%</div>
            <div className="tk-c" style={{fontSize:10,color:'var(--text3)'}}>{glob.btc_dominance>55?'Risk-off':'Altseason signal'}</div>
            <div className="tk-hint">View L1 tokens →</div>
          </div>
          <div className="tk" onClick={()=>{setShowRegime(true);toast('Fear & Greed Index',`${fg.value}/100 — ${fg.classification}`,'g')}}>
            <div className="tk-l">Fear & Greed</div>
            <div className="tk-v" style={{color:fg.value>=60?'var(--green)':fg.value<=35?'var(--red)':'var(--yellow)'}}>
              {fg.value||'--'}<span style={{fontSize:11,color:'var(--text3)',fontWeight:500}}>/100</span>
            </div>
            <div style={{fontSize:10,color:'var(--text3)'}}>{fg.classification||''}</div>
            <div className="tk-hint">View Signals →</div>
          </div>
          {regime&&<div className="tk" onClick={()=>setShowRegime(true)}>
            <div className="tk-l">Market Regime</div>
            <div className={`rgm rgm-${regime.regime?.toLowerCase()}`}>
              {regime.regime==='BULL'?<TrendingUp size={12}/>:regime.regime==='BEAR'?<TrendingDown size={12}/>:<Activity size={12}/>}
              {regime.regime} <span style={{fontWeight:400,opacity:.7}}>{Math.round((regime.confidence||0)*100)}%</span>
            </div>
            <div className="tk-hint">How is this calculated? →</div>
          </div>}
          <div className="tk" onClick={()=>{setTab('market');toast('Tokens Tracked',`${market.tokens_count||0} tokens from CoinGecko top 300`,'g')}}>
            <div className="tk-l">Tokens Tracked</div>
            <div className="tk-v" style={{color:'var(--green)'}}>{market.tokens_count||'300+'}</div>
            <div className="tk-hint">View All →</div>
          </div>
          <div className="tk" onClick={()=>{setTab('kite');toast('DeFi TVL',`${fmt(market.tvl?.total)} total locked — Source: DeFiLlama`,'g')}}>
            <div className="tk-l">DeFi TVL</div>
            <div className="tk-v">{fmt(market.tvl?.total)}</div>
            {market.tvl?.change_7d&&<div className="tk-c" style={{color:clr(market.tvl.change_7d)}}>{market.tvl.change_7d>0?'+':''}{market.tvl.change_7d}% 7d</div>}
            <div className="tk-hint">DeFiLlama →</div>
          </div>
        </div>
      )}

      {/* STATS (CLICKABLE) */}
      <div className="stats">
        <div className="st" onClick={()=>setTab('portfolio')}>
          <div className="st-arrow"><ArrowRight size={14}/></div>
          <div className="st-ic" style={{background:'var(--green-bg)'}}><Wallet size={18} color="var(--green)"/></div>
          <div className="st-label">Portfolio</div>
          <div className="st-val">{portfolio?fmt(portfolio.total_value_usd):'$0'}</div>
          <div className="st-sub">{portfolio?.holdings_count||0} tokens <ArrowRight size={10}/></div>
        </div>
        <div className="st" onClick={()=>setTab('dashboard')}>
          <div className="st-arrow"><ArrowRight size={14}/></div>
          <div className="st-ic" style={{background:'var(--green-bg2)'}}><Shield size={18} color="var(--green)"/></div>
          <div className="st-label">Protected</div>
          <div className="st-val" style={{color:'var(--green)'}}>{portfolio?fmt(portfolio.total_value_protected):'$0'}</div>
          <div className="st-sub">{hedges.length} hedges <ArrowRight size={10}/></div>
        </div>
        <div className="st" onClick={()=>setTab('dashboard')}>
          <div className="st-arrow"><ArrowRight size={14}/></div>
          <div className="st-ic" style={{background:'var(--yellow-bg)'}}><AlertTriangle size={18} color="var(--yellow)"/></div>
          <div className="st-label">Unlock Events</div>
          <div className="st-val" style={{color:'var(--yellow)'}}>{unlocks.length}</div>
          <div className="st-sub">Next 90 days <ArrowRight size={10}/></div>
        </div>
        <div className="st" onClick={()=>{if(!scanning) scan()}}>
          <div className="st-arrow"><Zap size={14}/></div>
          <div className="st-ic" style={{background:'var(--purple-bg)'}}><Cpu size={18} color="var(--purple)"/></div>
          <div className="st-label">AI Engine</div>
          <div className="st-val" style={{fontSize:14,color:'var(--purple)'}}>Claude Sonnet 4</div>
          <div className="st-sub">Click to scan <Zap size={10}/></div>
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
        {[{k:'dashboard',i:<Layers size={13}/>,l:'Dashboard'},{k:'market',i:<Globe size={13}/>,l:`Market (${market?.tokens_count||'100+'})`},{k:'stress',i:<Activity size={13}/>,l:'Stress Test'},{k:'predictions',i:<Target size={13}/>,l:'Predictions'},{k:'backtest',i:<BarChart3 size={13}/>,l:'Backtest'},{k:'portfolio',i:<PieChart size={13}/>,l:'Portfolio'},{k:'kite',i:<Zap size={13}/>,l:'Kite Ecosystem'}].map(t=>(
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
                {['Fetch Unlocks','AI Risk Analysis','Execute Hedges','Record On-Chain'].map((s,i)=>(
                  <div className="scan-step" key={i}>
                    <div className={`scan-dot ${scanStep===i?'active':scanStep>i?'done':'pending'}`}>{scanStep>i?<CheckCircle size={12}/>:scanStep===i?<RefreshCw size={12} className="spin"/>:(i+1)}</div>
                    <div className={`scan-label ${scanStep>=i?'active':''}`}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regime Signals Inline (Dashboard) */}
          {regime && regime.signals && regime.signals.length > 0 && (
            <div className="sec">
              <div className="crd" style={{cursor:'pointer',borderLeft:`3px solid ${regime.regime==='BEAR'?'var(--red)':regime.regime==='BULL'?'var(--green)':'var(--yellow)'}`}} onClick={()=>setShowRegime(true)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className={`rgm rgm-${regime.regime?.toLowerCase()}`}>
                      {regime.regime==='BULL'?<TrendingUp size={12}/>:regime.regime==='BEAR'?<TrendingDown size={12}/>:<Activity size={12}/>}
                      {regime.regime} {Math.round((regime.confidence||0)*100)}%
                    </div>
                    <span style={{fontSize:11,color:'var(--text3)'}}>— {regime.interpretation?.split('.')[0]}</span>
                  </div>
                  <span style={{fontSize:10,color:'var(--green)',fontWeight:600,display:'flex',alignItems:'center',gap:3}}>
                    <Info size={12}/> How is this calculated?
                  </span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:`repeat(${regime.signals.length},1fr)`,gap:6}}>
                  {regime.signals.map((s,i) => (
                    <div key={i} style={{background:'var(--bg3)',borderRadius:'var(--r3)',padding:'8px 10px',textAlign:'center'}}>
                      <div style={{fontSize:9,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:3}}>{s.name}</div>
                      <div style={{fontSize:12,fontWeight:700,color:s.bias==='BULL'?'var(--green)':s.bias==='BEAR'?'var(--red)':'var(--yellow)'}}>{s.bias}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="sec"><UnlockTimeline unlocks={unlocks} onSelect={u=>setSelectedToken(u)}/></div>
          <div className="sec">
            <div className="sh"><h2><AlertTriangle size={16} color="var(--yellow)"/> Upcoming Token Unlocks <span className="cnt">{unlocks.length}</span></h2></div>
            {unlocks.length===0?(
              <div className="empty"><Clock size={36} color="var(--text3)"/><p style={{fontWeight:600,marginTop:10}}>No unlock data yet</p><p>Click <strong style={{color:'var(--green)'}}>Run Agent Scan</strong> to detect unlocks</p>
                <button className="btn btn-p" style={{margin:'16px auto 0'}} onClick={scan} disabled={scanning}><Zap size={13}/> Run Agent Scan</button></div>
            ):(
              <div className="tw"><table><thead><tr><th>Token</th><th>Unlock Date</th><th>Amount</th><th>Supply %</th><th>Risk</th><th>Strategy</th><th>Impact</th><th></th></tr></thead><tbody>
                {unlocks.map((u,i)=>{
                  const a=analyses.find(x=>x.token===u.token_symbol);const rs=a?.risk_score||Math.round(u.total_supply_percent*6.5);const d=daysUntil(u.unlock_date)
                  return(<tr key={i} className="clickable" onClick={()=>setSelectedToken(u)}>
                    <td><div className="tc"><div className="ti">{u.token_symbol?.slice(0,2)}</div><div><div className="tn">{u.token_symbol}</div><div className="ts">{u.token_name}</div></div></div></td>
                    <td><div style={{fontWeight:500}}>{fmtD(u.unlock_date)}</div><div style={{fontSize:10,color:d<=7?'var(--red)':'var(--text3)',fontWeight:d<=7?700:400}}>{d}d away{d<=7&&' ⚠'}</div></td>
                    <td><div style={{fontWeight:600}}>{fmt(u.unlock_amount_usd)}</div><div className="ts">{u.unlock_amount_tokens?.toLocaleString()} tokens</div></td>
                    <td><span style={{fontWeight:700,color:u.total_supply_percent>=5?'var(--red)':u.total_supply_percent>=1?'var(--yellow)':'var(--text)'}}>{u.total_supply_percent}%</span></td>
                    <td><span className={`rsk ${riskCls(rs)}`}>{riskLabel(rs)} {rs}</span></td>
                    <td><span className={`str ${stratCls(a?.recommended_action)}`}>{a?.recommended_action?.replace('_',' ')||'PENDING'}</span></td>
                    <td style={{color:'var(--red)',fontWeight:700}}>{a?.predicted_impact||`~${(-u.total_supply_percent*3).toFixed(0)}%`}</td>
                    <td><ArrowRight size={14} color="var(--text3)"/></td>
                  </tr>)})}
              </tbody></table></div>
            )}
          </div>

          {analyses.length>0&&(
            <div className="sec fade">
              <div className="sh"><h2><Activity size={16} color="var(--green)"/> AI Scan Results <span className="cnt">{analyses.length}</span></h2></div>
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
                      {r.attestation?.tx_hash!=='0x'+'0'.repeat(64)&&r.attestation&&<a href={r.attestation.explorer_url} target="_blank" rel="noopener" style={{display:'inline-flex',alignItems:'center',gap:4,color:'var(--green)',fontSize:11,fontWeight:600,marginTop:8,textDecoration:'none'}}><CheckCircle size={12}/> Verified on Kite <ExternalLink size={10}/></a>}
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
              <div style={{fontSize:10,color:'var(--text3)'}}>Source: CoinGecko API • Page {marketPage}/{totalPages||1}</div>
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
                {(market?.top_gainers||[]).map((t,i)=>(<tr key={i} className="clickable" onClick={()=>setSelectedToken(t)}><td style={{fontWeight:600}}>{t.symbol}</td><td>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td><td style={{color:'var(--green)',fontWeight:700}}>+{t.change_24h}%</td></tr>))}
              </tbody></table></div></div>
            <div className="sec"><div className="sh"><h2><TrendingDown size={16} color="var(--red)"/> Top Losers</h2></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Price</th><th>24h</th></tr></thead><tbody>
                {(market?.top_losers||[]).map((t,i)=>(<tr key={i} className="clickable" onClick={()=>setSelectedToken(t)}><td style={{fontWeight:600}}>{t.symbol}</td><td>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td><td style={{color:'var(--red)',fontWeight:700}}>{t.change_24h}%</td></tr>))}
              </tbody></table></div></div>
          </div>

          {/* Data Source Attribution */}
          <div style={{textAlign:'center',padding:'12px',fontSize:10,color:'var(--text3)',background:'var(--bg3)',borderRadius:'var(--r)',marginTop:8}}>
            All market data powered by <strong>CoinGecko API</strong> (top {market?.tokens_count || 300} by market cap) •
            Fear & Greed from <strong>Alternative.me</strong> •
            TVL from <strong>DeFiLlama</strong> •
            Updated every 2 minutes
          </div>
        </div>
      )}

      {/* ═══ STRESS TEST ═══ */}
      {tab==='stress'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><Activity size={16} color="var(--green)"/> RS-GARCH Monte Carlo Stress Engine</h2><span className="bdg">Phase 2</span></div>
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
                <div className="sh"><h2><AlertTriangle size={16} color="var(--red)"/> Risk Metrics — {stressResult.token}</h2><span className={`rgm rgm-${(stressResult.regime_detected||'sideways').toLowerCase()}`}>{stressResult.regime_detected} ({(stressResult.regime_confidence*100).toFixed(0)}%)</span></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
                  {[
                    {l:'VaR (95%)',v:`${stressResult.scenarios?.base_case?.var_95}%`,c:stressResult.scenarios?.base_case?.var_95<-15?'var(--red)':'var(--yellow)'},
                    {l:'CVaR (95%)',v:`${stressResult.scenarios?.base_case?.cvar_95}%`,c:'var(--red)'},
                    {l:'P(Loss>10%)',v:`${(stressResult.scenarios?.base_case?.prob_loss_gt_10pct*100).toFixed(1)}%`,c:stressResult.scenarios?.base_case?.prob_loss_gt_10pct>0.5?'var(--red)':'var(--yellow)'},
                    {l:'Max Drawdown',v:`${stressResult.scenarios?.base_case?.max_drawdown_worst}%`,c:'var(--red)'},
                    {l:'Mean Return',v:`${stressResult.scenarios?.base_case?.mean_return}%`,c:stressResult.scenarios?.base_case?.mean_return<0?'var(--red)':'var(--green)'},
                  ].map((m,i)=>(
                    <div key={i} className="bts"><div className="bv" style={{color:m.c,fontSize:18}}>{m.v}</div><div className="bl">{m.l}</div></div>
                  ))}
                </div>
              </div>

              {/* Scenario Comparison */}
              <div className="sec">
                <div className="sh"><h2><BarChart3 size={16} color="var(--blue)"/> Scenario Analysis (2000 Monte Carlo Paths)</h2></div>
                <div className="tw"><table><thead><tr><th>Scenario</th><th>VaR(95%)</th><th>CVaR(95%)</th><th>P(Loss>10%)</th><th>Mean Return</th><th>Skewness</th><th>Kurtosis</th></tr></thead><tbody>
                  {Object.entries(stressResult.scenarios||{}).map(([k,v])=>(
                    <tr key={k}><td style={{fontWeight:600}}>{k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</td>
                    <td style={{color:v.var_95<-15?'var(--red)':'var(--yellow)',fontWeight:700}}>{v.var_95}%</td>
                    <td style={{color:'var(--red)',fontWeight:700}}>{v.cvar_95}%</td>
                    <td>{(v.prob_loss_gt_10pct*100).toFixed(1)}%</td>
                    <td style={{color:v.mean_return<0?'var(--red)':'var(--green)',fontWeight:600}}>{v.mean_return}%</td>
                    <td>{v.skewness}</td>
                    <td>{v.kurtosis}</td></tr>
                  ))}
                </tbody></table></div>
              </div>

              {/* Unlock Impact Analysis */}
              {stressResult.unlock_impact_analysis&&(
                <div className="sec">
                  <div className="sh"><h2><Lock size={16} color="var(--yellow)"/> Unlock Impact Isolation</h2><span className={`rsk ${stressResult.unlock_impact_analysis.unlock_is_material?'r-c':'r-l'}`}>{stressResult.unlock_impact_analysis.unlock_is_material?'MATERIAL':'NON-MATERIAL'}</span></div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                    <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{stressResult.unlock_impact_analysis.additional_var_95}%</div><div className="bl">Additional VaR(95%)</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{stressResult.unlock_impact_analysis.additional_cvar_95}%</div><div className="bl">Additional CVaR</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--yellow)'}}>{stressResult.unlock_impact_analysis.additional_il}%</div><div className="bl">Additional IL</div></div>
                    <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{(stressResult.unlock_impact_analysis.prob_increase_gt10*100).toFixed(1)}%</div><div className="bl">P(&gt;10%) Increase</div></div>
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
                      <td>{v.il_mean}%</td>
                      <td style={{color:v.il_95th>5?'var(--red)':'var(--yellow)',fontWeight:600}}>{v.il_95th}%</td>
                      <td style={{color:'var(--red)',fontWeight:700}}>{v.il_max}%</td></tr>
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
                      <div><div style={{fontSize:10,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Hedge Size</div><div style={{fontSize:16,fontWeight:800,color:'var(--green)'}}>{stressResult.hedge_recommendation.hedge_size_pct}%</div></div>
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
            <div className="empty"><Activity size={40} color="var(--text3)" style={{marginBottom:8}}/><h3 style={{fontSize:16,fontWeight:700}}>Configure & Run Stress Test</h3><p>Select a token and unlock parameters above, then click "Run Stress Test" to generate a full RS-GARCH Monte Carlo simulation with 2000 paths.</p></div>
          )}
        </div>
      )}

      {/* ═══ PREDICTIONS ═══ */}
      {tab==='predictions'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><Target size={16} color="var(--green)"/> Verifiable Prediction Oracle</h2><span className="bdg">Phase 3</span></div>
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
                <div style={{fontSize:10,color:'var(--text3)',marginTop:8,lineHeight:1.5}}>Runs RS-GARCH MC simulation → generates prediction → commits keccak256 hash to Kite AI blockchain BEFORE the unlock event. Provably honest.</div>
              </div>

              {/* Reputation */}
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--purple)'}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:'flex',alignItems:'center',gap:6}}><Shield size={14}/> Agent Reputation</div>
                {predReputation?.stats?(
                  <>
                    <div style={{textAlign:'center',marginBottom:14}}>
                      <div style={{fontSize:48,fontWeight:900,color:'var(--green)'}}>{predReputation.stats.grade}</div>
                      <div style={{fontSize:12,color:'var(--text3)',fontWeight:600}}>{predReputation.stats.reputation_score}/1000</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div className="bts"><div className="bv" style={{fontSize:16}}>{predReputation.stats.total_predictions}</div><div className="bl">Total Predictions</div></div>
                      <div className="bts"><div className="bv" style={{fontSize:16,color:'var(--green)'}}>{predReputation.stats.accuracy_rate}%</div><div className="bl">Accuracy Rate</div></div>
                      <div className="bts"><div className="bv" style={{fontSize:16}}>{predReputation.stats.streak}</div><div className="bl">Current Streak</div></div>
                      <div className="bts"><div className="bv" style={{fontSize:16}}>{predReputation.stats.avg_error}%</div><div className="bl">Avg Error</div></div>
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
                    <td>{p.on_chain?<CheckCircle size={14} color="var(--green)"/>:<Clock size={14} color="var(--text3)"/>}</td>
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
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
                {[
                  {n:'1. Stress Test',d:'RS-GARCH Monte Carlo simulation generates probability distributions for the token under unlock stress.',ic:'⚡'},
                  {n:'2. Commit Hash',d:'keccak256(token, predicted_impact, timestamp, salt) committed to Kite AI blockchain BEFORE the event.',ic:'🔒'},
                  {n:'3. Event Occurs',d:'Token unlock happens. Real price impact is observed and recorded from market data.',ic:'📊'},
                  {n:'4. Reveal & Score',d:'Prediction revealed, hash verified on-chain, accuracy scored. Reputation updated.',ic:'✅'},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:'center'}}>
                    <div style={{fontSize:28,marginBottom:6}}>{s.ic}</div>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>{s.n}</div>
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
              {[{i:<Eye size={20}/>,t:'Monitor',d:'300+ tokens via CoinGecko, 40+ unlocks from Tokenomist',c:'var(--yellow)',bg:'var(--yellow-bg)'},{i:<Cpu size={20}/>,t:'Analyze',d:'Claude Sonnet 4 with 5-factor risk model',c:'var(--purple)',bg:'var(--purple-bg)'},{i:<Shield size={20}/>,t:'Protect',d:'6 hedge strategies with execution plans',c:'var(--green)',bg:'var(--green-bg)'},{i:<Database size={20}/>,t:'Attest',d:'Immutable records on Kite blockchain',c:'var(--green)',bg:'var(--green-bg2)'},{i:<BarChart3 size={20}/>,t:'Backtest',d:'Validated on 13 real events',c:'var(--cyan)',bg:'var(--cyan-bg)'},{i:<Globe size={20}/>,t:'Intelligence',d:'Market regime, Fear & Greed, TVL, anomalies',c:'var(--red)',bg:'var(--red-bg)'}].map((c,i)=>(
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

      {/* ═══ KITE ECOSYSTEM ═══ */}
      {tab==='kite'&&(
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><Wallet size={16} color="var(--green)"/> Agent Smart Wallet (ERC-4337)</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--green)'}}><div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4,fontWeight:600}}>Wallet Address</div><div style={{fontSize:12,fontWeight:600,fontFamily:'monospace',wordBreak:'break-all'}}>{walletData?.wallet?.address||'Not Configured'}</div></div>
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
              <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>Real-Time Indexing</div>
              <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.6,marginBottom:12}}>All predictions, hedges, and outcomes indexed on Kite AI Testnet via Goldsky.</div>
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
              {[{t:'Account Abstraction (ERC-4337)',d:'Smart wallet with spending rules, gasless tx via bundler.',c:'var(--green)',s:'Active'},
                {t:'L-USDC Yield (Lucid)',d:'4% APY on idle funds via Aave v3 + LayerZero bridge.',c:'var(--green)',s:'Active'},
                {t:'On-Chain Attestation',d:'Immutable predictions & hedges. Reputation scoring.',c:'var(--purple)',s:'Active'},
                {t:'Goldsky Subgraph',d:'Real-time GraphQL indexing of all events.',c:'var(--cyan)',s:'Active'},
                {t:'Settlement Contract',d:'All payments via Kite Settlement with audit trail.',c:'var(--yellow)',s:'Active'},
                {t:'LayerZero v2 Bridge',d:'Cross-chain L-USDC for multi-chain hedges.',c:'var(--red)',s:'Configured'}
              ].map((c,i)=>(<div className="crd" key={i} style={{cursor:'default',borderLeft:`3px solid ${c.c}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><div style={{fontWeight:700,fontSize:13}}>{c.t}</div><span className="rsk r-l" style={{fontSize:9}}>{c.s}</span></div>
                <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5}}>{c.d}</div>
              </div>))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{textAlign:'center',padding:'24px 0 8px',borderTop:'1px solid var(--border)',marginTop:16,fontSize:11,color:'var(--text3)'}}>
        <strong style={{color:'var(--text)'}}>UnlockShield</strong> — Verifiable DeFi Stress Oracle<br/>
        <span>Built on <a href="https://gokite.ai" target="_blank" rel="noopener" style={{color:'var(--green)',fontWeight:600,textDecoration:'none'}}>Kite AI</a> &bull; <a href="https://testnet.kitescan.ai" target="_blank" rel="noopener" style={{color:'var(--green)',fontWeight:600,textDecoration:'none'}}>KiteScan</a> &bull; <a href="https://github.com/Rajatd91/unlockshield" target="_blank" rel="noopener" style={{color:'var(--green)',fontWeight:600,textDecoration:'none'}}>GitHub</a></span>
      </div>
    </div></>
  )
}

export default App
