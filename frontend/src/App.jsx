import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Shield, AlertTriangle, TrendingDown, TrendingUp, Activity, Zap, ExternalLink,
  RefreshCw, CheckCircle, BarChart3, Globe, Clock, Target, ArrowUpRight,
  ArrowDownRight, Cpu, Database, Eye, ChevronDown, ChevronRight, Info,
  PieChart, Layers, Wallet, Search, Filter, Gauge, Flame, Snowflake
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || ''

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const css = `
  :root {
    --bg: #05070e; --bg-card: #0c1017; --bg-hover: #111827; --bg-elevated: #151c2b;
    --border: #1a2235; --border-hover: #2d3a52; --text: #f1f5f9; --text-2: #94a3b8;
    --text-3: #64748b; --accent: #3b82f6; --glow: rgba(59,130,246,.12);
    --purple: #8b5cf6; --green: #10b981; --red: #ef4444; --yellow: #f59e0b; --cyan: #06b6d4;
    --green-d: rgba(16,185,129,.1); --red-d: rgba(239,68,68,.1); --yellow-d: rgba(245,158,11,.1);
    --gradient: linear-gradient(135deg,#3b82f6,#8b5cf6);
  }
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg);color:var(--text);
       min-height:100vh;-webkit-font-smoothing:antialiased}
  .app{max-width:1400px;margin:0 auto;padding:14px 22px}

  .hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 0;margin-bottom:18px}
  .logo{display:flex;align-items:center;gap:12px}
  .logo h1{font-size:21px;font-weight:800;letter-spacing:-.5px;background:var(--gradient);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .bdg{font-size:9px;font-weight:700;padding:3px 7px;border-radius:4px;text-transform:uppercase;
       letter-spacing:.6px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-3)}
  .bdg-live{background:var(--green-d);color:var(--green);border-color:rgba(16,185,129,.2)}
  .hdr-btns{display:flex;gap:8px;align-items:center}
  .btn{border:none;padding:8px 16px;border-radius:7px;font-weight:600;font-size:12px;cursor:pointer;
       display:flex;align-items:center;gap:6px;transition:all .15s}
  .btn-p{background:var(--gradient);color:#fff}
  .btn-p:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 4px 16px var(--glow)}
  .btn-p:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
  .btn-g{background:var(--bg-elevated);color:var(--text-2);border:1px solid var(--border)}
  .btn-g:hover{border-color:var(--border-hover);color:var(--text)}

  /* Ticker */
  .ticker{display:flex;gap:10px;margin-bottom:18px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
  .ticker::-webkit-scrollbar{display:none}
  .tk{background:var(--bg-card);border:1px solid var(--border);border-radius:9px;padding:10px 16px;
      min-width:145px;flex-shrink:0}
  .tk .l{font-size:9px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .tk .v{font-size:17px;font-weight:700}
  .tk .c{font-size:11px;font-weight:600;margin-top:1px}

  /* Stats */
  .stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}
  .st{background:var(--bg-card);border:1px solid var(--border);border-radius:11px;padding:16px;
      transition:border-color .15s}
  .st:hover{border-color:var(--border-hover)}
  .st .ib{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .st .ic{width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center}
  .st .sl{font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px}
  .st .sv{font-size:22px;font-weight:700;margin-top:1px;line-height:1.1}
  .st .ss{font-size:10px;color:var(--text-3);margin-top:3px}

  /* Tabs */
  .tabs{display:flex;gap:1px;margin-bottom:16px;background:var(--bg-card);border-radius:9px;
        padding:3px;border:1px solid var(--border);width:fit-content}
  .tab{padding:7px 16px;border-radius:7px;font-size:12px;font-weight:500;color:var(--text-3);
       cursor:pointer;border:none;background:none;display:flex;align-items:center;gap:5px;transition:all .15s}
  .tab:hover{color:var(--text-2)}
  .tab.on{background:var(--bg-elevated);color:var(--text);font-weight:600}

  /* Section */
  .sec{margin-bottom:22px}
  .sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .sh h2{font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px}
  .cnt{background:var(--bg-elevated);padding:2px 7px;border-radius:9px;font-size:10px;color:var(--text-3);font-weight:600}

  /* Table */
  .tw{background:var(--bg-card);border:1px solid var(--border);border-radius:11px;overflow:hidden}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;padding:9px 14px;font-size:9px;color:var(--text-3);text-transform:uppercase;
     letter-spacing:.5px;background:var(--bg-elevated);border-bottom:1px solid var(--border);font-weight:600}
  td{padding:10px 14px;border-bottom:1px solid rgba(26,34,53,.5);font-size:12px}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(17,24,39,.5)}
  .tc{display:flex;align-items:center;gap:9px}
  .ti{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;border:1px solid var(--border);overflow:hidden}
  .ti img{width:100%;height:100%}
  .tn{font-weight:600;font-size:13px}
  .ts{font-size:10px;color:var(--text-3)}

  /* Risk/Strategy badges */
  .rsk{padding:2px 9px;border-radius:14px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px}
  .r-c{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.2)}
  .r-h{background:var(--red-d);color:var(--red);border:1px solid rgba(239,68,68,.15)}
  .r-m{background:var(--yellow-d);color:var(--yellow);border:1px solid rgba(245,158,11,.15)}
  .r-l{background:var(--green-d);color:var(--green);border:1px solid rgba(16,185,129,.15)}
  .str{padding:2px 8px;border-radius:5px;font-size:10px;font-weight:600;background:var(--bg-elevated);color:var(--text-2);white-space:nowrap}
  .s-exit{background:rgba(239,68,68,.08);color:#f87171}
  .s-reduce{background:rgba(245,158,11,.08);color:#fbbf24}
  .s-hedge{background:rgba(59,130,246,.08);color:#60a5fa}
  .s-put{background:rgba(139,92,246,.08);color:#a78bfa}
  .s-dca{background:rgba(6,182,212,.08);color:#22d3ee}

  /* Cards */
  .crd{background:var(--bg-card);border:1px solid var(--border);border-radius:11px;padding:14px;
       margin-bottom:8px;transition:border-color .15s;cursor:pointer}
  .crd:hover{border-color:var(--border-hover)}
  .ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
  .cb{color:var(--text-2);font-size:12px;line-height:1.6}

  /* Factor bars */
  .fr{display:flex;align-items:center;gap:7px;margin-bottom:5px}
  .fl{font-size:10px;color:var(--text-3);width:100px;flex-shrink:0}
  .fb{flex:1;height:5px;background:var(--bg-elevated);border-radius:3px;overflow:hidden}
  .fv{height:100%;border-radius:3px;transition:width .4s ease}
  .fn{font-size:10px;font-weight:600;width:26px;text-align:right;flex-shrink:0}

  /* Execution plan */
  .ps{padding-left:0;list-style:none}
  .ps-s{position:relative;padding:7px 0 7px 22px;border-left:2px solid var(--border);margin-left:7px;font-size:11px;color:var(--text-2)}
  .ps-s:last-child{border-left-color:transparent}
  .ps-s::before{content:'';position:absolute;left:-4px;top:11px;width:6px;height:6px;border-radius:50%;background:var(--accent)}
  .ps-a{font-weight:600;color:var(--text)}

  /* Regime */
  .rgm{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;font-size:11px;font-weight:700}
  .rgm-bull{background:var(--green-d);color:var(--green)}
  .rgm-bear{background:var(--red-d);color:var(--red)}
  .rgm-sideways{background:var(--yellow-d);color:var(--yellow)}

  /* Backtest */
  .btg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
  .bts{background:var(--bg-elevated);border-radius:9px;padding:12px;text-align:center}
  .bts .bv{font-size:20px;font-weight:700}
  .bts .bl{font-size:9px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin-top:3px}

  /* Heatmap cell */
  .hm{display:inline-block;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600;margin:2px}

  /* Search */
  .srch{position:relative;margin-bottom:14px}
  .srch input{width:100%;padding:9px 14px 9px 36px;background:var(--bg-card);border:1px solid var(--border);
              border-radius:8px;color:var(--text);font-size:12px;outline:none}
  .srch input:focus{border-color:var(--accent)}
  .srch svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3)}

  /* Sector pills */
  .spill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:5px;font-size:10px;
         font-weight:600;margin:2px;cursor:pointer;border:1px solid var(--border);transition:all .15s}
  .spill:hover{border-color:var(--border-hover)}
  .spill.on{border-color:var(--accent);background:var(--glow)}
  .spill .dot{width:6px;height:6px;border-radius:50%}

  .tx-link{color:var(--accent);font-size:10px;display:inline-flex;align-items:center;gap:3px;text-decoration:none;margin-top:6px;opacity:.8}
  .tx-link:hover{opacity:1;text-decoration:underline}

  .empty{text-align:center;padding:40px 20px;color:var(--text-3)}
  .empty p{margin-top:6px;font-size:13px}
  .spin{animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fade{animation:fade .25s ease}
  @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .pulse{animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

  @media(max-width:1024px){.stats{grid-template-columns:repeat(3,1fr)}.btg{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:768px){.stats{grid-template-columns:repeat(2,1fr)}.app{padding:10px 14px}}
`

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = v => {if(v==null||isNaN(v))return'$0';if(v>=1e12)return`$${(v/1e12).toFixed(2)}T`;if(v>=1e9)return`$${(v/1e9).toFixed(1)}B`;if(v>=1e6)return`$${(v/1e6).toFixed(1)}M`;if(v>=1e3)return`$${(v/1e3).toFixed(1)}K`;return`$${v.toFixed(0)}`}
const fmtD = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'})
const days = d => Math.ceil((new Date(d)-new Date())/864e5)
const pc = v => v>0?'var(--green)':v<0?'var(--red)':'var(--text-3)'
const rc = s => s>=80?'r-c':s>=55?'r-h':s>=35?'r-m':'r-l'
const rl = s => s>=80?'CRITICAL':s>=55?'HIGH':s>=35?'MEDIUM':'LOW'
const sc = s => ({FULL_EXIT:'s-exit',REDUCE_POSITION:'s-reduce',SHORT_HEDGE:'s-hedge',OPTIONS_PUT:'s-put',DCA_EXIT:'s-dca'})[s]||''
const fc = s => s>=70?'var(--red)':s>=45?'var(--yellow)':'var(--green)'
const hmBg = v => v>5?'rgba(16,185,129,.25)':v>2?'rgba(16,185,129,.12)':v>0?'rgba(16,185,129,.06)':v>-2?'rgba(239,68,68,.06)':v>-5?'rgba(239,68,68,.12)':'rgba(239,68,68,.25)'
const hmC = v => v>2?'var(--green)':v<-2?'var(--red)':'var(--text-2)'

