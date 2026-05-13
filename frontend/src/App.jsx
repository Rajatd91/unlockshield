import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Shield, AlertTriangle, TrendingDown, TrendingUp, Activity, Zap, ExternalLink,
  RefreshCw, CheckCircle, BarChart3, Globe, Clock, Target, ArrowUpRight,
  ArrowDownRight, Cpu, Database, Eye, ChevronDown, ChevronRight, Info,
  PieChart, Layers, Wallet, Search, Filter, Gauge, Flame, Snowflake,
  ArrowRight, Lock, Unlock, Play, ChevronUp
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  :root {
    --bg: #ffffff;
    --bg-card: #ffffff;
    --bg-hover: #f8faf9;
    --bg-elevated: #f1f7f3;
    --bg-page: #f6faf7;
    --border: #e2ebe6;
    --border-hover: #c5d8cc;
    --text: #111827;
    --text-2: #4b5563;
    --text-3: #6b7280;
    --accent: #059669;
    --accent-light: #d1fae5;
    --accent-dark: #047857;
    --glow: rgba(5,150,105,.08);
    --green: #059669;
    --green-light: #ecfdf5;
    --green-dark: #047857;
    --red: #dc2626;
    --red-light: #fef2f2;
    --yellow: #d97706;
    --yellow-light: #fffbeb;
    --purple: #7c3aed;
    --purple-light: #f5f3ff;
    --cyan: #0891b2;
    --cyan-light: #ecfeff;
    --gradient: linear-gradient(135deg, #059669, #10b981);
    --gradient-hero: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #f6faf7 100%);
    --shadow-sm: 0 1px 2px rgba(0,0,0,.04);
    --shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,.06), 0 2px 4px -2px rgba(0,0,0,.04);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,.06), 0 4px 6px -4px rgba(0,0,0,.04);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-xs: 6px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-page);
    color: var(--text);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  .app { max-width: 1360px; margin: 0 auto; padding: 16px 24px 40px; }

  /* ─── Header ───────────────────────────────────────────── */
  .hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; margin-bottom: 20px;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow);
  }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--gradient); display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(5,150,105,.25);
  }
  .logo h1 {
    font-size: 22px; font-weight: 800; letter-spacing: -.4px;
    color: var(--text);
  }
  .logo h1 span { color: var(--accent); }
  .bdg {
    font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 5px;
    text-transform: uppercase; letter-spacing: .5px;
    background: var(--bg-elevated); color: var(--text-3); border: 1px solid var(--border);
  }
  .bdg-live {
    background: var(--green-light); color: var(--green); border-color: rgba(5,150,105,.2);
    animation: livePulse 2s ease-in-out infinite;
  }
  @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.7} }

  .hdr-btns { display: flex; gap: 8px; align-items: center; }
  .btn {
    border: none; padding: 9px 18px; border-radius: var(--radius-sm);
    font-weight: 600; font-size: 13px; cursor: pointer;
    display: flex; align-items: center; gap: 7px;
    transition: all .2s ease;
  }
  .btn-p {
    background: var(--gradient); color: #fff;
    box-shadow: 0 2px 8px rgba(5,150,105,.25);
  }
  .btn-p:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(5,150,105,.3); }
  .btn-p:active { transform: translateY(0); }
  .btn-p:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-g {
    background: var(--bg-card); color: var(--text-2);
    border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  }
  .btn-g:hover { border-color: var(--border-hover); color: var(--text); background: var(--bg-hover); }

  /* ─── Market Ticker ───────────────────────────────────── */
  .ticker {
    display: flex; gap: 10px; margin-bottom: 20px;
    overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;
  }
  .ticker::-webkit-scrollbar { display: none; }
  .tk {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px 18px;
    min-width: 155px; flex-shrink: 0; box-shadow: var(--shadow-sm);
    transition: all .2s ease;
  }
  .tk:hover { box-shadow: var(--shadow); border-color: var(--border-hover); }
  .tk .l {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: .6px; margin-bottom: 5px; font-weight: 600;
  }
  .tk .v { font-size: 18px; font-weight: 800; color: var(--text); }
  .tk .c { font-size: 11px; font-weight: 600; margin-top: 2px; }

  /* ─── Stats Cards ──────────────────────────────────────── */
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
  .st {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px;
    box-shadow: var(--shadow-sm); transition: all .2s ease;
    position: relative; overflow: hidden;
  }
  .st:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--border-hover); }
  .st .ib { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .st .ic {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .st .sl {
    font-size: 11px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: .5px; font-weight: 600;
  }
  .st .sv { font-size: 24px; font-weight: 800; margin-top: 2px; line-height: 1.1; color: var(--text); }
  .st .ss { font-size: 11px; color: var(--text-3); margin-top: 4px; }

  /* ─── Tabs ──────────────────────────────────────────────── */
  .tabs {
    display: flex; gap: 2px; margin-bottom: 20px;
    background: var(--bg-card); border-radius: var(--radius);
    padding: 4px; border: 1px solid var(--border);
    width: fit-content; box-shadow: var(--shadow-sm);
  }
  .tab {
    padding: 9px 18px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 500; color: var(--text-3);
    cursor: pointer; border: none; background: none;
    display: flex; align-items: center; gap: 6px;
    transition: all .2s ease; white-space: nowrap;
  }
  .tab:hover { color: var(--text); background: var(--bg-hover); }
  .tab.on {
    background: var(--gradient); color: #fff;
    font-weight: 600; box-shadow: 0 2px 6px rgba(5,150,105,.2);
  }

  /* ─── Section ───────────────────────────────────────────── */
  .sec { margin-bottom: 24px; }
  .sh { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .sh h2 {
    font-size: 16px; font-weight: 700; display: flex;
    align-items: center; gap: 8px; color: var(--text);
  }
  .cnt {
    background: var(--accent-light); padding: 2px 8px; border-radius: 10px;
    font-size: 11px; color: var(--accent); font-weight: 700;
  }

  /* ─── Table ─────────────────────────────────────────────── */
  .tw {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm);
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; padding: 11px 16px; font-size: 10px; color: var(--text-3);
    text-transform: uppercase; letter-spacing: .6px; font-weight: 700;
    background: var(--bg-elevated); border-bottom: 1px solid var(--border);
  }
  td {
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    font-size: 13px; color: var(--text);
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg-hover); }
  .tc { display: flex; align-items: center; gap: 10px; }
  .ti {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; overflow: hidden;
    background: var(--accent-light); color: var(--accent);
    border: 1px solid rgba(5,150,105,.15);
  }
  .ti img { width: 100%; height: 100%; border-radius: 8px; }
  .tn { font-weight: 600; font-size: 13px; color: var(--text); }
  .ts { font-size: 10px; color: var(--text-3); }

  /* ─── Risk & Strategy badges ───────────────────────────── */
  .rsk {
    padding: 3px 10px; border-radius: 20px; font-size: 11px;
    font-weight: 700; display: inline-flex; align-items: center; gap: 4px;
  }
  .r-c { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .r-h { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
  .r-m { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .r-l { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }

  .str {
    padding: 3px 10px; border-radius: var(--radius-xs); font-size: 11px;
    font-weight: 600; white-space: nowrap;
  }
  .s-exit { background: #fef2f2; color: #dc2626; }
  .s-reduce { background: #fffbeb; color: #d97706; }
  .s-hedge { background: #eff6ff; color: #2563eb; }
  .s-put { background: #f5f3ff; color: #7c3aed; }
  .s-dca { background: #ecfeff; color: #0891b2; }

  /* ─── Cards ─────────────────────────────────────────────── */
  .crd {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px;
    margin-bottom: 10px; transition: all .2s ease; cursor: pointer;
    box-shadow: var(--shadow-sm);
  }
  .crd:hover { box-shadow: var(--shadow-md); border-color: var(--border-hover); transform: translateY(-1px); }
  .ch { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .cb { color: var(--text-2); font-size: 13px; line-height: 1.6; }

  /* ─── Factor Bars ───────────────────────────────────────── */
  .fr { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .fl { font-size: 11px; color: var(--text-3); width: 110px; flex-shrink: 0; font-weight: 500; }
  .fb { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
  .fv { height: 100%; border-radius: 3px; transition: width .5s ease; }
  .fn { font-size: 11px; font-weight: 700; width: 28px; text-align: right; flex-shrink: 0; }

  /* ─── Execution Plan ────────────────────────────────────── */
  .ps { padding-left: 0; list-style: none; }
  .ps-s {
    position: relative; padding: 8px 0 8px 24px;
    border-left: 2px solid var(--border); margin-left: 8px;
    font-size: 12px; color: var(--text-2);
  }
  .ps-s:last-child { border-left-color: transparent; }
  .ps-s::before {
    content: ''; position: absolute; left: -5px; top: 12px;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent); box-shadow: 0 0 0 3px var(--accent-light);
  }
  .ps-a { font-weight: 600; color: var(--text); }

  /* ─── Regime Badge ──────────────────────────────────────── */
  .rgm {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 700;
  }
  .rgm-bull { background: #ecfdf5; color: #059669; }
  .rgm-bear { background: #fef2f2; color: #dc2626; }
  .rgm-sideways { background: #fffbeb; color: #d97706; }

  /* ─── Backtest Stats ────────────────────────────────────── */
  .btg { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .bts {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px; text-align: center;
    box-shadow: var(--shadow-sm);
  }
  .bts .bv { font-size: 22px; font-weight: 800; }
  .bts .bl {
    font-size: 10px; color: var(--text-3); text-transform: uppercase;
    letter-spacing: .6px; margin-top: 4px; font-weight: 600;
  }

  /* ─── Search ────────────────────────────────────────────── */
  .srch { position: relative; margin-bottom: 16px; }
  .srch input {
    width: 100%; padding: 11px 16px 11px 40px;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text);
    font-size: 13px; outline: none; box-shadow: var(--shadow-sm);
    transition: all .2s ease;
  }
  .srch input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(5,150,105,.1); }
  .srch input::placeholder { color: var(--text-3); }
  .srch svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-3); }

  /* ─── Sector Pills ──────────────────────────────────────── */
  .spill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: var(--radius-xs); font-size: 11px;
    font-weight: 600; margin: 2px; cursor: pointer;
    border: 1px solid var(--border); transition: all .2s;
    background: var(--bg-card);
  }
  .spill:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); }
  .spill.on { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
  .spill .dot { width: 7px; height: 7px; border-radius: 50%; }

  .tx-link {
    color: var(--accent); font-size: 11px;
    display: inline-flex; align-items: center; gap: 4px;
    text-decoration: none; margin-top: 8px; font-weight: 600;
    transition: all .15s;
  }
  .tx-link:hover { color: var(--accent-dark); }

  /* ─── Empty State ───────────────────────────────────────── */
  .empty {
    text-align: center; padding: 48px 24px;
    background: var(--bg-card); border: 1px dashed var(--border);
    border-radius: var(--radius);
  }
  .empty p { margin-top: 8px; font-size: 14px; color: var(--text-3); }

  /* ─── Info Box ──────────────────────────────────────────── */
  .info-box {
    padding: 14px 18px; border-radius: var(--radius-sm);
    font-size: 13px; line-height: 1.7; border-left: 3px solid;
  }

  /* ─── Animations ────────────────────────────────────────── */
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .fade { animation: fadeUp .3s ease; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

  /* ─── Hero Banner ───────────────────────────────────────── */
  .hero-banner {
    background: var(--gradient-hero);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px 24px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .hero-left h3 { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .hero-left p { font-size: 12px; color: var(--text-3); max-width: 500px; }
  .hero-status { display: flex; gap: 16px; align-items: center; }
  .hero-dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--green);
    box-shadow: 0 0 8px rgba(5,150,105,.5);
    animation: livePulse 2s ease-in-out infinite;
  }

  /* ─── Code Block ────────────────────────────────────────── */
  .code-block {
    background: #1e293b; border-radius: var(--radius-sm);
    padding: 14px 16px; font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px; color: #e2e8f0; overflow-x: auto;
    line-height: 1.6;
  }
  .code-comment { color: #64748b; }
  .code-key { color: #67e8f9; }
  .code-str { color: #a7f3d0; }

  /* ─── Responsive ────────────────────────────────────────── */
  @media(max-width:1024px) {
    .stats { grid-template-columns: repeat(3, 1fr); }
    .btg { grid-template-columns: repeat(2, 1fr); }
  }
  @media(max-width:768px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .app { padding: 12px 16px 32px; }
    .hdr { padding: 12px 16px; flex-direction: column; gap: 12px; }
    .tabs { overflow-x: auto; width: 100%; }
    .hero-banner { flex-direction: column; gap: 12px; text-align: center; }
  }
`

/* ─── Helpers ─────────────────────────────────────────────── */
const fmt = v => {
  if (v == null || isNaN(v)) return '$0'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}
const fmtD = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const days = d => Math.ceil((new Date(d) - new Date()) / 864e5)
const pc = v => v > 0 ? 'var(--green)' : v < 0 ? 'var(--red)' : 'var(--text-3)'
const rc = s => s >= 80 ? 'r-c' : s >= 55 ? 'r-h' : s >= 35 ? 'r-m' : 'r-l'
const rl = s => s >= 80 ? 'CRITICAL' : s >= 55 ? 'HIGH' : s >= 35 ? 'MEDIUM' : 'LOW'
const sc = s => ({ FULL_EXIT: 's-exit', REDUCE_POSITION: 's-reduce', SHORT_HEDGE: 's-hedge', OPTIONS_PUT: 's-put', DCA_EXIT: 's-dca' })[s] || ''
const fc = s => s >= 70 ? 'var(--red)' : s >= 45 ? 'var(--yellow)' : 'var(--green)'

const SECTOR_COLORS = {
  L1: '#3b82f6', L2: '#8b5cf6', DeFi: '#059669', Gaming: '#d97706',
  Infra: '#0891b2', Stable: '#6b7280', Meme: '#ec4899', Other: '#6b7280'
}

/* ─── App ─────────────────────────────────────────────────── */
function App() {
  const [tab, setTab] = useState('dashboard')
  const [unlocks, setUnlocks] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [hedges, setHedges] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [agent, setAgent] = useState(null)
  const [market, setMarket] = useState(null)
  const [backtest, setBacktest] = useState(null)
  const [walletData, setWalletData] = useState(null)
  const [yieldData, setYieldData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [tokenSearch, setTokenSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, p, s, h, m, bt, w, y] = await Promise.all([
        fetch(`${API}/api/unlocks/upcoming`).then(r => r.json()).catch(() => ({ unlocks: [] })),
        fetch(`${API}/api/portfolio/holdings`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/agent/status`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/agent/history`).then(r => r.json()).catch(() => ({ hedges: [] })),
        fetch(`${API}/api/market/overview`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/backtest/summary`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/wallet/status`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/wallet/yield`).then(r => r.json()).catch(() => null),
      ])
      setUnlocks(u.unlocks || [])
      setPortfolio(p)
      setAgent(s)
      setHedges(h.hedges || [])
      setMarket(m)
      setBacktest(bt)
      setWalletData(w)
      setYieldData(y)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const scan = async () => {
    setScanning(true)
    try {
      const r = await fetch(`${API}/api/agent/scan`, { method: 'POST' })
      const d = await r.json()
      setAnalyses(d.results || [])
      await load()
    } catch (e) { console.error(e) }
    setScanning(false)
  }

  const runBT = async () => {
    try {
      const r = await fetch(`${API}/api/backtest/run`)
      setBacktest(await r.json())
    } catch (e) { console.error(e) }
  }

  // Market data
  const regime = market?.market_regime
  const glob = market?.global || {}
  const fg = market?.fear_greed || {}
  const sectors = market?.sectors || {}
  const topTokens = market?.top_tokens || []
  const anomalies = market?.volume_anomalies || []

  const filteredTokens = useMemo(() => {
    let t = topTokens
    if (sectorFilter) t = t.filter(x => x.sector === sectorFilter)
    if (tokenSearch) {
      const q = tokenSearch.toUpperCase()
      t = t.filter(x => x.symbol?.includes(q) || x.name?.toUpperCase().includes(q))
    }
    return t
  }, [topTokens, sectorFilter, tokenSearch])

  /* ─── Loading Screen ──────────────────────────────────── */
  if (loading) return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="empty" style={{ border: 'none', background: 'transparent', paddingTop: '120px' }}>
          <div className="logo-icon" style={{ width: 56, height: 56, margin: '0 auto 20px', borderRadius: 16 }}>
            <Shield size={28} color="#fff" className="pulse" />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Loading UnlockShield</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Connecting to Kite AI Network &bull; Fetching live market data
          </p>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ═══ HEADER ═══ */}
        <div className="hdr">
          <div className="logo">
            <div className="logo-icon">
              <Shield size={20} color="#fff" />
            </div>
            <h1>Unlock<span>Shield</span></h1>
            <span className="bdg">Kite AI</span>
            {agent?.kite_connected && <span className="bdg bdg-live">&#9679; Live</span>}
          </div>
          <div className="hdr-btns">
            <button className="btn btn-g" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-p" onClick={scan} disabled={scanning}>
              {scanning ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
              {scanning ? 'Scanning...' : 'Run Agent Scan'}
            </button>
          </div>
        </div>

        {/* ═══ HERO BANNER ═══ */}
        <div className="hero-banner fade">
          <div className="hero-left">
            <h3>Autonomous AI Agent for Token Unlock Protection</h3>
            <p>
              Monitors 300+ tokens, detects upcoming unlocks, analyzes risk with AI, and executes
              hedge strategies — all on-chain via Kite AI.
            </p>
          </div>
          <div className="hero-status" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="hero-dot" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>
              Agent Active
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Chain 2368
            </span>
          </div>
        </div>

        {/* ═══ MARKET TICKER ═══ */}
        {market && (
          <div className="ticker fade">
            <div className="tk">
              <div className="l">Global Market Cap</div>
              <div className="v">{fmt(glob.total_market_cap)}</div>
              <div className="c" style={{ color: pc(glob.market_cap_change_24h) }}>
                {glob.market_cap_change_24h > 0 ? '+' : ''}{glob.market_cap_change_24h}%
              </div>
            </div>
            <div className="tk">
              <div className="l">24h Volume</div>
              <div className="v">{fmt(glob.total_volume_24h)}</div>
            </div>
            <div className="tk">
              <div className="l">BTC Dominance</div>
              <div className="v">{glob.btc_dominance}%</div>
            </div>
            <div className="tk">
              <div className="l">Fear & Greed</div>
              <div className="v" style={{
                color: fg.value >= 60 ? 'var(--green)' : fg.value <= 35 ? 'var(--red)' : 'var(--yellow)'
              }}>
                {fg.value || '--'}
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>/100</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{fg.classification || ''}</div>
            </div>
            {regime && (
              <div className="tk">
                <div className="l">Market Regime</div>
                <div className={`rgm rgm-${regime.regime?.toLowerCase()}`}>
                  {regime.regime === 'BULL' ? <TrendingUp size={13} /> : regime.regime === 'BEAR' ? <TrendingDown size={13} /> : <Activity size={13} />}
                  {regime.regime}
                  <span style={{ fontWeight: 400, opacity: .7 }}>{Math.round((regime.confidence || 0) * 100)}%</span>
                </div>
              </div>
            )}
            <div className="tk">
              <div className="l">Tokens Tracked</div>
              <div className="v" style={{ color: 'var(--accent)' }}>{market.tokens_count || '300+'}</div>
            </div>
            <div className="tk">
              <div className="l">DeFi TVL</div>
              <div className="v">{fmt(market.tvl?.total)}</div>
            </div>
          </div>
        )}

        {/* ═══ STATS ═══ */}
        <div className="stats">
          <div className="st">
            <div className="ib">
              <div className="ic" style={{ background: 'var(--accent-light)' }}>
                <Wallet size={18} color="var(--accent)" />
              </div>
            </div>
            <div className="sl">Portfolio</div>
            <div className="sv">{portfolio ? fmt(portfolio.total_value_usd) : '$0'}</div>
            <div className="ss">{portfolio?.holdings_count || 0} tokens tracked</div>
          </div>
          <div className="st">
            <div className="ib">
              <div className="ic" style={{ background: 'var(--green-light)' }}>
                <Shield size={18} color="var(--green)" />
              </div>
            </div>
            <div className="sl">Protected</div>
            <div className="sv" style={{ color: 'var(--green)' }}>
              {portfolio ? fmt(portfolio.total_value_protected) : '$0'}
            </div>
            <div className="ss">{hedges.length} hedges executed</div>
          </div>
          <div className="st">
            <div className="ib">
              <div className="ic" style={{ background: 'var(--yellow-light)' }}>
                <AlertTriangle size={18} color="var(--yellow)" />
              </div>
            </div>
            <div className="sl">Unlock Events</div>
            <div className="sv" style={{ color: 'var(--yellow)' }}>{unlocks.length}</div>
            <div className="ss">Next 90 days</div>
          </div>
          <div className="st">
            <div className="ib">
              <div className="ic" style={{ background: 'var(--purple-light)' }}>
                <Cpu size={18} color="var(--purple)" />
              </div>
            </div>
            <div className="sl">AI Engine</div>
            <div className="sv" style={{ fontSize: 14, color: 'var(--purple)' }}>Claude Sonnet 4</div>
            <div className="ss">5-factor risk model</div>
          </div>
          <div className="st">
            <div className="ib">
              <div className="ic" style={{ background: 'var(--cyan-light)' }}>
                <Database size={18} color="var(--cyan)" />
              </div>
            </div>
            <div className="sl">Kite Chain</div>
            <div className="sv" style={{
              fontSize: 14,
              color: agent?.kite_connected ? 'var(--green)' : 'var(--red)'
            }}>
              {agent?.kite_connected ? '● Connected' : '○ Offline'}
            </div>
            <div className="ss">Chain ID 2368</div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="tabs">
          {[
            { k: 'dashboard', i: <Layers size={14} />, l: 'Dashboard' },
            { k: 'market', i: <Globe size={14} />, l: `Market (${market?.tokens_count || '300+'})` },
            { k: 'backtest', i: <BarChart3 size={14} />, l: 'Backtest' },
            { k: 'portfolio', i: <PieChart size={14} />, l: 'Portfolio' },
            { k: 'kite', i: <Zap size={14} />, l: 'Kite Ecosystem' },
          ].map(t => (
            <button key={t.k} className={`tab ${tab === t.k ? 'on' : ''}`} onClick={() => setTab(t.k)}>
              {t.i} {t.l}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════
            DASHBOARD TAB
            ═══════════════════════════════════════════════════════ */}
        {tab === 'dashboard' && (
          <div className="fade">
            {/* Unlock Table */}
            <div className="sec">
              <div className="sh">
                <h2>
                  <AlertTriangle size={17} color="var(--yellow)" />
                  Upcoming Token Unlocks
                  <span className="cnt">{unlocks.length}</span>
                </h2>
              </div>
              {unlocks.length === 0 ? (
                <div className="empty">
                  <Clock size={36} color="var(--text-3)" />
                  <p style={{ fontWeight: 600, marginTop: 12 }}>No unlock data loaded yet</p>
                  <p style={{ fontSize: 12 }}>Click <strong style={{ color: 'var(--accent)' }}>Run Agent Scan</strong> to detect upcoming token unlocks</p>
                </div>
              ) : (
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Token</th><th>Unlock Date</th><th>Amount</th><th>Supply %</th>
                        <th>Risk Level</th><th>Strategy</th><th>Est. Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unlocks.map((u, i) => {
                        const a = analyses.find(x => x.token === u.token_symbol)
                        const rs = a?.risk_score || Math.round(u.total_supply_percent * 6.5)
                        const d = days(u.unlock_date)
                        return (
                          <tr key={i}>
                            <td>
                              <div className="tc">
                                <div className="ti">{u.token_symbol?.slice(0, 2)}</div>
                                <div>
                                  <div className="tn">{u.token_symbol}</div>
                                  <div className="ts">{u.token_name}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{fmtD(u.unlock_date)}</div>
                              <div style={{ fontSize: 10, color: d <= 7 ? 'var(--red)' : 'var(--text-3)', fontWeight: d <= 7 ? 700 : 400 }}>
                                {d}d away {d <= 7 && '⚠'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{fmt(u.unlock_amount_usd)}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                                {u.unlock_amount_tokens?.toLocaleString()} tokens
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontWeight: 700,
                                color: u.total_supply_percent >= 5 ? 'var(--red)' : u.total_supply_percent >= 1 ? 'var(--yellow)' : 'var(--text)'
                              }}>
                                {u.total_supply_percent}%
                              </span>
                            </td>
                            <td><span className={`rsk ${rc(rs)}`}>{rl(rs)} {rs}</span></td>
                            <td>
                              <span className={`str ${sc(a?.recommended_action)}`}>
                                {a?.recommended_action?.replace('_', ' ') || 'PENDING'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--red)', fontWeight: 700 }}>
                              {a?.predicted_impact || `~${(-u.total_supply_percent * 3).toFixed(0)}%`}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI Scan Results */}
            {analyses.length > 0 && (
              <div className="sec fade">
                <div className="sh">
                  <h2>
                    <Activity size={17} color="var(--accent)" />
                    AI Scan Results
                    <span className="cnt">{analyses.length}</span>
                  </h2>
                </div>
                {analyses.map((r, i) => (
                  <div className="crd" key={i} onClick={() => setExpanded(expanded === i ? null : i)}>
                    <div className="ch">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{r.token}</span>
                        <span className={`rsk ${rc(r.risk_score)}`}>Risk: {r.risk_score}</span>
                        <span className={`str ${sc(r.recommended_action)}`}>
                          {r.recommended_action?.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 14 }}>{r.predicted_impact}</span>
                        {expanded === i ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
                      </div>
                    </div>
                    <div className="cb">{r.reasoning}</div>

                    {expanded === i && (
                      <div className="fade" style={{ marginTop: 14 }}>
                        {/* Factor Scores */}
                        {r.factor_scores && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{
                              fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                              marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px'
                            }}>
                              Risk Factor Breakdown
                            </div>
                            {Object.entries(r.factor_scores).map(([k, v]) => (
                              <div className="fr" key={k}>
                                <span className="fl">{k.replace(/_/g, ' ')}</span>
                                <div className="fb">
                                  <div className="fv" style={{ width: `${v}%`, background: fc(v) }} />
                                </div>
                                <span className="fn" style={{ color: fc(v) }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {r.key_risks && r.key_risks.length > 0 && (
                          <div style={{
                            fontSize: 12, color: 'var(--text-2)', marginBottom: 10,
                            padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)'
                          }}>
                            <strong>Key Risks:</strong> {r.key_risks.join(' &bull; ')}
                          </div>
                        )}

                        {r.similar_event && (
                          <div style={{
                            fontSize: 12, color: 'var(--text-3)', marginBottom: 10,
                            fontStyle: 'italic', paddingLeft: 12,
                            borderLeft: '2px solid var(--border)'
                          }}>
                            Similar event: {r.similar_event}
                          </div>
                        )}

                        {r.hedge?.execution_plan && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{
                              fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                              marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px'
                            }}>
                              Execution Plan
                            </div>
                            <div className="ps">
                              {r.hedge.execution_plan.map((s, j) => (
                                <div className="ps-s" key={j}>
                                  <span className="ps-a">{s.action}</span>
                                  {s.amount && ` — ${s.amount}`}
                                  {s.venue && <span style={{ color: 'var(--text-3)' }}> via {s.venue}</span>}
                                  {s.reason && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.reason}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {r.attestation?.tx_hash !== '0x' + '0'.repeat(64) && r.attestation && (
                          <a href={r.attestation.explorer_url} target="_blank" rel="noopener" className="tx-link">
                            <CheckCircle size={12} /> Verified on Kite Chain <ExternalLink size={10} />
                          </a>
                        )}

                        {r.hedge?.action !== 'HOLD' && r.hedge && (
                          <div className="info-box" style={{
                            marginTop: 10, borderLeftColor: 'var(--green)',
                            background: 'var(--green-light)', fontSize: 12
                          }}>
                            <span style={{ color: 'var(--green)', fontWeight: 700 }}>HEDGE EXECUTED</span> — {r.hedge.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Volume Anomalies */}
            {anomalies.length > 0 && (
              <div className="sec fade">
                <div className="sh">
                  <h2>
                    <Flame size={17} color="var(--red)" />
                    Volume Anomalies
                    <span className="cnt">{anomalies.length}</span>
                  </h2>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr><th>Token</th><th>Volume 24h</th><th>Vol/MCap</th><th>Change 24h</th><th>Severity</th><th>Signal</th></tr>
                    </thead>
                    <tbody>
                      {anomalies.slice(0, 10).map((a, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{a.symbol}</td>
                          <td>{fmt(a.volume_24h)}</td>
                          <td style={{ fontWeight: 700, color: 'var(--yellow)' }}>{a.volume_to_mcap}%</td>
                          <td style={{ color: pc(a.change_24h), fontWeight: 600 }}>
                            {a.change_24h > 0 ? '+' : ''}{a.change_24h}%
                          </td>
                          <td>
                            <span className={`rsk ${a.severity === 'CRITICAL' ? 'r-c' : a.severity === 'HIGH' ? 'r-h' : 'r-m'}`}>
                              {a.severity}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.signal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            MARKET TAB
            ═══════════════════════════════════════════════════════ */}
        {tab === 'market' && (
          <div className="fade">
            {/* Sector Performance */}
            {Object.keys(sectors).length > 0 && (
              <div className="sec">
                <div className="sh">
                  <h2><Layers size={17} color="var(--purple)" /> Sector Performance</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                  <span className={`spill ${!sectorFilter ? 'on' : ''}`} onClick={() => setSectorFilter(null)}>All</span>
                  {Object.entries(sectors).map(([s, d]) => (
                    <span key={s}
                      className={`spill ${sectorFilter === s ? 'on' : ''}`}
                      onClick={() => setSectorFilter(sectorFilter === s ? null : s)}>
                      <span className="dot" style={{ background: SECTOR_COLORS[s] || '#6b7280' }} /> {s} ({d.count})
                      <span style={{ color: pc(d.avg_change_24h), marginLeft: 4 }}>
                        {d.avg_change_24h > 0 ? '+' : ''}{d.avg_change_24h}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Token Search */}
            <div className="srch">
              <Search size={15} />
              <input
                placeholder={`Search ${topTokens.length}+ tokens by name or symbol...`}
                value={tokenSearch}
                onChange={e => setTokenSearch(e.target.value)}
              />
            </div>

            {/* Market Table */}
            <div className="sec">
              <div className="sh">
                <h2><Globe size={17} color="var(--cyan)" /> Market Data <span className="cnt">{filteredTokens.length} tokens</span></h2>
              </div>
              <div className="tw">
                <table>
                  <thead>
                    <tr><th>#</th><th>Token</th><th>Price</th><th>24h</th><th>7d</th><th>30d</th><th>Market Cap</th><th>Volume 24h</th><th>Sector</th></tr>
                  </thead>
                  <tbody>
                    {filteredTokens.slice(0, 100).map((t, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{t.rank}</td>
                        <td>
                          <div className="tc">
                            <div className="ti">{t.image ? <img src={t.image} alt="" /> : t.symbol?.slice(0, 2)}</div>
                            <div><div className="tn">{t.symbol}</div><div className="ts">{t.name}</div></div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>${t.price >= 1 ? t.price?.toFixed(2) : t.price?.toFixed(4)}</td>
                        <td style={{ color: pc(t.change_24h), fontWeight: 600 }}>{t.change_24h > 0 ? '+' : ''}{t.change_24h}%</td>
                        <td style={{ color: pc(t.change_7d) }}>{t.change_7d > 0 ? '+' : ''}{t.change_7d}%</td>
                        <td style={{ color: pc(t.change_30d) }}>{t.change_30d > 0 ? '+' : ''}{t.change_30d}%</td>
                        <td>{fmt(t.market_cap)}</td>
                        <td>{fmt(t.volume_24h)}</td>
                        <td>
                          <span className="spill" style={{ cursor: 'default', borderColor: SECTOR_COLORS[t.sector] || 'var(--border)' }}>
                            <span className="dot" style={{ background: SECTOR_COLORS[t.sector] || '#6b7280' }} />{t.sector}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Movers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
              <div className="sec">
                <div className="sh"><h2><TrendingUp size={17} color="var(--green)" /> Top Gainers</h2></div>
                <div className="tw">
                  <table>
                    <thead><tr><th>Token</th><th>Price</th><th>24h Change</th></tr></thead>
                    <tbody>
                      {(market?.top_gainers || []).map((t, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                          <td>${t.price >= 1 ? t.price?.toFixed(2) : t.price?.toFixed(4)}</td>
                          <td style={{ color: 'var(--green)', fontWeight: 700 }}>+{t.change_24h}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="sec">
                <div className="sh"><h2><TrendingDown size={17} color="var(--red)" /> Top Losers</h2></div>
                <div className="tw">
                  <table>
                    <thead><tr><th>Token</th><th>Price</th><th>24h Change</th></tr></thead>
                    <tbody>
                      {(market?.top_losers || []).map((t, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                          <td>${t.price >= 1 ? t.price?.toFixed(2) : t.price?.toFixed(4)}</td>
                          <td style={{ color: 'var(--red)', fontWeight: 700 }}>{t.change_24h}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            BACKTEST TAB
            ═══════════════════════════════════════════════════════ */}
        {tab === 'backtest' && (
          <div className="fade">
            <div className="sec">
              <div className="sh">
                <h2><BarChart3 size={17} color="var(--accent)" /> Historical Backtesting</h2>
                <button className="btn btn-p" onClick={runBT}>
                  <Play size={14} /> Run Full Backtest
                </button>
              </div>

              {backtest?.headline ? (
                <div className="info-box" style={{
                  borderLeftColor: 'var(--accent)', background: 'var(--accent-light)',
                  marginBottom: 18, padding: '18px 20px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--text)' }}>
                    {backtest.headline}
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-2)' }}>
                    <span>Win Rate: <strong style={{ color: 'var(--green)' }}>{backtest.win_rate}</strong></span>
                    <span>Period: <strong>{backtest.period}</strong></span>
                    <span>Avg Savings: <strong style={{ color: 'var(--green)' }}>{backtest.avg_savings}</strong></span>
                  </div>
                  {backtest.worst_avoided && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                      Best save: {backtest.worst_avoided}
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty">
                  <BarChart3 size={36} color="var(--text-3)" />
                  <p style={{ fontWeight: 600, marginTop: 12 }}>Run a backtest to see results</p>
                  <p style={{ fontSize: 12 }}>
                    Simulates UnlockShield's performance on 13 real historical unlock events
                  </p>
                </div>
              )}

              {backtest?.total_events_analyzed > 0 && (
                <>
                  <div className="btg">
                    <div className="bts">
                      <div className="bv" style={{ color: 'var(--green)' }}>{fmt(backtest.total_savings)}</div>
                      <div className="bl">Total Saved</div>
                    </div>
                    <div className="bts">
                      <div className="bv" style={{ color: 'var(--accent)' }}>{backtest.win_rate}%</div>
                      <div className="bl">Win Rate</div>
                    </div>
                    <div className="bts">
                      <div className="bv" style={{ color: 'var(--red)' }}>{fmt(backtest.total_loss_without_shield)}</div>
                      <div className="bl">Loss Without Shield</div>
                    </div>
                    <div className="bts">
                      <div className="bv" style={{ color: 'var(--yellow)' }}>{fmt(backtest.total_loss_with_shield)}</div>
                      <div className="bl">Loss With Shield</div>
                    </div>
                  </div>

                  {backtest.per_token && (
                    <div className="tw" style={{ marginBottom: 16 }}>
                      <table>
                        <thead><tr><th>Token</th><th>Events</th><th>Avg Impact</th><th>Worst</th><th>Savings</th></tr></thead>
                        <tbody>
                          {Object.entries(backtest.per_token).map(([t, d]) => (
                            <tr key={t}>
                              <td style={{ fontWeight: 700 }}>{t}</td>
                              <td>{d.events}</td>
                              <td style={{ color: 'var(--red)' }}>{d.avg_impact}%</td>
                              <td style={{ color: 'var(--red)', fontWeight: 600 }}>{d.worst_impact}%</td>
                              <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmt(d.savings)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {backtest.detailed_results && (
                    <div className="tw">
                      <table>
                        <thead>
                          <tr><th>Token</th><th>Date</th><th>Supply</th><th>Impact</th><th>Strategy</th><th>Without</th><th>With</th><th>Saved</th></tr>
                        </thead>
                        <tbody>
                          {backtest.detailed_results.map((r, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{r.token}</td>
                              <td style={{ fontSize: 12 }}>{r.date}</td>
                              <td>{r.pct_supply}%</td>
                              <td style={{ color: 'var(--red)', fontWeight: 600 }}>{r.actual_impact}%</td>
                              <td>
                                <span className={`str ${sc(r.strategy_chosen)}`}>
                                  {r.strategy_chosen?.replace('_', ' ')}
                                </span>
                              </td>
                              <td style={{ color: 'var(--red)' }}>{fmt(r.loss_without_shield)}</td>
                              <td style={{ color: 'var(--yellow)' }}>{fmt(r.loss_with_shield)}</td>
                              <td style={{ color: 'var(--green)', fontWeight: 700 }}>
                                {fmt(r.savings)} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({r.savings_pct}%)</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            PORTFOLIO TAB
            ═══════════════════════════════════════════════════════ */}
        {tab === 'portfolio' && (
          <div className="fade">
            <div className="sec">
              <div className="sh">
                <h2><PieChart size={17} color="var(--purple)" /> Portfolio Holdings</h2>
              </div>
              {portfolio?.holdings ? (
                <div className="tw">
                  <table>
                    <thead><tr><th>Token</th><th>Holdings</th><th>Price</th><th>Value</th><th>Unlock Risk</th></tr></thead>
                    <tbody>
                      {portfolio.holdings.map((h, i) => {
                        const has = unlocks.some(u => u.token_symbol === h.token_symbol)
                        return (
                          <tr key={i}>
                            <td>
                              <div className="tc">
                                <div className="ti">{h.token_symbol?.slice(0, 2)}</div>
                                <span className="tn">{h.token_symbol}</span>
                              </div>
                            </td>
                            <td>{h.amount?.toLocaleString()}</td>
                            <td>${h.current_price?.toFixed(4)}</td>
                            <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmt(h.value_usd)}</td>
                            <td>
                              {has ? (
                                <span className="rsk r-h" style={{ fontSize: 10 }}>
                                  <AlertTriangle size={10} /> UNLOCK PENDING
                                </span>
                              ) : (
                                <span className="rsk r-l" style={{ fontSize: 10 }}>
                                  <CheckCircle size={10} /> Safe
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">
                  <Wallet size={36} color="var(--text-3)" />
                  <p style={{ fontWeight: 600, marginTop: 12 }}>Portfolio data loading...</p>
                  <p style={{ fontSize: 12 }}>
                    The agent monitors demo holdings to demonstrate unlock protection.
                    In production, connect your wallet for real portfolio tracking.
                  </p>
                </div>
              )}
            </div>

            {/* Architecture */}
            <div className="sec">
              <div className="sh"><h2><Cpu size={17} color="var(--cyan)" /> Agent Architecture</h2></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { i: <Eye size={20} />, t: 'Monitor', d: '300+ tokens tracked via CoinGecko, 40+ unlock events from Tokenomist', c: 'var(--yellow)', bg: 'var(--yellow-light)' },
                  { i: <Cpu size={20} />, t: 'Analyze', d: 'Claude Sonnet 4 with 5-factor model: supply shock, history, recipients, regime, urgency', c: 'var(--purple)', bg: 'var(--purple-light)' },
                  { i: <Shield size={20} />, t: 'Protect', d: '6 hedge strategies from FULL_EXIT to OPTIONS_PUT with step-by-step execution plans', c: 'var(--green)', bg: 'var(--green-light)' },
                  { i: <Database size={20} />, t: 'Attest', d: 'Every prediction and hedge recorded immutably on Kite AI blockchain', c: 'var(--accent)', bg: 'var(--accent-light)' },
                  { i: <BarChart3 size={20} />, t: 'Backtest', d: 'Validated on 13 real events from 2024-25. Proven savings across 6 tokens.', c: 'var(--cyan)', bg: 'var(--cyan-light)' },
                  { i: <Globe size={20} />, t: 'Intelligence', d: 'Market regime, Fear & Greed, DeFiLlama TVL, volume anomalies, sector analysis', c: 'var(--red)', bg: 'var(--red-light)' },
                ].map((c, i) => (
                  <div className="crd" key={i} style={{ textAlign: 'center', padding: 20, cursor: 'default' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
                      background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.c
                    }}>
                      {c.i}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{c.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{c.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            KITE ECOSYSTEM TAB
            ═══════════════════════════════════════════════════════ */}
        {tab === 'kite' && (
          <div className="fade">
            {/* AA Wallet */}
            <div className="sec">
              <div className="sh">
                <h2><Wallet size={17} color="var(--accent)" /> Agent Smart Wallet (ERC-4337)</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                <div className="crd" style={{ cursor: 'default', borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, fontWeight: 600 }}>
                    Wallet Address
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--text)' }}>
                    {walletData?.wallet?.address || 'Not Configured'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                    {walletData?.wallet?.type || 'Kite AA Smart Wallet'}
                  </div>
                </div>
                <div className="crd" style={{ cursor: 'default', borderLeft: '3px solid var(--green)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, fontWeight: 600 }}>
                    Total Balance
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>
                    {fmt(walletData?.balances?.total_usd || 0)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    Settlement: {fmt(walletData?.balances?.settlement_token || 0)} &bull; L-USDC: {fmt(walletData?.balances?.lusdc_yield_bearing || 0)}
                  </div>
                </div>
                <div className="crd" style={{ cursor: 'default', borderLeft: '3px solid var(--yellow)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, fontWeight: 600 }}>
                    Daily Spend Limit
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--yellow)' }}>
                    {fmt(walletData?.spending_rules?.remaining_today_usd || 50000)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    of {fmt(walletData?.spending_rules?.daily_limit_usd || 50000)} remaining
                  </div>
                </div>
              </div>

              <div className="tw" style={{ marginBottom: 16 }}>
                <table>
                  <thead><tr><th>Rule</th><th>Value</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr><td style={{ fontWeight: 600 }}>Daily Spend Limit</td><td>{fmt(walletData?.spending_rules?.daily_limit_usd || 50000)}</td><td><span className="rsk r-l">Active</span></td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Max Single Trade</td><td>{fmt(walletData?.spending_rules?.max_single_trade_usd || 25000)}</td><td><span className="rsk r-l">Active</span></td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Attestation Required</td><td>Every hedge attested on-chain</td><td><span className="rsk r-l">Enforced</span></td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Auto-Yield on Idle</td><td>Idle USDC → L-USDC (4% APY)</td><td><span className="rsk r-l">{walletData?.spending_rules?.auto_yield_on_idle ? 'On' : 'Off'}</span></td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Gasless Transactions</td><td>ERC-4337 via Kite Bundler</td><td><span className="rsk r-l">Enabled</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* L-USDC Yield */}
            <div className="sec">
              <div className="sh">
                <h2><TrendingUp size={17} color="var(--green)" /> L-USDC Yield (Lucid Protocol)</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="bts">
                  <div className="bv" style={{ color: 'var(--green)' }}>{yieldData?.apy || '4.0%'}</div>
                  <div className="bl">APY</div>
                </div>
                <div className="bts">
                  <div className="bv">{fmt(yieldData?.balance || 0)}</div>
                  <div className="bl">L-USDC Balance</div>
                </div>
                <div className="bts">
                  <div className="bv" style={{ color: 'var(--green)' }}>+${yieldData?.yield_daily?.toFixed(2) || '0.00'}/d</div>
                  <div className="bl">Daily Yield</div>
                </div>
                <div className="bts">
                  <div className="bv" style={{ color: 'var(--green)' }}>{fmt(yieldData?.yield_annual || 0)}</div>
                  <div className="bl">Annual Yield</div>
                </div>
              </div>

              <div className="info-box" style={{
                borderLeftColor: 'var(--green)', background: 'var(--green-light)',
                fontSize: 13
              }}>
                <strong style={{ color: 'var(--text)' }}>How it works:</strong>{' '}
                {yieldData?.strategy || 'Idle hedged USDC is automatically converted to L-USDC to earn yield. When a hedge needs execution, L-USDC is redeemed back to USDC. The 10% withdrawal buffer ensures instant liquidity for urgent hedges.'}
                <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
                  <span>Backing: <strong style={{ color: 'var(--text-2)' }}>Aave v3</strong></span>
                  <span>Bridge: <strong style={{ color: 'var(--text-2)' }}>LayerZero v2</strong></span>
                  <span>Buffer: <strong style={{ color: 'var(--text-2)' }}>10% instant</strong></span>
                  <span>
                    Token:{' '}
                    <a href={`https://testnet.kitescan.ai/address/${yieldData?.address || '0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e'}`}
                      target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      View on KiteScan
                    </a>
                  </span>
                </div>
              </div>
            </div>

            {/* Vault */}
            <div className="sec">
              <div className="sh"><h2><Lock size={17} color="var(--purple)" /> ClientAgent Vault</h2></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="crd" style={{ cursor: 'default' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600, letterSpacing: '.5px' }}>
                    Vault Status
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className={`rsk ${walletData?.vault?.status === 'active' ? 'r-l' : 'r-m'}`}>
                      {walletData?.vault?.status === 'active' ? 'Active' : 'Not Deployed'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    Impl: {walletData?.vault?.implementation || '0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23'}
                  </div>
                </div>
                <div className="crd" style={{ cursor: 'default' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600, letterSpacing: '.5px' }}>
                    Infrastructure
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.9 }}>
                    <div>Bundler: <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)' }}>bundler-service.staging.gokite.ai</span></div>
                    <div>Settlement: <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)' }}>0x8d9F...ec3</span></div>
                    <div>Chain: <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Kite AI Testnet (2368)</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goldsky Subgraph */}
            <div className="sec">
              <div className="sh">
                <h2><Database size={17} color="var(--cyan)" /> Goldsky Subgraph Indexer</h2>
              </div>
              <div className="crd" style={{ cursor: 'default', borderLeft: '3px solid var(--cyan)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Real-Time Attestation Indexing</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>
                  Every prediction, hedge action, and outcome is indexed by Goldsky's subgraph infrastructure on Kite AI Testnet.
                  Query via GraphQL for instant access to the agent's full on-chain history.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                  {[
                    { l: 'Predictions', d: 'Token unlock risk assessments with risk scores and reasoning', ic: <Target size={16} />, bg: 'var(--cyan-light)' },
                    { l: 'Hedge Actions', d: 'Strategy execution records with amounts and venues', ic: <Shield size={16} />, bg: 'var(--green-light)' },
                    { l: 'Outcomes', d: 'Actual vs predicted impact with accuracy tracking', ic: <CheckCircle size={16} />, bg: 'var(--purple-light)' },
                  ].map((c, i) => (
                    <div key={i} style={{
                      background: c.bg, border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: 14
                    }}>
                      <div style={{ color: 'var(--text)', marginBottom: 6 }}>{c.ic}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{c.l}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{c.d}</div>
                    </div>
                  ))}
                </div>
                <div className="code-block">
                  <span className="code-comment">{'// Example GraphQL Query'}</span><br />
                  {'{ '}<span className="code-key">predictions</span>{'(first: 10, orderBy: createdAt, orderDirection: desc) {'}<br />
                  {'    '}<span className="code-str">tokenSymbol riskScore predictedPriceImpact outcomeRecorded</span><br />
                  {'    '}<span className="code-key">hedgeActions</span>{' { actionType details }'}<br />
                  {'} }'}
                </div>
              </div>
            </div>

            {/* Kite Stack Integration */}
            <div className="sec">
              <div className="sh"><h2><Zap size={17} color="var(--yellow)" /> Full Kite Stack Integration</h2></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { t: 'Account Abstraction (ERC-4337)', d: 'Smart wallet with spending rules, daily limits, gasless tx via Kite bundler. Agent operates autonomously within programmable constraints.', c: 'var(--accent)', bg: 'var(--accent-light)', s: 'Active' },
                  { t: 'L-USDC Yield (Lucid Protocol)', d: 'Idle hedged funds earn 4% APY via Aave v3 backing. Bridge-agnostic via LayerZero v2. 10% instant withdrawal buffer.', c: 'var(--green)', bg: 'var(--green-light)', s: 'Active' },
                  { t: 'On-Chain Attestation', d: 'Every prediction and hedge is recorded immutably on Kite blockchain. Reputation score tracks prediction accuracy over time.', c: 'var(--purple)', bg: 'var(--purple-light)', s: 'Active' },
                  { t: 'Goldsky Subgraph Indexing', d: 'Real-time GraphQL API indexes all attestation events. Enables dashboards, analytics, and third-party integrations.', c: 'var(--cyan)', bg: 'var(--cyan-light)', s: 'Active' },
                  { t: 'Settlement Contract', d: 'All hedge payments flow through Kite Settlement Contract with full audit trail. Transparent fee structure.', c: 'var(--yellow)', bg: 'var(--yellow-light)', s: 'Active' },
                  { t: 'LayerZero v2 Bridge', d: 'Cross-chain L-USDC bridging via LayerZero endpoint on Kite. Enables multi-chain hedge execution.', c: 'var(--red)', bg: 'var(--red-light)', s: 'Configured' },
                ].map((c, i) => (
                  <div className="crd" key={i} style={{ cursor: 'default', borderLeft: `3px solid ${c.c}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.t}</div>
                      <span className="rsk r-l" style={{ fontSize: 10 }}>{c.s}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{c.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div style={{
          textAlign: 'center', padding: '28px 0 16px',
          borderTop: '1px solid var(--border)', marginTop: 20,
          fontSize: 12, color: 'var(--text-3)'
        }}>
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: 'var(--text)' }}>UnlockShield</strong> — Autonomous AI Agent for Token Unlock Hedging
          </div>
          <div>
            Built on{' '}
            <a href="https://gokite.ai" target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Kite AI</a>
            {' '}for the Global Hackathon 2026 &bull;{' '}
            <a href="https://testnet.kitescan.ai" target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>KiteScan</a>
            {' '}&bull;{' '}
            <a href="https://github.com/Rajatd91/unlockshield" target="_blank" rel="noopener" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>GitHub</a>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
