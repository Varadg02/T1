import React, { useState, useEffect, useRef } from 'react';
import TradingViewChart from './components/TradingViewChart';
import {
  TrendingUp, TrendingDown, Activity, Zap, Play, Pause, RotateCcw,
  ShieldAlert, Brain, Newspaper, BarChart2, Wallet, AlertTriangle,
  ChevronUp, ChevronDown, Settings, Bell, Search, X, Send,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Cpu, Layers, MessageSquare,
  Target, PieChart, Clock, Eye, EyeOff, Flame, Sparkles, ShieldCheck, Crosshair, RefreshCw, Link, Server, Key, Eye as EyeIcon, DollarSign, Sliders
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────── */
const fmt  = (n, d=2) => Number(n).toFixed(d);
const clsx = (...cls) => cls.filter(Boolean).join(' ');

/* ─── Sparkline (inline SVG) ──────────────────────────── */
function Spark({ data=[], color='#00ffd5', height=36, filled=true }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const W = 120, H = height;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*W},${H - ((v-min)/range)*H}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height}} preserveAspectRatio="none">
      {filled && (
        <polygon points={`0,${H} ${pts} ${W},${H}`}
          fill={color} opacity={0.18}/>
      )}
      <polyline fill="none" stroke={color} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" points={pts}/>
    </svg>
  );
}