const SECTOR_COLORS = {L1:'#3b82f6',L2:'#8b5cf6',DeFi:'#10b981',Gaming:'#f59e0b',Infra:'#06b6d4',Stable:'#94a3b8',Meme:'#f472b6',Other:'#64748b'}

/* ─── App ─────────────────────────────────────────────────────────────── */
function App() {
  const [tab,setTab] = useState('dashboard')
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
  const [loading,setLoading] = useState(true)
  const [expanded,setExpanded] = useState(null)
  const [tokenSearch,setTokenSearch] = useState('')
  const [sectorFilter,setSectorFilter] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
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
    } catch(e) {console.error(e)}
    setLoading(false)
  },[])

  useEffect(()=>{load()},[load])

  const scan = async () => {
    setScanning(true)
    try {
      const r = await fetch(`${API}/api/agent/scan`,{method:'POST'})
      const d = await r.json()
      setAnalyses(d.results||[])
      await load()
    } catch(e) {console.error(e)}
    setScanning(false)
  }

  const runBT = async () => {
    try {const r=await fetch(`${API}/api/backtest/run`);setBacktest(await r.json())} catch(e){console.error(e)}
  }

  // Market data
  const regime = market?.market_regime
  const glob = market?.global||{}
  const fg = market?.fear_greed||{}
  const sectors = market?.sectors||{}
  const topTokens = market?.top_tokens||[]
  const anomalies = market?.volume_anomalies||[]

  // Filtered tokens for market tab
  const filteredTokens = useMemo(() => {
    let t = topTokens
    if (sectorFilter) t = t.filter(x => x.sector === sectorFilter)
    if (tokenSearch) {
      const q = tokenSearch.toUpperCase()
      t = t.filter(x => x.symbol?.includes(q) || x.name?.toUpperCase().includes(q))
    }
    return t
  }, [topTokens, sectorFilter, tokenSearch])

  if (loading) return (
    <><style>{css}</style>
    <div className="app"><div className="empty">
      <Shield size={44} color="var(--accent)" className="pulse"/>
      <p style={{marginTop:14,fontSize:15,fontWeight:600}}>Loading UnlockShield...</p>
      <p style={{fontSize:12,color:'var(--text-3)',marginTop:3}}>Connecting to Kite AI • Fetching 300+ tokens</p>
    </div></div></>
  )

  return (
    <><style>{css}</style>
    <div className="app">

      {/* HEADER */}
      <div className="hdr">
        <div className="logo">
          <Shield size={24} color="var(--accent)"/>
          <h1>UnlockShield</h1>
          <span className="bdg">Kite AI</span>
          {agent?.kite_connected && <span className="bdg bdg-live">● Live</span>}
        </div>
        <div className="hdr-btns">
          <button className="btn btn-g" onClick={load}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-p" onClick={scan} disabled={scanning}>
            {scanning?<RefreshCw size={13} className="spin"/>:<Zap size={13}/>}
            {scanning?'Scanning...':'Run Agent Scan'}
          </button>
        </div>
      </div>

      {/* MARKET TICKER */}
      {market && (
        <div className="ticker fade">
          <div className="tk">
            <div className="l">Global Market Cap</div>
            <div className="v">{fmt(glob.total_market_cap)}</div>
            <div className="c" style={{color:pc(glob.market_cap_change_24h)}}>{glob.market_cap_change_24h>0?'+':''}{glob.market_cap_change_24h}%</div>
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
            <div className="v" style={{color:fg.value>=60?'var(--green)':fg.value<=35?'var(--red)':'var(--yellow)'}}>
              {fg.value||'--'}<span style={{fontSize:11,color:'var(--text-3)'}}>/100</span>
            </div>
            <div style={{fontSize:10,color:'var(--text-3)'}}>{fg.classification||''}</div>
          </div>
          {regime && (
            <div className="tk">
              <div className="l">Market Regime</div>
              <div className={`rgm rgm-${regime.regime?.toLowerCase()}`}>
                {regime.regime==='BULL'?<TrendingUp size={13}/>:regime.regime==='BEAR'?<TrendingDown size={13}/>:<Activity size={13}/>}
                {regime.regime} <span style={{fontWeight:400,opacity:.7}}>{Math.round((regime.confidence||0)*100)}%</span>
              </div>
            </div>
          )}
          <div className="tk">
            <div className="l">Tokens Tracked</div>
            <div className="v" style={{color:'var(--cyan)'}}>{market.tokens_count||'300+'}</div>
          </div>
          <div className="tk">
            <div className="l">TVL (DeFi)</div>
            <div className="v">{fmt(market.tvl?.total)}</div>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="stats">
        <div className="st">
          <div className="ib"><div className="ic" style={{background:'var(--glow)'}}><Wallet size={16} color="var(--accent)"/></div></div>
          <div className="sl">Portfolio</div>
          <div className="sv">{portfolio?fmt(portfolio.total_value_usd):'$0'}</div>
          <div className="ss">{portfolio?.holdings_count||0} tokens</div>
        </div>
        <div className="st">
          <div className="ib"><div className="ic" style={{background:'var(--green-d)'}}><Shield size={16} color="var(--green)"/></div></div>
          <div className="sl">Protected</div>
          <div className="sv" style={{color:'var(--green)'}}>{portfolio?fmt(portfolio.total_value_protected):'$0'}</div>
          <div className="ss">{hedges.length} hedges</div>
        </div>
        <div className="st">
          <div className="ib"><div className="ic" style={{background:'var(--yellow-d)'}}><AlertTriangle size={16} color="var(--yellow)"/></div></div>
          <div className="sl">Unlocks</div>
          <div className="sv" style={{color:'var(--yellow)'}}>{unlocks.length}</div>
          <div className="ss">Next 90 days</div>
        </div>
        <div className="st">
          <div className="ib"><div className="ic" style={{background:'rgba(139,92,246,.1)'}}><Cpu size={16} color="var(--purple)"/></div></div>
          <div className="sl">AI Engine</div>
          <div className="sv" style={{fontSize:13,color:'var(--purple)'}}>Claude Sonnet 4</div>
          <div className="ss">5-factor risk model</div>
        </div>
        <div className="st">
          <div className="ib"><div className="ic" style={{background:'rgba(6,182,212,.1)'}}><Database size={16} color="var(--cyan)"/></div></div>
          <div className="sl">Kite Chain</div>
          <div className="sv" style={{fontSize:13,color:agent?.kite_connected?'var(--green)':'var(--red)'}}>
            {agent?.kite_connected?'● Connected':'○ Offline'}
          </div>
          <div className="ss">Chain ID: 2368</div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {[
          {k:'dashboard',i:<Layers size={13}/>,l:'Dashboard'},
          {k:'market',i:<Globe size={13}/>,l:`Market (${market?.tokens_count||'300+'})`},
          {k:'backtest',i:<BarChart3 size={13}/>,l:'Backtest'},
          {k:'portfolio',i:<PieChart size={13}/>,l:'Portfolio'},
          {k:'kite',i:<Zap size={13}/>,l:'Kite Ecosystem'},
        ].map(t=>(
          <button key={t.k} className={`tab ${tab===t.k?'on':''}`} onClick={()=>setTab(t.k)}>{t.i} {t.l}</button>
        ))}
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {tab==='dashboard' && (
        <div className="fade">
          {/* Unlock Table */}
          <div className="sec">
            <div className="sh">
              <h2><AlertTriangle size={16} color="var(--yellow)"/> Upcoming Token Unlocks <span className="cnt">{unlocks.length}</span></h2>
            </div>
            {unlocks.length===0?(
              <div className="empty"><Clock size={32} color="var(--text-3)"/><p>Click <strong>Run Agent Scan</strong> to load unlock data</p></div>
            ):(
              <div className="tw"><table><thead><tr>
                <th>Token</th><th>Date</th><th>Amount</th><th>Supply %</th><th>Risk</th><th>Strategy</th><th>Impact</th>
              </tr></thead><tbody>
                {unlocks.map((u,i)=>{
                  const a=analyses.find(x=>x.token===u.token_symbol)
                  const rs=a?.risk_score||Math.round(u.total_supply_percent*6.5)
                  const d=days(u.unlock_date)
                  return(<tr key={i}>
                    <td><div className="tc"><div className="ti" style={{color:'var(--accent)',background:'var(--bg-elevated)'}}>{u.token_symbol?.slice(0,2)}</div><div><div className="tn">{u.token_symbol}</div><div className="ts">{u.token_name}</div></div></div></td>
                    <td><div>{fmtD(u.unlock_date)}</div><div style={{fontSize:10,color:d<=7?'var(--red)':'var(--text-3)'}}>{d}d {d<=7&&'⚠️'}</div></td>
                    <td><div style={{fontWeight:600}}>{fmt(u.unlock_amount_usd)}</div><div style={{fontSize:10,color:'var(--text-3)'}}>{u.unlock_amount_tokens?.toLocaleString()} tkns</div></td>
                    <td><span style={{fontWeight:600,color:u.total_supply_percent>=5?'var(--red)':u.total_supply_percent>=1?'var(--yellow)':'var(--text)'}}>{u.total_supply_percent}%</span></td>
                    <td><span className={`rsk ${rc(rs)}`}>{rl(rs)} {rs}</span></td>
                    <td><span className={`str ${sc(a?.recommended_action)}`}>{a?.recommended_action?.replace('_',' ')||'PENDING'}</span></td>
                    <td style={{color:'var(--red)',fontWeight:600}}>{a?.predicted_impact||`~${(-u.total_supply_percent*3).toFixed(0)}%`}</td>
                  </tr>)
                })}
              </tbody></table></div>
            )}
          </div>

          {/* Scan Results */}
          {analyses.length>0 && (
            <div className="sec fade">
              <div className="sh"><h2><Activity size={16} color="var(--accent)"/> AI Scan Results <span className="cnt">{analyses.length}</span></h2></div>
              {analyses.map((r,i)=>(
                <div className="crd" key={i} onClick={()=>setExpanded(expanded===i?null:i)}>
                  <div className="ch">
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontWeight:700,fontSize:14}}>{r.token}</span>
                      <span className={`rsk ${rc(r.risk_score)}`}>Risk: {r.risk_score}</span>
                      <span className={`str ${sc(r.recommended_action)}`}>{r.recommended_action?.replace('_',' ')}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{color:'var(--red)',fontWeight:700}}>{r.predicted_impact}</span>
                      {expanded===i?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
                    </div>
                  </div>
                  <div className="cb">{r.reasoning}</div>
                  {expanded===i && (
                    <div className="fade" style={{marginTop:10}}>
                      {r.factor_scores && (<div style={{marginBottom:10}}>
                        <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',marginBottom:6,textTransform:'uppercase'}}>Risk Factor Breakdown</div>
                        {Object.entries(r.factor_scores).map(([k,v])=>(
                          <div className="fr" key={k}><span className="fl">{k.replace(/_/g,' ')}</span><div className="fb"><div className="fv" style={{width:`${v}%`,background:fc(v)}}/></div><span className="fn" style={{color:fc(v)}}>{v}</span></div>
                        ))}
                      </div>)}
                      {r.key_risks && r.key_risks.length>0 && (
                        <div style={{fontSize:11,color:'var(--text-2)',marginBottom:8}}>
                          <strong>Key Risks:</strong> {r.key_risks.join(' • ')}
                        </div>
                      )}
                      {r.similar_event && (
                        <div style={{fontSize:11,color:'var(--text-3)',marginBottom:8,fontStyle:'italic'}}>
                          Similar event: {r.similar_event}
                        </div>
                      )}
                      {r.hedge?.execution_plan && (<div style={{marginTop:6}}>
                        <div style={{fontSize:10,fontWeight:600,color:'var(--text-3)',marginBottom:6,textTransform:'uppercase'}}>Execution Plan</div>
                        <div className="ps">{r.hedge.execution_plan.map((s,j)=>(
                          <div className="ps-s" key={j}><span className="ps-a">{s.action}</span>{s.amount&&` — ${s.amount}`}{s.venue&&<span style={{color:'var(--text-3)'}}> via {s.venue}</span>}{s.reason&&<div style={{fontSize:10,color:'var(--text-3)',marginTop:1}}>{s.reason}</div>}</div>
                        ))}</div>
                      </div>)}
                      {r.attestation?.tx_hash!=='0x'+'0'.repeat(64) && r.attestation && (
                        <a href={r.attestation.explorer_url} target="_blank" rel="noopener" className="tx-link"><CheckCircle size={11}/> Verified on Kite Chain <ExternalLink size={10}/></a>
                      )}
                      {r.hedge?.action!=='HOLD' && r.hedge && (
                        <div style={{marginTop:8,padding:'8px 12px',background:'var(--bg-elevated)',borderRadius:7,fontSize:11,borderLeft:'3px solid var(--green)'}}>
                          <span style={{color:'var(--green)',fontWeight:700}}>HEDGE EXECUTED</span> — {r.hedge.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Volume Anomalies */}
          {anomalies.length>0 && (
            <div className="sec fade">
              <div className="sh"><h2><Flame size={16} color="var(--red)"/> Volume Anomalies <span className="cnt">{anomalies.length}</span></h2></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Volume 24h</th><th>Vol/MCap</th><th>Change 24h</th><th>Severity</th><th>Signal</th></tr></thead><tbody>
                {anomalies.slice(0,10).map((a,i)=>(
                  <tr key={i}><td style={{fontWeight:600}}>{a.symbol}</td><td>{fmt(a.volume_24h)}</td><td style={{fontWeight:600,color:'var(--yellow)'}}>{a.volume_to_mcap}%</td><td style={{color:pc(a.change_24h)}}>{a.change_24h>0?'+':''}{a.change_24h}%</td><td><span className={`rsk ${a.severity==='CRITICAL'?'r-c':a.severity==='HIGH'?'r-h':'r-m'}`}>{a.severity}</span></td><td style={{fontSize:11,color:'var(--text-3)'}}>{a.signal}</td></tr>
                ))}
              </tbody></table></div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MARKET INTELLIGENCE ═══ */}
      {tab==='market' && (
        <div className="fade">
          {/* Sector heatmap */}
          {Object.keys(sectors).length>0 && (
            <div className="sec">
              <div className="sh"><h2><Layers size={16} color="var(--purple)"/> Sector Performance</h2></div>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:14}}>
                <span className={`spill ${!sectorFilter?'on':''}`} onClick={()=>setSectorFilter(null)}>All</span>
                {Object.entries(sectors).map(([s,d])=>(
                  <span key={s} className={`spill ${sectorFilter===s?'on':''}`} onClick={()=>setSectorFilter(sectorFilter===s?null:s)}>
                    <span className="dot" style={{background:SECTOR_COLORS[s]||'#64748b'}}/> {s} ({d.count})
                    <span style={{color:pc(d.avg_change_24h),marginLeft:4}}>{d.avg_change_24h>0?'+':''}{d.avg_change_24h}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Token Search */}
          <div className="srch">
            <Search size={14}/>
            <input placeholder={`Search ${topTokens.length}+ tokens by name or symbol...`} value={tokenSearch} onChange={e=>setTokenSearch(e.target.value)}/>
          </div>

          {/* Full Market Table */}
          <div className="sec">
            <div className="sh"><h2><Globe size={16} color="var(--cyan)"/> Market Data <span className="cnt">{filteredTokens.length} tokens</span></h2></div>
            <div className="tw"><table><thead><tr>
              <th>#</th><th>Token</th><th>Price</th><th>24h</th><th>7d</th><th>30d</th><th>Market Cap</th><th>Volume 24h</th><th>Sector</th>
            </tr></thead><tbody>
              {filteredTokens.slice(0,100).map((t,i)=>(
                <tr key={i}>
                  <td style={{color:'var(--text-3)',fontSize:11}}>{t.rank}</td>
                  <td><div className="tc">
                    <div className="ti">{t.image?<img src={t.image} alt=""/>:t.symbol?.slice(0,2)}</div>
                    <div><div className="tn">{t.symbol}</div><div className="ts">{t.name}</div></div>
                  </div></td>
                  <td style={{fontWeight:600}}>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td>
                  <td style={{color:pc(t.change_24h),fontWeight:600}}>{t.change_24h>0?'+':''}{t.change_24h}%</td>
                  <td style={{color:pc(t.change_7d)}}>{t.change_7d>0?'+':''}{t.change_7d}%</td>
                  <td style={{color:pc(t.change_30d)}}>{t.change_30d>0?'+':''}{t.change_30d}%</td>
                  <td>{fmt(t.market_cap)}</td>
                  <td>{fmt(t.volume_24h)}</td>
                  <td><span className="spill" style={{cursor:'default',borderColor:SECTOR_COLORS[t.sector]||'var(--border)'}}>
                    <span className="dot" style={{background:SECTOR_COLORS[t.sector]||'#64748b'}}/>{t.sector}
                  </span></td>
                </tr>
              ))}
            </tbody></table></div>
          </div>

          {/* Top Movers */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
            <div className="sec">
              <div className="sh"><h2><TrendingUp size={16} color="var(--green)"/> Top Gainers</h2></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Price</th><th>24h</th></tr></thead><tbody>
                {(market?.top_gainers||[]).map((t,i)=>(
                  <tr key={i}><td style={{fontWeight:600}}>{t.symbol}</td><td>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td><td style={{color:'var(--green)',fontWeight:700}}>+{t.change_24h}%</td></tr>
                ))}
              </tbody></table></div>
            </div>
            <div className="sec">
              <div className="sh"><h2><TrendingDown size={16} color="var(--red)"/> Top Losers</h2></div>
              <div className="tw"><table><thead><tr><th>Token</th><th>Price</th><th>24h</th></tr></thead><tbody>
                {(market?.top_losers||[]).map((t,i)=>(
                  <tr key={i}><td style={{fontWeight:600}}>{t.symbol}</td><td>${t.price>=1?t.price?.toFixed(2):t.price?.toFixed(4)}</td><td style={{color:'var(--red)',fontWeight:700}}>{t.change_24h}%</td></tr>
                ))}
              </tbody></table></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BACKTEST ═══ */}
      {tab==='backtest' && (
        <div className="fade">
          <div className="sec">
            <div className="sh">
              <h2><BarChart3 size={16} color="var(--accent)"/> Historical Backtesting</h2>
              <button className="btn btn-g" onClick={runBT}><RefreshCw size={13}/> Run Full Backtest</button>
            </div>
            {backtest?.headline?(
              <div className="crd" style={{borderColor:'var(--accent)',background:'var(--glow)',cursor:'default',marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{backtest.headline}</div>
                <div style={{display:'flex',gap:20,fontSize:12,color:'var(--text-2)'}}>
                  <span>Win Rate: <strong style={{color:'var(--green)'}}>{backtest.win_rate}</strong></span>
                  <span>Period: <strong>{backtest.period}</strong></span>
                  <span>Avg: <strong style={{color:'var(--green)'}}>{backtest.avg_savings}</strong></span>
                </div>
                {backtest.worst_avoided&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>Best save: {backtest.worst_avoided}</div>}
              </div>
            ):(
              <div className="empty"><BarChart3 size={32} color="var(--text-3)"/><p>Click "Run Full Backtest" to simulate on 13 real historical events</p></div>
            )}
            {backtest?.total_events_analyzed>0&&(<>
              <div className="btg">
                <div className="bts"><div className="bv" style={{color:'var(--green)'}}>{fmt(backtest.total_savings)}</div><div className="bl">Total Saved</div></div>
                <div className="bts"><div className="bv">{backtest.win_rate}%</div><div className="bl">Win Rate</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--red)'}}>{fmt(backtest.total_loss_without_shield)}</div><div className="bl">Loss Without</div></div>
                <div className="bts"><div className="bv" style={{color:'var(--yellow)'}}>{fmt(backtest.total_loss_with_shield)}</div><div className="bl">Loss With</div></div>
              </div>
              {backtest.per_token&&<div className="tw" style={{marginBottom:14}}><table><thead><tr><th>Token</th><th>Events</th><th>Avg Impact</th><th>Worst</th><th>Savings</th></tr></thead><tbody>
                {Object.entries(backtest.per_token).map(([t,d])=>(
                  <tr key={t}><td style={{fontWeight:700}}>{t}</td><td>{d.events}</td><td style={{color:'var(--red)'}}>{d.avg_impact}%</td><td style={{color:'var(--red)',fontWeight:600}}>{d.worst_impact}%</td><td style={{color:'var(--green)',fontWeight:600}}>{fmt(d.savings)}</td></tr>
                ))}
              </tbody></table></div>}
              {backtest.detailed_results&&<div className="tw"><table><thead><tr><th>Token</th><th>Date</th><th>Supply</th><th>Impact</th><th>Strategy</th><th>Without</th><th>With</th><th>Saved</th></tr></thead><tbody>
                {backtest.detailed_results.map((r,i)=>(
                  <tr key={i}><td style={{fontWeight:600}}>{r.token}</td><td style={{fontSize:11}}>{r.date}</td><td>{r.pct_supply}%</td><td style={{color:'var(--red)',fontWeight:600}}>{r.actual_impact}%</td><td><span className={`str ${sc(r.strategy_chosen)}`}>{r.strategy_chosen?.replace('_',' ')}</span></td><td style={{color:'var(--red)'}}>{fmt(r.loss_without_shield)}</td><td style={{color:'var(--yellow)'}}>{fmt(r.loss_with_shield)}</td><td style={{color:'var(--green)',fontWeight:700}}>{fmt(r.savings)} <span style={{fontSize:9}}>({r.savings_pct}%)</span></td></tr>
                ))}
              </tbody></table></div>}
            </>)}
          </div>
        </div>
      )}

      {/* ═══ PORTFOLIO ═══ */}
      {tab==='portfolio' && (
        <div className="fade">
          <div className="sec">
            <div className="sh"><h2><PieChart size={16} color="var(--purple)"/> Portfolio Holdings</h2></div>
            {portfolio?.holdings?(
              <div className="tw"><table><thead><tr><th>Token</th><th>Holdings</th><th>Price</th><th>Value</th><th>Unlock Risk</th></tr></thead><tbody>
                {portfolio.holdings.map((h,i)=>{
                  const has=unlocks.some(u=>u.token_symbol===h.token_symbol)
                  return(<tr key={i}>
                    <td><div className="tc"><div className="ti" style={{color:'var(--accent)',background:'var(--bg-elevated)'}}>{h.token_symbol?.slice(0,2)}</div><span className="tn">{h.token_symbol}</span></div></td>
                    <td>{h.amount?.toLocaleString()}</td><td>${h.current_price?.toFixed(4)}</td>
                    <td style={{fontWeight:600,color:'var(--green)'}}>{fmt(h.value_usd)}</td>
                    <td>{has?<span className="rsk r-h" style={{fontSize:9}}><AlertTriangle size={9}/> UNLOCK</span>:<span style={{fontSize:10,color:'var(--text-3)'}}>Safe</span>}</td>
                  </tr>)
                })}
              </tbody></table></div>
            ):(
              <div className="empty"><Wallet size={32} color="var(--text-3)"/><p>Start backend to see live holdings</p></div>
            )}
          </div>
          {/* Architecture */}
          <div className="sec">
            <div className="sh"><h2><Cpu size={16} color="var(--cyan)"/> Agent Architecture</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[
                {i:<Eye size={18}/>,t:'Monitor',d:'300+ tokens tracked via CoinGecko, 40+ unlock events from Tokenomist',c:'var(--yellow)'},
                {i:<Cpu size={18}/>,t:'Analyze',d:'Claude Sonnet 4 with 5-factor model: supply shock, history, recipients, regime, urgency',c:'var(--purple)'},
                {i:<Shield size={18}/>,t:'Protect',d:'6 hedge strategies from FULL_EXIT to OPTIONS_PUT with execution plans',c:'var(--green)'},
                {i:<Database size={18}/>,t:'Attest',d:'Every prediction + hedge recorded immutably on Kite AI blockchain',c:'var(--accent)'},
                {i:<BarChart3 size={18}/>,t:'Backtest',d:'Validated on 13 real events from 2024-25. Proven savings across 6 tokens.',c:'var(--cyan)'},
                {i:<Globe size={18}/>,t:'Intelligence',d:'Market regime, Fear & Greed, DeFiLlama TVL, volume anomalies, sector analysis',c:'var(--red)'},
              ].map((c,i)=>(
                <div className="crd" key={i} style={{textAlign:'center',padding:18,cursor:'default'}}>
                  <div style={{color:c.c,marginBottom:6,display:'flex',justifyContent:'center'}}>{c.i}</div>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{c.t}</div>
                  <div style={{fontSize:11,color:'var(--text-3)',lineHeight:1.5}}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ KITE ECOSYSTEM ═══ */}
      {tab==='kite' && (
        <div className="fade">
          {/* AA Wallet Status */}
          <div className="sec">
            <div className="sh"><h2><Wallet size={16} color="var(--accent)"/> Agent Smart Wallet (ERC-4337)</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--accent)'}}>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Wallet Address</div>
                <div style={{fontSize:12,fontWeight:600,fontFamily:'monospace',wordBreak:'break-all'}}>
                  {walletData?.wallet?.address||'Not Configured'}
                </div>
                <div style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>{walletData?.wallet?.type||'Kite AA Smart Wallet'}</div>
              </div>
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--green)'}}>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Total Balance</div>
                <div style={{fontSize:22,fontWeight:700,color:'var(--green)'}}>
                  {fmt(walletData?.balances?.total_usd||0)}
                </div>
                <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>
                  Settlement: {fmt(walletData?.balances?.settlement_token||0)} • L-USDC: {fmt(walletData?.balances?.lusdc_yield_bearing||0)}
                </div>
              </div>
              <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--yellow)'}}>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Daily Spend Limit</div>
                <div style={{fontSize:22,fontWeight:700,color:'var(--yellow)'}}>
                  {fmt(walletData?.spending_rules?.remaining_today_usd||50000)}
                </div>
                <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>
                  of {fmt(walletData?.spending_rules?.daily_limit_usd||50000)} remaining
                </div>
              </div>
            </div>

            {/* Spending Rules */}
            <div className="tw" style={{marginBottom:14}}>
              <table><thead><tr><th>Rule</th><th>Value</th><th>Status</th></tr></thead><tbody>
                <tr><td style={{fontWeight:600}}>Daily Spend Limit</td><td>{fmt(walletData?.spending_rules?.daily_limit_usd||50000)}</td><td><span className="rsk r-l">Active</span></td></tr>
                <tr><td style={{fontWeight:600}}>Max Single Trade</td><td>{fmt(walletData?.spending_rules?.max_single_trade_usd||25000)}</td><td><span className="rsk r-l">Active</span></td></tr>
                <tr><td style={{fontWeight:600}}>Attestation Required</td><td>Every hedge attested on-chain</td><td><span className="rsk r-l">Enforced</span></td></tr>
                <tr><td style={{fontWeight:600}}>Auto-Yield on Idle</td><td>Idle USDC → L-USDC (4% APY)</td><td><span className="rsk r-l">{walletData?.spending_rules?.auto_yield_on_idle?'On':'Off'}</span></td></tr>
                <tr><td style={{fontWeight:600}}>Gasless Transactions</td><td>ERC-4337 via Kite Bundler</td><td><span className="rsk r-l">Enabled</span></td></tr>
              </tbody></table>
            </div>
          </div>

          {/* L-USDC Yield */}
          <div className="sec">
            <div className="sh"><h2><TrendingUp size={16} color="var(--green)"/> L-USDC Yield (Lucid Protocol)</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
              <div className="bts" style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:11}}>
                <div className="bv" style={{color:'var(--green)'}}>{yieldData?.apy||'4.0%'}</div>
                <div className="bl">APY</div>
              </div>
              <div className="bts" style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:11}}>
                <div className="bv">{fmt(yieldData?.balance||0)}</div>
                <div className="bl">L-USDC Balance</div>
              </div>
              <div className="bts" style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:11}}>
                <div className="bv" style={{color:'var(--green)'}}>+${yieldData?.yield_daily?.toFixed(2)||'0.00'}/d</div>
                <div className="bl">Daily Yield</div>
              </div>
              <div className="bts" style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:11}}>
                <div className="bv" style={{color:'var(--green)'}}>{fmt(yieldData?.yield_annual||0)}</div>
                <div className="bl">Annual Yield</div>
              </div>
            </div>
            <div className="crd" style={{cursor:'default',background:'var(--bg-elevated)',borderLeft:'3px solid var(--green)'}}>
              <div style={{fontSize:12,lineHeight:1.7,color:'var(--text-2)'}}>
                <strong style={{color:'var(--text)'}}>How it works:</strong> {yieldData?.strategy||'Idle hedged USDC is automatically converted to L-USDC to earn yield. When a hedge needs execution, L-USDC is redeemed back to USDC. The 10% withdrawal buffer ensures instant liquidity for urgent hedges.'}
              </div>
              <div style={{display:'flex',gap:16,marginTop:8,fontSize:10,color:'var(--text-3)'}}>
                <span>Backing: <strong>Aave v3</strong></span>
                <span>Bridge: <strong>LayerZero v2</strong></span>
                <span>Buffer: <strong>10% instant</strong></span>
                <span>Token: <a href={`https://testnet.kitescan.ai/address/${yieldData?.address||'0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e'}`} target="_blank" rel="noopener" style={{color:'var(--accent)'}}>View on KiteScan</a></span>
              </div>
            </div>
          </div>

          {/* Vault */}
          <div className="sec">
            <div className="sh"><h2><Shield size={16} color="var(--purple)"/> ClientAgent Vault</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="crd" style={{cursor:'default'}}>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',marginBottom:6}}>Vault Status</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span className={`rsk ${walletData?.vault?.status==='active'?'r-l':'r-m'}`}>{walletData?.vault?.status==='active'?'Active':'Not Deployed'}</span>
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'monospace',wordBreak:'break-all'}}>
                  Impl: {walletData?.vault?.implementation||'0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23'}
                </div>
              </div>
              <div className="crd" style={{cursor:'default'}}>
                <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',marginBottom:6}}>Infrastructure</div>
                <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.8}}>
                  <div>Bundler: <span style={{fontFamily:'monospace',fontSize:10,color:'var(--text-3)'}}>bundler-service.staging.gokite.ai</span></div>
                  <div>Settlement: <span style={{fontFamily:'monospace',fontSize:10,color:'var(--text-3)'}}>0x8d9F...ec3</span></div>
                  <div>Chain: <span style={{color:'var(--cyan)'}}>Kite AI Testnet (2368)</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Goldsky Subgraph */}
          <div className="sec">
            <div className="sh"><h2><Database size={16} color="var(--cyan)"/> Goldsky Subgraph Indexer</h2></div>
            <div className="crd" style={{cursor:'default',borderLeft:'3px solid var(--cyan)'}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Real-Time Attestation Indexing</div>
              <div style={{fontSize:12,color:'var(--text-2)',lineHeight:1.6,marginBottom:10}}>
                Every prediction, hedge action, and outcome is indexed by Goldsky's subgraph infrastructure on Kite AI Testnet.
                Query via GraphQL for instant access to the agent's full on-chain history.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
                {[
                  {l:'Predictions',d:'Token unlock risk assessments with risk scores and reasoning',ic:<Target size={14}/>},
                  {l:'Hedge Actions',d:'Strategy execution records with amounts and venues',ic:<Shield size={14}/>},
                  {l:'Outcomes',d:'Actual vs predicted impact with accuracy tracking',ic:<CheckCircle size={14}/>},
                ].map((c,i)=>(
                  <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,padding:10}}>
                    <div style={{color:'var(--cyan)',marginBottom:4}}>{c.ic}</div>
                    <div style={{fontSize:12,fontWeight:600,marginBottom:2}}>{c.l}</div>
                    <div style={{fontSize:10,color:'var(--text-3)',lineHeight:1.4}}>{c.d}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'var(--bg)',borderRadius:6,padding:10,fontSize:11,fontFamily:'monospace',color:'var(--text-3)',overflowX:'auto'}}>
                <div style={{color:'var(--text-2)',marginBottom:4}}>{'// Example GraphQL Query'}</div>
                {'{ predictions(first: 10, orderBy: createdAt, orderDirection: desc) {'}<br/>
                {'    tokenSymbol riskScore predictedPriceImpact outcomeRecorded'}<br/>
                {'    hedgeActions { actionType details }'}<br/>
                {'} }'}
              </div>
            </div>
          </div>

          {/* Kite Integration Overview */}
          <div className="sec">
            <div className="sh"><h2><Zap size={16} color="var(--yellow)"/> Full Kite Stack Integration</h2></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {[
                {t:'Account Abstraction (ERC-4337)',d:'Smart wallet with spending rules, daily limits, gasless tx via Kite bundler. Agent operates autonomously within programmable constraints.',c:'var(--accent)',s:'Active'},
                {t:'L-USDC Yield (Lucid Protocol)',d:'Idle hedged funds earn 4% APY via Aave v3 backing. Bridge-agnostic via LayerZero v2. 10% instant withdrawal buffer.',c:'var(--green)',s:'Active'},
                {t:'On-Chain Attestation',d:'Every prediction and hedge is recorded immutably on Kite blockchain. Reputation score tracks prediction accuracy over time.',c:'var(--purple)',s:'Active'},
                {t:'Goldsky Subgraph Indexing',d:'Real-time GraphQL API indexes all attestation events. Enables dashboards, analytics, and third-party integrations.',c:'var(--cyan)',s:'Active'},
                {t:'Settlement Contract',d:'All hedge payments flow through Kite Settlement Contract with full audit trail. Transparent fee structure.',c:'var(--yellow)',s:'Active'},
                {t:'LayerZero v2 Bridge',d:'Cross-chain L-USDC bridging via LayerZero endpoint on Kite. Enables multi-chain hedge execution.',c:'var(--red)',s:'Configured'},
              ].map((c,i)=>(
                <div className="crd" key={i} style={{cursor:'default',borderLeft:`3px solid ${c.c}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <div style={{fontWeight:700,fontSize:13}}>{c.t}</div>
                    <span className="rsk r-l" style={{fontSize:9}}>{c.s}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--text-3)',lineHeight:1.5}}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{textAlign:'center',padding:'24px 0 12px',borderTop:'1px solid var(--border)',marginTop:16,fontSize:11,color:'var(--text-3)'}}>
        <div style={{marginBottom:4}}><strong style={{color:'var(--text-2)'}}>UnlockShield</strong> — Autonomous AI Agent for Token Unlock Hedging</div>
        <div>
          Built on <a href="https://gokite.ai" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>Kite AI</a> for the Global Hackathon 2026 •{' '}
          <a href="https://testnet.kitescan.ai" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>KiteScan</a> •{' '}
          <a href="https://github.com/Rajatd91/unlockshield" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>GitHub</a>
        </div>
      </div>
    </div></>
  )
}

export default App