/* ─── Main App ─────────────────────────────────────────── */
export default function App() {
  const [state, setState]           = useState(null);
  const [sym, setSym]               = useState('BTC');
  const [autoSync, setAutoSync]     = useState(false);
  const [view, setView]             = useState('chart'); // chart|agents|news|evolution|broker
  const [tf, setTf]                 = useState('15m');
  const [showTrade, setShowTrade]   = useState(null);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [tradeAmt, setTradeAmt]     = useState('1.50');
  const [toast, setToast]           = useState(null);
  const priceHistRef                = useRef({});

  // Broker Form State
  const [brokerMode, setBrokerMode]       = useState('PAPER');
  const [brokerType, setBrokerType]       = useState('XM_METAAPI');
  const [metaApiToken, setMetaApiToken]   = useState('');
  const [metaAccountId, setMetaAccountId] = useState('');
  const [webhookUrl, setWebhookUrl]       = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Wallet Customization State
  const [customStartCapital, setCustomStartCapital] = useState('5.00');
  const [customTradeAlloc, setCustomTradeAlloc]     = useState('1.50');

  /* ── fetch state every 2s ── */
  const load = async () => {
    try { 
      const r = await fetch('/api/state'); 
      if(r.ok) {
        const data = await r.json();
        setState(data);
      }
    } catch{}
  };
  useEffect(()=>{ load(); const t=setInterval(load,2000); return()=>clearInterval(t); },[]);

  /* ── Sync Broker Form state when modal opens ── */
  const openBrokerModal = () => {
    if (state?.brokerStatus) {
      setBrokerMode(state.brokerStatus.mode || 'PAPER');
      setBrokerType(state.brokerStatus.brokerType || 'XM_METAAPI');
      if (state.brokerStatus.config) {
        setMetaApiToken(state.brokerStatus.config.metaApiToken || '');
        setMetaAccountId(state.brokerStatus.config.metaAccountId || '');
        setWebhookUrl(state.brokerStatus.config.webhookUrl || '');
        setWebhookSecret(state.brokerStatus.config.webhookSecret || '');
      }
    }
    setShowBrokerModal(true);
  };

  /* ── Sync Wallet Form state when modal opens ── */
  const openWalletModal = () => {
    if (state?.portfolio) {
      setCustomStartCapital(String(state.portfolio.initialBalance || 5.00));
      setCustomTradeAlloc(String(state.portfolio.defaultAllocationUSD || 1.50));
    }
    setShowWalletModal(true);
  };

  /* ── Auto-sync chart symbol with AI target if enabled ── */
  useEffect(()=>{
    if (autoSync && state?.currentTargetSymbol && state.currentTargetSymbol !== sym) {
      setSym(state.currentTargetSymbol);
    }
  }, [state?.currentTargetSymbol, autoSync]);

  /* ── build price history for sparklines ── */
  useEffect(()=>{
    if(!state?.marketPrices) return;
    Object.keys(state.marketPrices).forEach(s=>{
      const p = state.marketPrices[s].price;
      if(!priceHistRef.current[s]) priceHistRef.current[s]=[];
      const arr = priceHistRef.current[s];
      if(!arr.length || arr[arr.length-1]!==p) {
        arr.push(p);
        if(arr.length>80) arr.shift();
      }
    });
  },[state?.marketPrices]);

  const msg = (m,d=3500)=>{ setToast(m); setTimeout(()=>setToast(null),d); };

  const api = async(path,body={})=>{
    try{ await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); load(); }
    catch{}
  };

  const saveBrokerConfig = async () => {
    await api('/api/broker-mode', {
      mode: brokerMode,
      brokerType,
      metaApiToken,
      metaAccountId,
      webhookUrl,
      webhookSecret,
    });
    setShowBrokerModal(false);
    msg(`✅ Broker Settings Saved (${brokerMode} Mode)`);
  };

  const saveWalletConfig = async () => {
    await api('/api/wallet-config', {
      startingBalance: parseFloat(customStartCapital || 5.00),
      tradeAllocationUSD: parseFloat(customTradeAlloc || 1.50),
    });
    setShowWalletModal(false);
    msg(`💰 Starting Capital Set to $${parseFloat(customStartCapital||5).toFixed(2)} USD`);
  };

  const toggleExecutionMode = async () => {
    const nextMode = state?.executionMode === 'AGGRESSIVE' ? 'STANDARD' : 'AGGRESSIVE';
    await api('/api/execution-mode', {
      mode: nextMode,
      focusBtcXau: state?.focusAssetsOnly ?? true,
    });
    msg(`⚡ Execution Mode Switched to ${nextMode} (${nextMode==='AGGRESSIVE'?'50% Confidence Threshold':'65% Confidence Threshold'})`);
  };

  if(!state) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-dark)'}}>
      <div style={{textAlign:'center',padding:32}} className="panel glow-card">
        <Cpu size={38} style={{color:'var(--cyan)',animation:'neonPulse 1.5s ease-in-out infinite',display:'block',margin:'0 auto 16px'}}/>
        <div style={{fontWeight:800,fontSize:16,letterSpacing:'0.05em'}}>INITIALIZING ALPHA-TRADER COUNCIL</div>
        <div style={{color:'var(--text-secondary)',fontSize:12,marginTop:8}}>Loading 10 AI agents, survival instinct & risk management modules…</div>
      </div>
    </div>
  );

  const prices        = state.marketPrices||{};
  const port          = state.portfolio||{};
  const P             = prices[sym]||{price:0,change24h:0,high:0,low:0,rsi:50};
  const isUp          = P.change24h>=0;
  const SYMS          = ['BTC','XAU','ETH','NVDA','AAPL','TSLA','SPY'];
  const debate        = state.latestDebate||null;
  const agents        = state.agents||[];
  const news          = state.latestNews||[];
  const strat         = state.activeStrategy||{};
  const targetSym     = state.currentTargetSymbol || 'BTC';
  const nextSym       = state.nextTargetSymbol || 'XAU';
  const planned       = state.plannedTrade || null;
  const broker        = state.brokerStatus || { mode: 'PAPER' };

  const sessionColor = (s) => ({
    'OPEN':        'var(--green)',
    'PRE-MARKET':  'var(--gold)',
    'AFTER-HOURS': 'var(--gold)',
    'CLOSED':      'var(--red)',
    'WEEKEND':     'var(--red)',
    'DAILY BREAK': 'var(--gold)',
  })[s] || 'var(--text-tertiary)';

  /* sparkline arrays for watchlist */
  const sparkOf = s => (priceHistRef.current[s]||[]).slice(-20);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',background:'var(--bg-dark)'}}>

      {/* ══════════════════════ TOP BAR ══════════════════════ */}
      <div style={{
        display:'flex',alignItems:'center',gap:0,
        background:'var(--bg-surface)',borderBottom:'1px solid var(--border)',
        height:48, flexShrink:0, padding:'0 16px', zIndex:100,
        backdropFilter:'blur(12px)'
      }}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:10,paddingRight:20,borderRight:'1px solid var(--border)'}}>
          <div style={{
            width:30,height:30,borderRadius:8,
            background:'linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 0 15px rgba(0, 242, 254, 0.4)'
          }}>
            <Sparkles size={16} color="#000"/>
          </div>
          <span style={{fontWeight:900,fontSize:14,letterSpacing:'-0.02em'}}>ALPHA<span style={{color:'var(--cyan)'}}>TRADER</span> <span style={{fontSize:10,color:'var(--text-tertiary)',fontStyle:'italic',fontWeight:600}}>AI PRO</span></span>
        </div>

        {/* Ticker marquee */}
        <div style={{flex:1,overflow:'hidden',padding:'0 16px',cursor:'default'}}>
          <div className="ticker-inner" style={{gap:0}}>
            {[...SYMS,...SYMS,...SYMS].map((s,i)=>{
              const px=prices[s]||{};
              const up=(px.change24h||0)>=0;
              const isTarget = s === targetSym;
              return (
                <div key={i} onClick={()=>setSym(s)} style={{
                  display:'flex',alignItems:'center',gap:8,
                  padding:'0 16px',cursor:'pointer',
                  borderRight:'1px solid var(--border)',
                  transition:'all 0.2s ease',
                  background: isTarget && i < SYMS.length ? 'rgba(0, 242, 254, 0.15)' : s===sym&&i<SYMS.length?'rgba(255, 255, 255, 0.05)':'transparent',
                  opacity: (prices[s]?.tradeable===false&&i<SYMS.length) ? 0.6 : 1,
                }}>
                  {isTarget && i < SYMS.length && (
                    <span className="tag tag-blue" style={{fontSize:8,padding:'1px 4px'}}>🎯 TARGET</span>
                  )}
                  <span style={{fontWeight:800,fontSize:11,color:'var(--text-primary)',fontFamily:'var(--font-mono)'}}>{s}</span>
                  <span style={{fontWeight:700,fontSize:11,fontFamily:'var(--font-mono)'}}>${px.price?.toLocaleString()||'—'}</span>
                  <span style={{fontSize:10,fontWeight:800,color:up?'var(--green)':'var(--red)',fontFamily:'var(--font-mono)'}}>
                    {up?'+':''}{px.change24h?.toFixed(2)||'0.00'}%
                  </span>
                  {i<SYMS.length && (
                    <span style={{width:6,height:6,borderRadius:'50%',background:sessionColor(px.session),flexShrink:0,boxShadow:`0 0 6px ${sessionColor(px.session)}`}}/>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls Header */}
        <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:16,borderLeft:'1px solid var(--border)'}}>
          {/* Custom Wallet Button */}
          <button className="btn btn-ghost" style={{padding:'5px 10px',fontSize:11}}
            onClick={openWalletModal}
            title="Configure Agent Wallet & Capital Start Amount">
            <DollarSign size={13} style={{color:'var(--green)'}}/> WALLET: ${fmt(port.totalEquity||5,2)}
          </button>

          {/* Real Broker Connection Toggle */}
          <button className={clsx('btn', broker.mode === 'LIVE_BROKER' ? 'btn-red' : 'btn-ghost')}
            style={{padding:'5px 10px',fontSize:11}}
            onClick={openBrokerModal}
            title="Configure Real XM Broker / MT4 / MT5 / Webhooks">
            <Link size={13}/> {broker.mode === 'LIVE_BROKER' ? '🔴 LIVE XM BROKER' : '📄 PAPER MODE'}
          </button>

          {/* Aggressive vs Standard Mode */}
          <button className="btn btn-ghost" style={{padding:'5px 10px',fontSize:11}}
            onClick={toggleExecutionMode}
            title="Toggle execution speed & confidence sensitivity">
            <Zap size={13} style={{color: state.executionMode === 'AGGRESSIVE' ? 'var(--green)' : 'var(--gold)'}}/>
            {state.executionMode === 'AGGRESSIVE' ? '⚡ AGGRESSIVE' : '🛡️ STANDARD'}
          </button>

          {/* Auto-Sync Toggle */}
          <button className={clsx('btn', autoSync ? 'btn-ghost active' : 'btn-ghost')}
            style={{padding:'5px 10px',fontSize:11}}
            onClick={()=>{ setAutoSync(!autoSync); msg(autoSync ? 'Auto-Sync Disabled' : `Auto-Sync Enabled — Tracking ${targetSym}`); }}
            title="Auto-follow the chart AI Council is evaluating">
            <Crosshair size={13} style={{color: autoSync ? 'var(--cyan)' : 'var(--text-tertiary)'}}/> AUTO-SYNC {autoSync ? 'ON' : 'OFF'}
          </button>

          <button className={clsx('btn',state.autoPilotActive?'btn-red':'btn-green')}
            style={{padding:'5px 12px',fontSize:11}}
            onClick={()=>api('/api/autopilot',{active:!state.autoPilotActive}).then(()=>msg(state.autoPilotActive?'Auto-pilot Paused':'Auto-pilot Activated'))}>
            {state.autoPilotActive?<><Pause size={12}/> PAUSE</>:<><Play size={12}/> AUTO-PILOT</>}
          </button>
        </div>
      </div>

      {/* ══════════════════════ BODY ══════════════════════ */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* ── LEFT SIDEBAR: Watchlist & Primary BTC/XAU Focus ── */}
        <div style={{
          width:230,flexShrink:0,
          background:'var(--bg-surface)',
          borderRight:'1px solid var(--border)',
          display:'flex',flexDirection:'column',
          overflow:'hidden'
        }}>
          {/* Portfolio Summary Card */}
          <div style={{padding:'14px',borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={openWalletModal} title="Click to customize starting capital & allocation">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                {broker.mode === 'LIVE_BROKER' ? 'REAL BROKER ACCOUNT' : 'PAPER LEDGER'}
              </span>
              <Sliders size={12} style={{color:'var(--cyan)'}}/>
            </div>
            <div style={{fontSize:24,fontWeight:900,color:'var(--text-primary)',fontFamily:'var(--font-mono)',lineHeight:1,letterSpacing:'-0.02em'}}>
              ${fmt(port.totalEquity||5,2)}
            </div>
            <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6}}>
              <span className={`tag ${(port.totalRoiPct||0)>=0?'tag-green':'tag-red'}`}>
                {(port.totalRoiPct||0)>=0?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
                {(port.totalRoiPct||0)>=0?'+':''}{fmt(port.totalRoiPct||0)}% ROI
              </span>
              <span style={{fontSize:10,color:'var(--text-tertiary)'}}>
                vs ${fmt(port.initialBalance||5,2)} start
              </span>
            </div>
            <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                {l:'Cash',v:`$${fmt(port.cashBalance||5,2)}`},
                {l:'Win Rate',v:`${fmt(port.winRatePct||0,0)}%`},
                {l:'Trades',v:`${port.totalTradesCount||0}`},
                {l:'Positions',v:`${(port.positions||[]).length}`},
              ].map(x=>(
                <div key={x.l} style={{background:'var(--bg-elevated)',borderRadius:6,padding:'6px 8px',border:'1px solid var(--border)'}}>
                  <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>{x.l}</div>
                  <div style={{fontSize:12,fontWeight:800,fontFamily:'var(--font-mono)',marginTop:2,color:'var(--text-primary)'}}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Manual Trade Buttons */}
          <div style={{padding:'10px',borderBottom:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <button className="btn btn-green" style={{justifyContent:'center',padding:'9px 0',fontSize:12,fontWeight:800}}
              onClick={()=>setShowTrade('BUY')}>
              <ArrowUpRight size={14}/> BUY
            </button>
            <button className="btn btn-red" style={{justifyContent:'center',padding:'9px 0',fontSize:12,fontWeight:800}}
              onClick={()=>setShowTrade('SELL')}>
              <ArrowDownRight size={14}/> SELL
            </button>
          </div>

          {/* Survival Instinct Status Badge */}
          <div style={{padding:'8px 12px',background:'rgba(0, 242, 254, 0.06)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:10,fontWeight:800,color:'var(--cyan)'}}>👁️ SURVIVAL INSTINCT</span>
            <span className="tag tag-blue" style={{fontSize:9,fontWeight:800}}>
              {debate?.survivalIndex || 95}% INDEX
            </span>
          </div>

          {/* Asset Focus Notification */}
          <div style={{padding:'6px 12px',background:'rgba(255, 183, 3, 0.05)',borderBottom:'1px solid var(--border)',fontSize:10,color:'var(--gold)',fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
            <Flame size={12}/> PRIMARY FOCUS: BTC & XAUUSD
          </div>

          {/* Watchlist Header */}
          <div style={{padding:'8px 12px 6px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-tertiary)'}}>MARKET ASSETS</span>
            <span style={{fontSize:10,color:'var(--cyan)',fontWeight:700}}>7 Pairs</span>
          </div>

          {/* Watchlist Asset Items */}
          <div style={{flex:1,overflowY:'auto'}}>
            {SYMS.map(s=>{
              const px=prices[s]||{price:0,change24h:0};
              const up=(px.change24h||0)>=0;
              const active=s===sym;
              const isTarget=s===targetSym;
              const isPrimary = ['BTC','XAU'].includes(s);
              return (
                <div key={s}
                  onClick={()=>setSym(s)}
                  style={{
                    padding:'10px 12px',cursor:'pointer',
                    background: isTarget ? 'rgba(0, 242, 254, 0.1)' : active?'linear-gradient(90deg, rgba(0, 242, 254, 0.12) 0%, transparent 100%)':'transparent',
                    borderLeft: isTarget ? '3px solid var(--cyan)' : active?'3px solid var(--green)':'3px solid transparent',
                    transition:'all 0.2s ease',
                    borderBottom:'1px solid var(--border)',
                    opacity: px.tradeable===false ? 0.65 : 1,
                  }}
                  onMouseEnter={e=>{ if(!active&&!isTarget) e.currentTarget.style.background='var(--bg-hover)'; }}
                  onMouseLeave={e=>{ if(!active&&!isTarget) e.currentTarget.style.background='transparent'; }}
                >
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <span style={{fontWeight:800,fontSize:13,fontFamily:'var(--font-mono)'}}>{s}</span>
                      {isPrimary && (
                        <span className="tag tag-gold" style={{fontSize:8,padding:'1px 4px'}}>★ PRIORITY</span>
                      )}
                      {isTarget && (
                        <span className="tag tag-blue" style={{fontSize:8,padding:'1px 4px',animation:'neonPulse 2s infinite'}}>🎯 AI</span>
                      )}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      <span style={{
                        fontSize:8,fontWeight:800,
                        color: sessionColor(px.session),
                        background: `${sessionColor(px.session)}18`,
                        border: `1px solid ${sessionColor(px.session)}40`,
                        borderRadius:4,padding:'1px 5px',letterSpacing:'0.04em'
                      }}>{px.session||'...'}</span>
                      <span style={{fontSize:11,fontWeight:700,fontFamily:'var(--font-mono)',color:up?'var(--green)':'var(--red)'}}>
                        {up?'+':''}{fmt(px.change24h||0,2)}%
                      </span>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,fontWeight:800,fontFamily:'var(--font-mono)'}}>${(px.price||0).toLocaleString()}</span>
                    <div style={{width:65,height:24}}>
                      <Spark data={sparkOf(s)} color={up?'var(--green)':'var(--red)'} height={24} filled={false}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

          {/* ── Symbol Header & Controls ── */}
          <div style={{
            display:'flex',alignItems:'center',gap:0,
            padding:'0 18px',height:56,flexShrink:0,
            background:'var(--bg-surface)',borderBottom:'1px solid var(--border)',
            backdropFilter:'blur(12px)'
          }}>
            <div style={{marginRight:24}}>
              <div style={{display:'flex',alignItems:'center',gap:10,lineHeight:1}}>
                <span style={{fontWeight:900,fontSize:22,fontFamily:'var(--font-mono)',letterSpacing:'-0.03em'}}>{sym}/USD</span>
                <span style={{
                  fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:5,
                  color: sessionColor(P.session),
                  background: `${sessionColor(P.session)}18`,
                  border: `1px solid ${sessionColor(P.session)}40`,
                  letterSpacing:'0.06em',textTransform:'uppercase'
                }}>
                  {P.session||'LOADING'}
                </span>
                {sym === targetSym && (
                  <span className="tag tag-blue" style={{fontSize:9,padding:'2px 6px',animation:'neonPulse 2s infinite'}}>
                    🎯 CURRENT AI TARGET
                  </span>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <span style={{fontSize:19,fontWeight:800,fontFamily:'var(--font-mono)',color:isUp?'var(--green)':'var(--red)'}}>
                  ${P.price?.toLocaleString()||'—'}
                </span>
                <span className={`tag ${isUp?'tag-green':'tag-red'}`} style={{fontSize:11}}>
                  {isUp?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
                  {isUp?'+':''}{fmt(P.change24h,2)}% Today
                </span>
              </div>
            </div>

            <div className="vdivider" style={{margin:'0 18px'}}/>

            {/* OHLC Stats */}
            {[
              {l:'DAY HIGH', v:`$${P.high?.toLocaleString()}`},
              {l:'DAY LOW',  v:`$${P.low?.toLocaleString()}`},
              {l:'RSI (14)', v:fmt(P.rsi,1)},
            ].map(x=>(
              <div key={x.l} style={{padding:'0 16px',borderRight:'1px solid var(--border)',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em'}}>{x.l}</div>
                <div style={{fontSize:13,fontWeight:800,fontFamily:'var(--font-mono)',marginTop:2,color:'var(--text-primary)'}}>{x.v}</div>
              </div>
            ))}

            <div style={{flex:1}}/>

            {/* View Navigation Tabs */}
            <div style={{display:'flex',gap:6}}>
              {[
                {id:'chart',    icon:<BarChart2 size={13}/>,    label:'Live Chart'},
                {id:'agents',   icon:<Brain size={13}/>,        label:'AI War Room (10)'},
                {id:'news',     icon:<Newspaper size={13}/>,    label:'News Hub'},
                {id:'evolution',icon:<Cpu size={13}/>,          label:'Evolution Lab'},
                {id:'broker',   icon:<Server size={13}/>,       label:'Live Broker'},
              ].map(t=>(
                <button key={t.id} onClick={()=>setView(t.id)}
                  className={clsx('btn','btn-ghost',view===t.id&&'active')}
                  style={{fontSize:11,padding:'6px 12px'}}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Timeframe selector */}
            <div style={{display:'flex',gap:3,marginLeft:12,padding:'0 0 0 12px',borderLeft:'1px solid var(--border)'}}>
              {['1m','5m','15m','1h','4h','1d'].map(t=>(
                <button key={t} onClick={()=>setTf(t)}
                  className={clsx('btn','btn-ghost',tf===t&&'active')}
                  style={{fontSize:10,padding:'5px 8px',fontFamily:'var(--font-mono)'}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── 🎯 AI TARGET RADAR & SURVIVAL BAR ── */}
          <div style={{
            padding:'8px 18px',
            background:'linear-gradient(90deg, rgba(0, 242, 254, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
            borderBottom:'1px solid rgba(0, 242, 254, 0.25)',
            display:'flex',alignItems:'center',gap:14,flexShrink:0
          }}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <Crosshair size={15} style={{color:'var(--cyan)',animation:'neonPulse 2s infinite'}}/>
              <span style={{fontSize:11,fontWeight:900,color:'var(--cyan)',letterSpacing:'0.06em'}}>AI TARGET RADAR:</span>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,fontWeight:900,color:'var(--text-primary)',fontFamily:'var(--font-mono)'}}>
                {targetSym}/USD
              </span>
              <span className={`tag ${planned?.consensusDecision==='BUY'?'tag-green':planned?.consensusDecision==='SELL'?'tag-red':'tag-gold'}`} style={{fontSize:10,fontWeight:800}}>
                {planned?.consensusDecision || 'HOLD'} ({planned?.confidenceScore || 50}%)
              </span>
            </div>

            <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1,display:'flex',alignItems:'center',gap:8}} className="mono">
              <span>Target: <strong style={{color:'var(--green)'}}>${planned?.targetPrice?.toFixed(2) || '—'}</strong></span>
              <span>•</span>
              <span>Stop: <strong style={{color:'var(--red)'}}>${planned?.stopLossPrice?.toFixed(2) || '—'}</strong></span>
              <span className="tag tag-blue" style={{fontSize:9}}>👁️ Survival {debate?.survivalIndex || 95}%</span>
              <span className="tag tag-green" style={{fontSize:9}}>🧪 Stress Test {debate?.stressPass !== false ? 'PASSED' : 'FAILED'}</span>
            </div>

            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:10,color:'var(--text-tertiary)'}}>
                ⏭️ Next in queue: <strong style={{color:'var(--text-secondary)'}}>{nextSym}</strong>
              </span>

              {sym !== targetSym && (
                <button className="btn btn-green" style={{padding:'4px 10px',fontSize:10}}
                  onClick={()=>{ setSym(targetSym); msg(`🎯 Switch Chart to AI Target: ${targetSym}`); }}>
                  <EyeIcon size={12}/> SWITCH CHART TO {targetSym}
                </button>
              )}
            </div>
          </div>

          {/* ── Market Closed Warning Banner ── */}
          {(P.tradeable===false || state.lastSkippedReason) && (
            <div style={{
              padding:'8px 18px',
              background:'linear-gradient(90deg, rgba(255, 183, 3, 0.1) 0%, rgba(255, 183, 3, 0.03) 100%)',
              borderBottom:'1px solid rgba(255, 183, 3, 0.25)',
              display:'flex',alignItems:'center',gap:10,flexShrink:0
            }}>
              <AlertTriangle size={14} style={{color:'var(--gold)',flexShrink:0}}/>
              <span style={{fontSize:11,color:'var(--gold)',fontWeight:700}}>
                {P.tradeable===false
                  ? `${sym} market is currently ${P.session} — AI Council is standing by and will execute trades upon market open.`
                  : state.lastSkippedReason
                }
              </span>
              <span style={{fontSize:10,color:'var(--text-tertiary)',marginLeft:'auto'}}>
                Crypto (BTC/ETH) 24/7 · Equities Mon–Fri 09:30–16:00 ET · Gold Sun 18:00–Fri 17:00 ET
              </span>
            </div>
          )}

          {/* ── Content Views ── */}
          <div style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'14px',display:'flex',flexDirection:'column',gap:14,minHeight:0}}>

            {/* CHART VIEW */}
            {view==='chart' && (
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:14,flex:1,minHeight:540}}>
                  {/* ── Chart Panel (TradingView Embedded Widget) ── */}
                  <div className="panel glow-card" style={{display:'flex',flexDirection:'column',minHeight:540}}>
                    <div className="panel-header">
                      <span className="panel-title"><BarChart2 size={13} style={{color:'var(--cyan)'}}/> {sym}/USD · {tf} · TRADINGVIEW LIVE PRO CHART</span>
                      <div style={{display:'flex',gap:6}}>
                        <span className="tag tag-blue">Real-Time Data</span>
                        <span className="tag tag-green">RSI · MACD · Bollinger</span>
                        {state.autoPilotActive && <span className="tag tag-green"><span className="live-dot"/> AUTO-PILOT ON</span>}
                      </div>
                    </div>
                    {/* TradingView Chart */}
                    <div style={{flex:1,minHeight:460,overflow:'hidden',position:'relative'}}>
                      <TradingViewChart symbol={sym} timeframe={tf} />
                    </div>

                    {/* Active Strategy Bar */}
                    {strat.name && (
                      <div style={{padding:'10px 14px',background:'rgba(0, 242, 254, 0.05)',borderTop:'1px solid rgba(0, 242, 254, 0.15)',display:'flex',alignItems:'center',gap:12}}>
                        <Target size={14} style={{color:'var(--cyan)',flexShrink:0}}/>
                        <span style={{fontSize:11,fontWeight:700,color:'var(--cyan)'}}>{strat.name}</span>
                        <span style={{color:'var(--text-tertiary)',fontSize:10,flex:1}}>{strat.rationale?.slice(0,85)}…</span>
                        <span className="tag tag-green">TP +{fmt((strat.targetProfitPct||0.03)*100,1)}%</span>
                        <span className="tag tag-red">SL -{fmt((strat.stopLossPct||0.015)*100,1)}%</span>
                        <span className="tag tag-blue">{strat.matchScore||85}% Match</span>
                      </div>
                    )}

                    {/* Active Positions Bar */}
                    {(port.positions||[]).filter(p=>p.symbol===sym).map(pos=>(
                      <div key={pos.id} style={{padding:'10px 14px',background:'rgba(0, 255, 213, 0.06)',borderTop:'1px solid rgba(0, 255, 213, 0.2)',display:'flex',alignItems:'center',gap:12}}>
                        <Activity size={14} style={{color:'var(--green)',flexShrink:0}}/>
                        <span style={{fontSize:11,fontWeight:800,color:'var(--green)'}}>PAPER POSITION OPEN</span>
                        <span className="mono" style={{fontSize:11,color:'var(--text-secondary)'}}>
                          {pos.side} @ ${pos.entryPrice?.toLocaleString()}
                        </span>
                        <span className="mono" style={{fontSize:10,color:'var(--text-secondary)'}}>
                          Size: ${fmt(pos.costBasis,2)}
                        </span>
                        <span className="tag tag-green">TP ${pos.targetPrice?.toFixed(2)}</span>
                        <span className="tag tag-red">SL ${pos.stopLossPrice?.toFixed(2)}</span>
                        <span className="mono" style={{fontSize:12,fontWeight:800,marginLeft:'auto',color:(pos.unrealizedPnL||0)>=0?'var(--green)':'var(--red)'}}>
                          {(pos.unrealizedPnL||0)>=0?'+':''}${fmt(pos.unrealizedPnL||0,3)}
                        </span>
                        <button onClick={()=>api('/api/close-position',{positionId:pos.id}).then(()=>msg('Position Closed'))}
                          style={{background:'rgba(255,42,95,0.15)',border:'1px solid rgba(255,42,95,0.3)',borderRadius:5,padding:'4px 10px',color:'var(--red)',fontSize:10,cursor:'pointer',fontWeight:800}}>
                          CLOSE
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ── Right Panel: AI Council Decision & Order Ledger ── */}
                  <div style={{display:'flex',flexDirection:'column',gap:14,overflow:'hidden'}}>

                    {/* AI Decision Panel */}
                    <div className="panel glow-card" style={{flexShrink:0}}>
                      <div className="panel-header">
                        <span className="panel-title"><Brain size={13} style={{color:'var(--purple)'}}/> AI COUNCIL SIGNAL</span>
                        {debate && (
                          <span className={`tag ${debate.consensusDecision==='BUY'?'tag-green':debate.consensusDecision==='SELL'?'tag-red':'tag-gold'}`}
                            style={{fontSize:11,fontWeight:900,padding:'4px 10px'}}>
                            {debate.consensusDecision} {debate.confidenceScore}%
                          </span>
                        )}
                      </div>
                      {debate ? (
                        <div style={{padding:'10px 0'}}>
                          {/* Confidence Dial Bar */}
                          <div style={{padding:'8px 14px 12px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                              <span style={{fontSize:10,color:'var(--text-tertiary)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em'}}>Consensus Score</span>
                              <span className="mono" style={{fontSize:11,fontWeight:800,color:debate.consensusDecision==='BUY'?'var(--green)':debate.consensusDecision==='SELL'?'var(--red)':'var(--gold)'}}>{debate.confidenceScore}%</span>
                            </div>
                            <div style={{height:5,background:'var(--bg-active)',borderRadius:3,overflow:'hidden'}}>
                              <div style={{
                                height:'100%',borderRadius:3,
                                width:`${debate.confidenceScore}%`,
                                background:`linear-gradient(90deg, var(--cyan), ${debate.consensusDecision==='BUY'?'var(--green)':debate.consensusDecision==='SELL'?'var(--red)':'var(--gold)'})`,
                                transition:'width 0.5s ease',
                                boxShadow:'0 0 10px var(--cyan)'
                              }}/>
                            </div>
                          </div>

                          {/* Vote Tally Grid */}
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:0,borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
                            {[['BUY','var(--green)'],['HOLD','var(--gold)'],['SELL','var(--red)']].map(([label,color])=>{
                              const votes=debate.agentStreams||[];
                              const count=votes.filter(v=>v.vote===label).length;
                              return (
                                <div key={label} style={{padding:'10px',textAlign:'center',borderRight:'1px solid var(--border)'}}>
                                  <div style={{fontSize:18,fontWeight:900,fontFamily:'var(--font-mono)',color}}>{count}</div>
                                  <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label} VOTES</div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Mini Agent Roster */}
                          <div style={{padding:'10px 12px',display:'grid',gridTemplateColumns:'repeat(5, 1fr)',gap:4,borderBottom:'1px solid var(--border)'}}>
                            {agents.map(ag=>(
                              <div key={ag.id} title={`${ag.name} v${ag.version} — ${ag.role}`}
                                style={{textAlign:'center',padding:'5px 3px',background:'var(--bg-elevated)',borderRadius:6,border:'1px solid var(--border)',cursor:'pointer',transition:'all 0.2s ease'}}
                                onClick={()=>{ if(confirm(`Fire & upgrade ${ag.name}?`)) api('/api/fire-agent',{agentKey:ag.name}).then(()=>msg(`Upgraded ${ag.name}!`)); }}
                              >
                                <div style={{fontSize:14}}>{ag.avatar}</div>
                                <div style={{fontSize:8,color:'var(--text-secondary)',fontWeight:700,marginTop:2}}>{ag.name.slice(0,5)}</div>
                                <div className="mono" style={{fontSize:8,color:'var(--cyan)',fontWeight:800}}>v{ag.version}</div>
                              </div>
                            ))}
                          </div>

                          {/* Latest Chief Strategist Comment */}
                          {debate.agentStreams?.slice(-1).map((s,i)=>(
                            <div key={i} style={{padding:'10px 14px',fontSize:11,color:'var(--text-secondary)',lineHeight:1.5}}>
                              <strong style={{color:'var(--text-primary)'}}>{s.avatar} {s.agent}: </strong>
                              {s.text}
                            </div>
                          ))}
                        </div>
                      ):(
                        <div style={{padding:20,textAlign:'center',color:'var(--text-tertiary)',fontSize:11}}>
                          Waiting for first AI Council cycle…
                        </div>
                      )}
                    </div>

                    {/* Open Positions Ledger */}
                    <div className="panel glow-card" style={{flexShrink:0}}>
                      <div className="panel-header">
                        <span className="panel-title"><Wallet size={13} style={{color:'var(--green)'}}/> OPEN POSITIONS ({(port.positions||[]).length})</span>
                        <span className="mono" style={{fontSize:11,color:'var(--text-secondary)',fontWeight:700}}>Cash: ${fmt(port.cashBalance||5,2)}</span>
                      </div>
                      <div style={{maxHeight:140,overflowY:'auto'}}>
                        {(port.positions||[]).length===0?(
                          <div style={{padding:'16px',textAlign:'center',color:'var(--text-tertiary)',fontSize:11}}>No active paper positions</div>
                        ):(port.positions||[]).map(pos=>{
                          const up=(pos.unrealizedPnL||0)>=0;
                          return (
                            <div key={pos.id} style={{
                              display:'flex',alignItems:'center',gap:8,
                              padding:'8px 14px',borderBottom:'1px solid var(--border)',
                              fontSize:11
                            }}>
                              <span className="mono" style={{fontWeight:800,minWidth:38}}>{pos.symbol}</span>
                              <span className={`tag ${pos.side==='BUY'?'tag-green':'tag-red'}`}>{pos.side}</span>
                              <span className="mono" style={{color:'var(--text-secondary)',fontSize:10,flex:1}}>${pos.entryPrice?.toLocaleString()}</span>
                              <span className="mono" style={{color:up?'var(--green)':'var(--red)',fontWeight:800,fontSize:11}}>
                                {up?'+':''}${fmt(pos.unrealizedPnL||0,3)}
                              </span>
                              <button onClick={()=>api('/api/close-position',{positionId:pos.id}).then(()=>msg('Position Closed'))}
                                style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-tertiary)',padding:2}}>
                                <X size={13}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Closed Trade Log */}
                    <div className="panel glow-card" style={{flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>
                      <div className="panel-header">
                        <span className="panel-title"><Clock size={13} style={{color:'var(--gold)'}}/> CLOSED TRADE LOG</span>
                        <span style={{fontSize:10,color:'var(--green)',fontWeight:800}}>{port.winningTradesCount||0}W / {(port.totalTradesCount||0)-(port.winningTradesCount||0)}L</span>
                      </div>
                      <div style={{flex:1,overflowY:'auto'}}>
                        {(port.tradeHistory||[]).length===0?(
                          <div style={{padding:16,textAlign:'center',color:'var(--text-tertiary)',fontSize:11}}>No closed trade history yet</div>
                        ):(port.tradeHistory||[]).map((t,i)=>{
                          const up=t.pnl>=0;
                          return (
                            <div key={i} style={{
                              display:'flex',alignItems:'center',gap:8,
                              padding:'8px 14px',borderBottom:'1px solid var(--border)',
                              fontSize:11
                            }}>
                              {up?<ArrowUpRight size={13} style={{color:'var(--green)'}}/>:<ArrowDownRight size={13} style={{color:'var(--red)'}}/>}
                              <span className="mono" style={{fontWeight:800,minWidth:38}}>{t.symbol}</span>
                              <span style={{color:'var(--text-tertiary)',flex:1,fontSize:10}}>{t.reason?.replace(/_/g,' ')}</span>
                              <span className="mono" style={{color:up?'var(--green)':'var(--red)',fontWeight:800}}>
                                {up?'+':''}${fmt(t.pnl,3)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Bottom Row: News Intelligence Bar ── */}
                <div className="panel glow-card" style={{flexShrink:0}}>
                  <div className="panel-header">
                    <span className="panel-title"><Newspaper size={13} style={{color:'var(--cyan)'}}/> LIVE MARKET NEWS FEED</span>
                    <span style={{display:'flex',alignItems:'center',gap:6,fontSize:10,color:'var(--text-secondary)'}}>
                      <span className="live-dot"/> Continuous web scanner
                    </span>
                  </div>
                  <div style={{display:'flex',overflowX:'auto',gap:0}}>
                    {news.slice(0,6).map((n,i)=>(
                      <div key={i} style={{
                        minWidth:230,maxWidth:250,padding:'12px 14px',
                        borderRight:'1px solid var(--border)',flexShrink:0,
                        transition:'background 0.2s'
                      }}>
                        <div style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
                          <span className="tag tag-blue" style={{fontSize:9}}>{n.symbol}</span>
                          <span className={`tag ${n.sentiment==='Bullish'?'tag-green':n.sentiment==='Bearish'?'tag-red':'tag-gold'}`} style={{fontSize:9}}>
                            {n.sentiment}
                          </span>
                          <span className="mono" style={{fontSize:9,color:'var(--text-tertiary)',marginLeft:'auto'}}>{fmt(n.impact*100,0)}% Impact</span>
                        </div>
                        <div style={{fontSize:11,fontWeight:700,lineHeight:1.4,color:'var(--text-primary)',marginBottom:4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                          {n.title}
                        </div>
                        <div style={{fontSize:10,color:'var(--text-tertiary)'}}>{n.source}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* AI COUNCIL VIEW */}
            {view==='agents' && (
              <div style={{display:'flex',flexDirection:'column',gap:14,flex:1}}>
                {/* Header Banner */}
                <div className="panel glow-card" style={{padding:'14px 18px',display:'flex',gap:18,alignItems:'center',background:'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)'}}>
                  <div style={{fontSize:32,animation:'floatGlow 3s infinite ease-in-out'}}>🤖</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:900,fontSize:15,marginBottom:4}}>10-Agent AI Trading Council — Generation {state.generation||1}</div>
                    <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.5}}>
                      Autonomous AI council equipped with dedicated 3-Agent Risk Management Module (RiskSentinel, SurvivalInstinctGuard, StressTester), 1,000-path Monte Carlo simulations, and Extinction Avoidance logic.
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,flexShrink:0}}>
                    <div style={{background:'rgba(0, 255, 213, 0.08)',border:'1px solid rgba(0, 255, 213, 0.25)',borderRadius:8,padding:'8px 12px',textAlign:'center'}}>
                      <div style={{fontSize:18,fontWeight:900,color:'var(--green)',fontFamily:'var(--font-mono)'}}>{agents.filter(a=>a.winCount>a.lossCount).length}</div>
                      <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:800}}>PROFITABLE</div>
                    </div>
                    <div style={{background:'rgba(0, 242, 254, 0.08)',border:'1px solid rgba(0, 242, 254, 0.25)',borderRadius:8,padding:'8px 12px',textAlign:'center'}}>
                      <div style={{fontSize:18,fontWeight:900,color:'var(--cyan)',fontFamily:'var(--font-mono)'}}>{state.generation||1}</div>
                      <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:800}}>GENERATION</div>
                    </div>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,flex:1,minHeight:0}}>
                  {/* Agent Roster */}
                  <div className="panel glow-card" style={{overflowY:'auto'}}>
                    <div className="panel-header">
                      <span className="panel-title"><ShieldCheck size={14} style={{color:'var(--cyan)'}}/> COUNCIL ROSTER & RISK MANAGEMENT MODULE</span>
                      <span className="tag tag-blue">{agents.length} Agents Active</span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:0}}>
                      {agents.map((ag)=>{
                        const isVeto = ['RiskSentinel','SurvivalInstinctGuard','StressTester','RegimeDetector'].includes(ag.name);
                        const isRiskModule = ['RiskSentinel','SurvivalInstinctGuard','StressTester'].includes(ag.name);
                        const winRate = ag.tradesParticipated>0?Math.round((ag.winCount/ag.tradesParticipated)*100):0;
                        return (
                          <div key={ag.id} style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:12,alignItems:'flex-start'}}>
                            <div style={{width:40,height:40,borderRadius:8,background:'var(--bg-elevated)',border:`1px solid ${isVeto?'rgba(255,42,95,0.4)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{ag.avatar}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                                <span style={{fontWeight:900,fontSize:13}}>{ag.name}</span>
                                <span className="tag tag-blue" style={{fontSize:8}}>v{ag.version}</span>
                                {isRiskModule && <span className="tag tag-purple" style={{fontSize:8}}>RISK MODULE</span>}
                                {isVeto && <span className="tag tag-red" style={{fontSize:8}}>VETO POWER</span>}
                              </div>
                              <div style={{fontSize:10,color:'var(--cyan)',fontWeight:700,marginBottom:4}}>{ag.role}</div>
                              <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.5,marginBottom:6}}>{ag.description}</div>
                              <div style={{fontSize:10,background:'rgba(255, 183, 3, 0.08)',border:'1px solid rgba(255, 183, 3, 0.2)',borderRadius:6,padding:'6px 8px',color:'var(--gold)',lineHeight:1.4,marginBottom:6}}>
                                <strong>Why chosen:</strong> {ag.why}
                              </div>
                              <div style={{fontSize:10,color:'var(--text-tertiary)',fontStyle:'italic',borderLeft:'2px solid var(--cyan)',paddingLeft:8,marginBottom:6,lineHeight:1.4}}>
                                Memory: {ag.memory?.[ag.memory.length-1]||'Initialising memory…'}
                              </div>
                              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                                <span style={{fontSize:10,color:'var(--text-tertiary)'}}>Trades: {ag.tradesParticipated}</span>
                                <span style={{fontSize:10,color:'var(--green)',fontWeight:700}}>W:{ag.winCount}</span>
                                <span style={{fontSize:10,color:'var(--red)',fontWeight:700}}>L:{ag.lossCount}</span>
                                {ag.tradesParticipated>0&&<span style={{fontSize:10,color:'var(--cyan)',fontWeight:700}}>Win Rate:{winRate}%</span>}
                              </div>
                            </div>
                            <button onClick={()=>{ if(confirm(`Fire & replace ${ag.name}?`)) api('/api/fire-agent',{agentKey:ag.name}).then(()=>msg(`✅ ${ag.name} Upgraded!`)); }}
                              style={{background:'rgba(255,42,95,0.1)',border:'1px solid rgba(255,42,95,0.3)',borderRadius:6,padding:'4px 9px',color:'var(--red)',fontSize:10,cursor:'pointer',fontWeight:800,flexShrink:0}}>
                              🔥 FIRE
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Debate Stream */}
                  <div className="panel glow-card" style={{display:'flex',flexDirection:'column'}}>
                    <div className="panel-header">
                      <span className="panel-title"><MessageSquare size={14} style={{color:'var(--cyan)'}}/> LIVE DEBATE STREAM & REFLECTIONS</span>
                      {debate&&<div style={{display:'flex',gap:6,alignItems:'center'}}>
                        {debate.detectedRegime&&<span className="tag tag-blue" style={{fontSize:9}}>{debate.detectedRegime}</span>}
                        {debate.hardVeto&&<span className="tag tag-red" style={{fontSize:9}}>VETO ACTIVE</span>}
                        <span className={`tag ${debate.consensusDecision==='BUY'?'tag-green':debate.consensusDecision==='SELL'?'tag-red':'tag-gold'}`} style={{fontSize:11,fontWeight:900}}>{debate.consensusDecision} · {debate.confidenceScore}%</span>
                      </div>}
                    </div>
                    <div style={{flex:1,overflowY:'auto'}}>
                      {(debate?.agentStreams||[]).map((s,i)=>(
                        <div key={i} style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:10,alignItems:'flex-start'}}>
                          <span style={{fontSize:20,flexShrink:0}}>{s.avatar}</span>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                              <span style={{fontWeight:800,fontSize:12}}>{s.agent}</span>
                              <span className="mono" style={{fontSize:9,color:'var(--text-tertiary)'}}>v{s.version}</span>
                              <span className={`tag ${s.vote==='BUY'?'tag-green':s.vote==='SELL'?'tag-red':'tag-gold'}`} style={{marginLeft:'auto',fontSize:10,fontWeight:900}}>{s.vote}</span>
                            </div>
                            <p style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.6}}>{s.text}</p>
                          </div>
                        </div>
                      ))}
                      {!debate&&<div style={{padding:20,textAlign:'center',color:'var(--text-tertiary)',fontSize:11}}>No debate data yet. Trigger a cycle to begin.</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEWS VIEW */}
            {view==='news' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:14}}>
                {news.map((n,i)=>(
                  <div key={i} className="panel glow-card" style={{padding:'14px'}}>
                    <div style={{display:'flex',gap:6,marginBottom:10,alignItems:'center',flexWrap:'wrap'}}>
                      <span className="tag tag-blue">{n.symbol}</span>
                      <span className={`tag ${n.sentiment==='Bullish'?'tag-green':n.sentiment==='Bearish'?'tag-red':'tag-gold'}`}>{n.sentiment}</span>
                      <span className="tag tag-purple">{n.relevance}</span>
                      <span className="mono" style={{fontSize:10,color:'var(--text-tertiary)',marginLeft:'auto'}}>{fmt(n.impact*100,0)}% Impact</span>
                    </div>
                    <h3 style={{fontSize:13,fontWeight:800,lineHeight:1.5,color:'var(--text-primary)',marginBottom:8}}>{n.title}</h3>
                    <p style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:10}}>{n.summary?.slice(0,150)}…</p>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:10,color:'var(--text-tertiary)',fontWeight:700}}>{n.source}</span>
                      <div style={{height:28,width:80}}>
                        <Spark data={[...Array(12)].map(()=>Math.random())} color={n.sentiment==='Bullish'?'var(--green)':n.sentiment==='Bearish'?'var(--red)':'var(--gold)'} height={28} filled={false}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EVOLUTION LAB VIEW */}
            {view==='evolution' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,flex:1}}>
                <div className="panel glow-card" style={{display:'flex',flexDirection:'column'}}>
                  <div className="panel-header">
                    <span className="panel-title"><ShieldAlert size={14} style={{color:'var(--red)'}}/> POST-MORTEM FAILURE REPORTS</span>
                    <span className="tag tag-red">{(state.postMortems||[]).length} Events</span>
                  </div>
                  <div style={{flex:1,overflowY:'auto'}}>
                    {(state.postMortems||[]).length===0?(
                      <div style={{padding:24,textAlign:'center',color:'var(--text-tertiary)',fontSize:11}}>No failures recorded. Agents operating within risk parameters.</div>
                    ):(state.postMortems||[]).map((pm,i)=>(
                      <div key={i} style={{padding:'14px',borderBottom:'1px solid var(--border)'}}>
                        <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                          <span className="tag tag-red">{pm.symbol} LOSS</span>
                          <span className="mono" style={{fontSize:12,fontWeight:800,color:'var(--red)'}}>-${Math.abs(pm.pnl).toFixed(3)}</span>
                          <span style={{fontSize:10,color:'var(--text-tertiary)',marginLeft:'auto'}}>{new Date(pm.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:6,lineHeight:1.5}}>
                          <strong style={{color:'var(--red)'}}>Root Cause:</strong> {pm.rootCause}
                        </div>
                        <div style={{fontSize:10,background:'rgba(0, 242, 254, 0.08)',border:'1px solid rgba(0, 242, 254, 0.2)',borderRadius:6,padding:'8px 10px',color:'var(--cyan)',fontFamily:'var(--font-mono)'}}>
                          ⚡ {pm.actionTaken}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="panel glow-card" style={{display:'flex',flexDirection:'column'}}>
                  <div className="panel-header">
                    <span className="panel-title"><Cpu size={14} style={{color:'var(--cyan)'}}/> EVOLUTION LINEAGE LOG — GEN {state.generation||1}</span>
                  </div>
                  <div style={{flex:1,overflowY:'auto'}}>
                    {(state.evolutionLog||[]).length===0?(
                      <div style={{padding:24,textAlign:'center',color:'var(--text-tertiary)',fontSize:11}}>Lineage initialized. Gen 1 active.</div>
                    ):(state.evolutionLog||[]).map((log,i)=>(
                      <div key={i} style={{padding:'14px',borderBottom:'1px solid var(--border)'}}>
                        <div style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
                          <span className="tag tag-purple">GEN {log.generation}</span>
                          <span className="tag tag-blue">{log.type?.replace(/_/g,' ')}</span>
                          <span style={{fontSize:10,color:'var(--text-tertiary)',marginLeft:'auto'}}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.5}}>{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* LIVE BROKER INTEGRATION VIEW */}
            {view==='broker' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,flex:1}}>
                <div className="panel glow-card" style={{padding:'18px',display:'flex',flexDirection:'column',gap:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid var(--border)',paddingBottom:12}}>
                    <Server size={20} style={{color:'var(--cyan)'}}/>
                    <div>
                      <div style={{fontWeight:900,fontSize:14}}>XM360 / MT4 / MT5 / Webhook Live Broker Gateway</div>
                      <div style={{fontSize:11,color:'var(--text-secondary)'}}>Connect AI Council signals to real-life broker trading accounts</div>
                    </div>
                  </div>

                  <div style={{display:'flex',gap:10}}>
                    <button className={clsx('btn', brokerMode==='PAPER'?'btn-green':'btn-ghost')}
                      style={{flex:1,justifyContent:'center',padding:'10px'}}
                      onClick={()=>setBrokerMode('PAPER')}>
                      📄 PAPER TRADING ($5 USD)
                    </button>
                    <button className={clsx('btn', brokerMode==='LIVE_BROKER'?'btn-red':'btn-ghost')}
                      style={{flex:1,justifyContent:'center',padding:'10px'}}
                      onClick={()=>setBrokerMode('LIVE_BROKER')}>
                      🔴 LIVE BROKER EXECUTION
                    </button>
                  </div>

                  {brokerMode === 'LIVE_BROKER' && (
                    <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:8}}>
                      <div>
                        <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>SELECT BROKER INTEGRATION TYPE</label>
                        <select value={brokerType} onChange={e=>setBrokerType(e.target.value)}
                          style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:6,padding:'8px 10px',color:'var(--text-primary)',fontSize:12,outline:'none'}}>
                          <option value="XM_METAAPI">XM Broker (via MetaTrader 4/5 MetaApi REST Token)</option>
                          <option value="WEBHOOK">Universal Webhook (PineConnector / MT4/MT5 EA / Telegram Signal)</option>
                          <option value="BINANCE">Crypto Exchange API (Binance / Bybit Spot API Key)</option>
                        </select>
                      </div>

                      {brokerType === 'XM_METAAPI' && (
                        <>
                          <div style={{background:'rgba(0,242,254,0.05)',border:'1px solid rgba(0,242,254,0.15)',borderRadius:6,padding:'10px',fontSize:11,color:'var(--text-secondary)'}}>
                            <strong>How to connect XM Broker:</strong><br/>
                            1. Create a free account at <strong style={{color:'var(--cyan)'}}>MetaApi.cloud</strong><br/>
                            2. Add your XM MT4/MT5 account details.<br/>
                            3. Paste your MetaApi Token & Account ID below. Orders for BTC & XAU (GOLD) will dispatch automatically!
                          </div>
                          <div>
                            <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>METAAPI AUTH TOKEN</label>
                            <input type="password" value={metaApiToken} onChange={e=>setMetaApiToken(e.target.value)} placeholder="Paste MetaApi token"
                              style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:6,padding:'8px 10px',color:'var(--text-primary)',fontSize:12,fontFamily:'var(--font-mono)',outline:'none'}}/>
                          </div>
                          <div>
                            <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>METAAPI ACCOUNT ID</label>
                            <input type="text" value={metaAccountId} onChange={e=>setMetaAccountId(e.target.value)} placeholder="e.g. 5d8f2b3c-..."
                              style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:6,padding:'8px 10px',color:'var(--text-primary)',fontSize:12,fontFamily:'var(--font-mono)',outline:'none'}}/>
                          </div>
                        </>
                      )}

                      {brokerType === 'WEBHOOK' && (
                        <>
                          <div style={{background:'rgba(255,183,3,0.05)',border:'1px solid rgba(255,183,3,0.15)',borderRadius:6,padding:'10px',fontSize:11,color:'var(--text-secondary)'}}>
                            <strong>Universal Webhook Gateway:</strong> Dispatches JSON trade signals (`symbol`, `action`, `price`, `stopLoss`, `takeProfit`) to your MetaTrader Expert Advisor (EA), PineConnector, or custom backend.
                          </div>
                          <div>
                            <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>WEBHOOK DISPATCH URL</label>
                            <input type="text" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} placeholder="https://your-broker-ea-webhook-endpoint.com/trade"
                              style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:6,padding:'8px 10px',color:'var(--text-primary)',fontSize:12,fontFamily:'var(--font-mono)',outline:'none'}}/>
                          </div>
                        </>
                      )}

                      <button className="btn btn-green" style={{padding:'10px',justifyContent:'center',fontSize:12,fontWeight:900,marginTop:6}}
                        onClick={saveBrokerConfig}>
                        <CheckCircle2 size={14}/> SAVE & CONNECT LIVE BROKER
                      </button>
                    </div>
                  )}
                </div>

                {/* Broker Execution Logs */}
                <div className="panel glow-card" style={{display:'flex',flexDirection:'column'}}>
                  <div className="panel-header">
                    <span className="panel-title"><Activity size={14} style={{color:'var(--green)'}}/> LIVE BROKER LOGS & DISPATCH AUDIT</span>
                    <span className={`tag ${broker.mode==='LIVE_BROKER'?'tag-red':'tag-blue'}`}>{broker.mode} MODE</span>
                  </div>
                  <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
                    {(broker.logs||[]).length === 0 ? (
                      <div style={{textAlign:'center',color:'var(--text-tertiary)',fontSize:11,padding:24}}>
                        No live broker dispatches yet. Switch to Live Broker mode or configure MetaApi / Webhooks.
                      </div>
                    ) : (broker.logs||[]).map((lg, i) => (
                      <div key={i} style={{padding:'8px 10px',borderBottom:'1px solid var(--border)',fontSize:11,fontFamily:'var(--font-mono)',lineHeight:1.5}}>
                        <span style={{color:'var(--text-tertiary)',fontSize:9}}>{new Date(lg.timestamp).toLocaleTimeString()} </span>
                        <strong style={{color: lg.type==='ERROR'?'var(--red)':'var(--cyan)'}}>[{lg.type}] </strong>
                        <span>{lg.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT SIDEBAR: Strategy + System Status ── */}
        <div style={{
          width:210,flexShrink:0,
          background:'var(--bg-surface)',
          borderLeft:'1px solid var(--border)',
          display:'flex',flexDirection:'column',
          overflow:'hidden'
        }}>
          {/* AI Target Focus Radar Card */}
          <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',background:'rgba(0, 242, 254, 0.03)'}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--cyan)',marginBottom:6,display:'flex',alignItems:'center',gap:4}}>
              <Crosshair size={12}/> AI FOCUS & PIPELINE
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <div className="mono" style={{fontWeight:900,fontSize:14,color:'var(--text-primary)'}}>
                🎯 {targetSym}/USD
              </div>
              <span className={`tag ${planned?.consensusDecision==='BUY'?'tag-green':planned?.consensusDecision==='SELL'?'tag-red':'tag-gold'}`} style={{fontSize:9,fontWeight:800}}>
                {planned?.consensusDecision || 'HOLD'}
              </span>
            </div>
            <div style={{fontSize:10,color:'var(--text-secondary)',lineHeight:1.4,marginBottom:6}}>
              Evaluating {planned?.strategyName || 'market breakout strategy'}.
            </div>
            <div style={{fontSize:9,color:'var(--text-tertiary)',display:'flex',justifyContent:'space-between'}}>
              <span>Queued next: <strong style={{color:'var(--text-secondary)'}}>{nextSym}</strong></span>
              {sym !== targetSym && (
                <span onClick={()=>setSym(targetSym)} style={{color:'var(--cyan)',cursor:'pointer',fontWeight:700}}>View Chart →</span>
              )}
            </div>
          </div>

          {/* Active Strategy Card */}
          <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-tertiary)',marginBottom:8}}>ACTIVE STRATEGY</div>
            {strat.name ? (
              <>
                <div style={{fontWeight:800,fontSize:13,marginBottom:6,lineHeight:1.4}}>{strat.name}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
                  <span className="tag tag-blue" style={{fontSize:9}}>{strat.type}</span>
                  <span className="tag tag-gold" style={{fontSize:9}}>{strat.matchScore}% Match</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
                  <div style={{background:'rgba(0,255,213,0.08)',border:'1px solid rgba(0,255,213,0.2)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:700}}>TARGET</div>
                    <div style={{fontSize:12,fontWeight:900,color:'var(--green)',fontFamily:'var(--font-mono)'}}>+{fmt((strat.targetProfitPct||0.035)*100,1)}%</div>
                  </div>
                  <div style={{background:'rgba(255,42,95,0.08)',border:'1px solid rgba(255,42,95,0.2)',borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:700}}>STOP</div>
                    <div style={{fontSize:12,fontWeight:900,color:'var(--red)',fontFamily:'var(--font-mono)'}}>-{fmt((strat.stopLossPct||0.015)*100,1)}%</div>
                  </div>
                </div>
                <div style={{fontSize:9,fontWeight:800,textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:6,letterSpacing:'0.06em'}}>EXECUTION RULES</div>
                {(strat.rules||[]).map((r,i)=>(
                  <div key={i} style={{display:'flex',gap:6,fontSize:10,color:'var(--text-secondary)',marginBottom:4,alignItems:'flex-start'}}>
                    <CheckCircle2 size={11} style={{color:'var(--green)',flexShrink:0,marginTop:2}}/>
                    <span style={{lineHeight:1.4}}>{r}</span>
                  </div>
                ))}
              </>
            ):(
              <div style={{color:'var(--text-tertiary)',fontSize:11}}>Scanning for best strategy…</div>
            )}
          </div>

          {/* System Status Footer */}
          <div style={{padding:'12px 14px',marginTop:'auto',borderTop:'1px solid var(--border)'}}>
            <div style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-tertiary)',marginBottom:8}}>SYSTEM METRICS</div>
            {[
              {l:'Auto-Pilot',v:state.autoPilotActive?'RUNNING':'PAUSED',c:state.autoPilotActive?'var(--green)':'var(--gold)'},
              {l:'Speed/Conf',v:`${state.executionMode||'AGGRESSIVE'}`,c:'var(--cyan)'},
              {l:'Broker Mode',v:`${broker.mode}`,c:broker.mode==='LIVE_BROKER'?'var(--red)':'var(--blue)'},
              {l:'Survival Index',v:`${debate?.survivalIndex||95}%`,c:'var(--green)'},
              {l:'Paper Ledger',v:`$${fmt(port.totalEquity||5,2)}`,c:'var(--text-primary)'},
            ].map(x=>(
              <div key={x.l} style={{display:'flex',justifyContent:'space-between',marginBottom:6,alignItems:'center'}}>
                <span style={{fontSize:10,color:'var(--text-tertiary)'}}>{x.l}</span>
                <span className="mono" style={{fontSize:10,fontWeight:800,color:x.c}}>{x.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════ Custom Wallet Capital Modal ══════════════════════ */}
      {showWalletModal && (
        <div style={{
          position:'fixed',inset:0,zIndex:1000,
          background:'rgba(2, 4, 10, 0.85)',backdropFilter:'blur(12px)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:16
        }}>
          <div className="panel glow-card" style={{
            width:400,overflow:'hidden',
            boxShadow:'0 24px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <DollarSign size={18} style={{color:'var(--green)'}}/>
                <span style={{fontWeight:800,fontSize:14}}>WALLET & CAPITAL CONTROLLER</span>
              </div>
              <button onClick={()=>setShowWalletModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:2}}>
                <X size={18}/>
              </button>
            </div>
            <div style={{padding:'18px',display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>
                  STARTING WALLET CAPITAL ($ USD)
                </label>
                <input type="number" step="1.00" min="1.00" value={customStartCapital} onChange={e=>setCustomStartCapital(e.target.value)}
                  style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,padding:'12px',color:'var(--text-primary)',fontSize:18,fontFamily:'var(--font-mono)',fontWeight:800,outline:'none'}}/>
                <div style={{fontSize:10,color:'var(--text-tertiary)',marginTop:4}}>Set custom wallet balance for agents to trade with (e.g. $5.00, $10.00, $50.00, $100.00, etc.)</div>
              </div>

              <div>
                <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>
                  MAX PER-TRADE ALLOCATION ($ USD)
                </label>
                <input type="number" step="0.50" min="0.20" value={customTradeAlloc} onChange={e=>setCustomTradeAlloc(e.target.value)}
                  style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,padding:'12px',color:'var(--text-primary)',fontSize:18,fontFamily:'var(--font-mono)',fontWeight:800,outline:'none'}}/>
                <div style={{fontSize:10,color:'var(--text-tertiary)',marginTop:4}}>Amount allocated per trade position</div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:6,marginTop:4}}>
                {[5, 10, 50, 100].map(amt=>(
                  <button key={amt} className="btn btn-ghost" style={{padding:'8px 0',justifyContent:'center',fontSize:11,fontFamily:'var(--font-mono)'}}
                    onClick={()=>{ setCustomStartCapital(String(amt)); setCustomTradeAlloc(String(Math.min(amt*0.3, 5))); }}>
                    ${amt}
                  </button>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:6}}>
                <button className="btn btn-ghost" style={{padding:'11px',justifyContent:'center',fontSize:12}}
                  onClick={()=>setShowWalletModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-green" style={{padding:'11px',justifyContent:'center',fontSize:12,fontWeight:900}}
                  onClick={saveWalletConfig}>
                  <CheckCircle2 size={14}/> SET WALLET BALANCE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ Live Broker Settings Modal ══════════════════════ */}
      {showBrokerModal && (
        <div style={{
          position:'fixed',inset:0,zIndex:1000,
          background:'rgba(2, 4, 10, 0.85)',backdropFilter:'blur(12px)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:16
        }}>
          <div className="panel glow-card" style={{
            width:440,overflow:'hidden',
            boxShadow:'0 24px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Server size={18} style={{color:'var(--cyan)'}}/>
                <span style={{fontWeight:800,fontSize:14}}>REAL BROKER INTEGRATION (XM / MT4 / MT5)</span>
              </div>
              <button onClick={()=>setShowBrokerModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:2}}>
                <X size={18}/>
              </button>
            </div>
            <div style={{padding:'18px',display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:6}}>TRADING MODE</label>
                <div style={{display:'flex',gap:10}}>
                  <button className={clsx('btn', brokerMode==='PAPER'?'btn-green':'btn-ghost')}
                    style={{flex:1,justifyContent:'center',padding:'10px'}}
                    onClick={()=>setBrokerMode('PAPER')}>
                    📄 PAPER ($5 USD)
                  </button>
                  <button className={clsx('btn', brokerMode==='LIVE_BROKER'?'btn-red':'btn-ghost')}
                    style={{flex:1,justifyContent:'center',padding:'10px'}}
                    onClick={()=>setBrokerMode('LIVE_BROKER')}>
                    🔴 REAL BROKER
                  </button>
                </div>
              </div>

              {brokerMode === 'LIVE_BROKER' && (
                <>
                  <div>
                    <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>BROKER API TYPE</label>
                    <select value={brokerType} onChange={e=>setBrokerType(e.target.value)}
                      style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,padding:'10px',color:'var(--text-primary)',fontSize:12,outline:'none'}}>
                      <option value="XM_METAAPI">XM Broker (via MetaTrader 4/5 MetaApi REST API)</option>
                      <option value="WEBHOOK">Universal Webhook (PineConnector / MT4/MT5 EA)</option>
                    </select>
                  </div>

                  {brokerType === 'XM_METAAPI' && (
                    <>
                      <div style={{background:'rgba(0, 242, 254, 0.05)',border:'1px solid rgba(0, 242, 254, 0.15)',borderRadius:8,padding:'10px',fontSize:11,color:'var(--text-secondary)',lineHeight:1.5}}>
                        <strong>XM360 / XM Broker Setup:</strong><br/>
                        XM operates via MetaTrader 4 & 5. We use <strong style={{color:'var(--cyan)'}}>MetaApi.cloud</strong> (free tier available) to securely bridge AI signals directly into your XM MT4/MT5 account for BTC & XAU (GOLD).
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>METAAPI AUTH TOKEN</label>
                        <input type="password" value={metaApiToken} onChange={e=>setMetaApiToken(e.target.value)} placeholder="Paste token from MetaApi.cloud"
                          style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,padding:'10px',color:'var(--text-primary)',fontSize:12,fontFamily:'var(--font-mono)',outline:'none'}}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>METAAPI ACCOUNT ID</label>
                        <input type="text" value={metaAccountId} onChange={e=>setMetaAccountId(e.target.value)} placeholder="e.g. 5d8f2b3c-9a4e-..."
                          style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,padding:'10px',color:'var(--text-primary)',fontSize:12,fontFamily:'var(--font-mono)',outline:'none'}}/>
                      </div>
                    </>
                  )}

                  {brokerType === 'WEBHOOK' && (
                    <div>
                      <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',display:'block',marginBottom:4}}>WEBHOOK SIGNAL URL</label>
                      <input type="text" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} placeholder="https://your-mt5-ea-webhook.com/trade"
                        style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,padding:'10px',color:'var(--text-primary)',fontSize:12,fontFamily:'var(--font-mono)',outline:'none'}}/>
                    </div>
                  )}
                </>
              )}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:6}}>
                <button className="btn btn-ghost" style={{padding:'11px',justifyContent:'center',fontSize:12}}
                  onClick={()=>setShowBrokerModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-green" style={{padding:'11px',justifyContent:'center',fontSize:12,fontWeight:900}}
                  onClick={saveBrokerConfig}>
                  <CheckCircle2 size={14}/> SAVE CONFIG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ Manual Trade Modal ══════════════════════ */}
      {showTrade && (
        <div style={{
          position:'fixed',inset:0,zIndex:1000,
          background:'rgba(2, 4, 10, 0.82)',backdropFilter:'blur(10px)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:16
        }}>
          <div className="panel glow-card" style={{
            width:380,overflow:'hidden',
            boxShadow:'0 24px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontWeight:800,fontSize:14}}>MANUAL PAPER {showTrade} ORDER — {sym}</span>
              <button onClick={()=>setShowTrade(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-secondary)',padding:2}}>
                <X size={18}/>
              </button>
            </div>
            <div style={{padding:'18px'}}>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>CURRENT MARKET PRICE</div>
                <div className="mono" style={{fontSize:24,fontWeight:900}}>${P.price?.toLocaleString()}</div>
                <div style={{display:'flex',gap:6,marginTop:4}}>
                  <span className={`tag ${isUp?'tag-green':'tag-red'}`} style={{fontSize:10}}>
                    {isUp?'+':''}{fmt(P.change24h,2)}% Today
                  </span>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,padding:'10px'}}>
                  <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:700,marginBottom:4}}>TARGET +{fmt((strat.targetProfitPct||0.035)*100,1)}%</div>
                  <div className="mono" style={{fontSize:13,fontWeight:800,color:'var(--green)'}}>
                    ${((P.price||0)*(1+(strat.targetProfitPct||0.035))).toFixed(2)}
                  </div>
                </div>
                <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,padding:'10px'}}>
                  <div style={{fontSize:9,color:'var(--text-tertiary)',fontWeight:700,marginBottom:4}}>STOP -{fmt((strat.stopLossPct||0.015)*100,1)}%</div>
                  <div className="mono" style={{fontSize:13,fontWeight:800,color:'var(--red)'}}>
                    ${((P.price||0)*(1-(strat.stopLossPct||0.015))).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,fontWeight:800,color:'var(--text-tertiary)',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6}}>
                  ALLOCATION (USD) — Available Cash: ${fmt(port.cashBalance||5,2)}
                </label>
                <input
                  type="number" step="0.10" min="0.20" max={fmt(port.cashBalance||5,2)}
                  value={tradeAmt}
                  onChange={e=>setTradeAmt(e.target.value)}
                  style={{
                    width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',
                    borderRadius:8,padding:'12px',color:'var(--text-primary)',
                    fontSize:16,fontFamily:'var(--font-mono)',fontWeight:800,outline:'none'
                  }}
                />
                <div style={{fontSize:10,color:'var(--text-tertiary)',marginTop:6}}>
                  ≈ {(parseFloat(tradeAmt||0)/(P.price||1)).toFixed(6)} {sym} at market rate
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <button className="btn btn-ghost" style={{padding:'11px',justifyContent:'center',fontSize:12}}
                  onClick={()=>setShowTrade(null)}>
                  Cancel
                </button>
                <button
                  className={`btn ${showTrade==='BUY'?'btn-green':'btn-red'}`}
                  style={{padding:'11px',justifyContent:'center',fontSize:12,fontWeight:900}}
                  onClick={()=>{
                    api('/api/manual-trade',{symbol:sym,side:showTrade,amountUSD:parseFloat(tradeAmt||1.5)})
                      .then(()=>{ setShowTrade(null); msg(`✅ ${showTrade} ${sym} Order Placed`); });
                  }}>
                  <Send size={14}/> EXECUTE {showTrade}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Animated Toast Alert */}
      {toast && (
        <div style={{
          position:'fixed',bottom:24,right:24,zIndex:9999,
          background:'var(--bg-surface-solid)',border:'1px solid var(--border-glow)',
          borderRadius:10,padding:'12px 20px',fontSize:13,fontWeight:700,
          boxShadow:'0 10px 30px rgba(0, 242, 254, 0.25)',
          display:'flex',alignItems:'center',gap:10,
          color:'var(--text-primary)',backdropFilter:'blur(16px)'
        }}>
          <Zap size={15} style={{color:'var(--cyan)',animation:'neonPulse 1s infinite'}}/>
          {toast}
        </div>
      )}
    </div>
  );
}
