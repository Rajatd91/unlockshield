import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, BarChart3, BookOpen, Building2, Check, ChevronRight, Clock,
  Database, ExternalLink, Gauge, Globe2, Layers, Lock, Mail, Menu, MessageSquare,
  Play, Radar, Shield, Sparkles, Target, TrendingDown, Wallet, X, Zap
} from 'lucide-react'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Customers', to: '/customers' },
  { label: 'Resources', to: '/resources' },
  { label: 'Contact', to: '/contact' },
]

const eventFamilies = [
  ['Token unlocks', 'Supply shocks from cliffs, vesting and investor releases', Lock, 'amber'],
  ['Macro regime', 'Fear & Greed, dominance, rates and risk-on/off context', Globe2, 'violet'],
  ['Whale flows', 'Exchange deposits, large transfers and liquidity pressure', Radar, 'rose'],
  ['DEX microstructure', 'Pool volume spikes, slippage stress and liquidity migration', BarChart3, 'cyan'],
  ['Stablecoin stress', 'Supply contraction, depeg risk and funding liquidity', Database, 'emerald'],
  ['Liquidation cascades', 'Lending unwind risk and forced seller detection', TrendingDown, 'red'],
]

const featureCards = [
  {
    icon: Radar,
    title: 'Multi-event risk radar',
    body: 'Ingests unlock schedules, macro state, whale movement, stablecoin flows, DEX anomalies and liquidation pressure into one risk stream.',
  },
  {
    icon: Gauge,
    title: 'RS-GARCH Monte Carlo engine',
    body: 'Stress-tests AMM wrappers and LP positions with regime-aware volatility, jump shocks, VaR, CVaR and loss probability.',
  },
  {
    icon: Shield,
    title: 'Verifiable prediction oracle',
    body: 'Commits forecasts before events resolve, reveals outcomes later, and builds a public reputation layer for risk skill.',
  },
  {
    icon: Wallet,
    title: 'Policy-bound capital actions',
    body: 'Recommends bounded actions such as pause, hedge, widen range or reduce exposure instead of unbounded black-box trading.',
  },
]

const caseStudies = [
  {
    name: 'L2 Treasury Desk',
    metric: '31%',
    label: 'lower modeled drawdown',
    body: 'Simulated unlock windows across ARB and OP treasury exposure, identifying when policy caps should tighten before supply shocks.',
  },
  {
    name: 'AMM LP Research Lab',
    metric: '10k',
    label: 'paths per scenario',
    body: 'Compared narrow, medium and wide LP wrappers under volatility jumps to estimate impermanent-loss robustness.',
  },
  {
    name: 'DeFi Risk Team',
    metric: '8',
    label: 'event families monitored',
    body: 'Unified macro, on-chain and market microstructure events into one dashboard for pre-trade risk reviews.',
  },
]

const posts = [
  ['Research note', 'Why DeFi needs verifiable stress oracles, not another trading bot', 'How forecast commitments create a public risk-skill layer for onchain capital.'],
  ['Guide', 'Token unlocks as volatility jumps in AMM wrapper simulations', 'A practical framework for turning known supply events into stress parameters.'],
  ['Market brief', 'From static LP ranges to adaptive wrapper policy', 'Where RS-GARCH Monte Carlo fits into next-generation liquidity management.'],
]

function navigate(to) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function SmartLink({ to, className = '', children }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (to.startsWith('/')) {
          e.preventDefault()
          navigate(to)
        }
      }}
    >
      {children}
    </a>
  )
}

function Logo() {
  return (
    <SmartLink to="/" className="site-logo" aria-label="UnlockShield home">
      <span className="site-logo-mark"><Shield size={20} /></span>
      <span>Unlock<span>Shield</span></span>
    </SmartLink>
  )
}

function Layout({ route, children }) {
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [route])

  return (
    <div className="site">
      <header className="site-nav">
        <Logo />
        <nav className="site-nav-links">
          {navItems.map((item) => (
            <SmartLink key={item.to} to={item.to} className={route === item.to ? 'active' : ''}>{item.label}</SmartLink>
          ))}
        </nav>
        <div className="site-nav-actions">
          <SmartLink to="/login" className="ghost-btn">Login</SmartLink>
          <SmartLink to="/get-started" className="primary-btn">Get Started <ArrowRight size={15} /></SmartLink>
          <button className="mobile-menu-btn" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
        </div>
      </header>
      {open && (
        <div className="mobile-panel">
          <div className="mobile-panel-head"><Logo /><button onClick={() => setOpen(false)}><X size={20} /></button></div>
          {navItems.map((item) => <SmartLink key={item.to} to={item.to}>{item.label}<ChevronRight size={16} /></SmartLink>)}
          <SmartLink to="/login">Login<ChevronRight size={16} /></SmartLink>
          <SmartLink to="/get-started" className="mobile-primary">Get Started<ChevronRight size={16} /></SmartLink>
        </div>
      )}
      <main>{children}</main>
      <Footer />
    </div>
  )
}

function ProductMockup() {
  return (
    <div className="product-stage" aria-label="UnlockShield product preview">
      <div className="product-toolbar">
        <div><b>Risk Radar</b><span>Live DeFi stress state</span></div>
        <button>Run Scenario</button>
      </div>
      <div className="product-grid">
        <div className="product-left">
          <div className="threat-card">
            <span>Elevated Threat</span>
            <strong>62</strong>
            <p>ARB supply shock window</p>
          </div>
          {eventFamilies.slice(0, 4).map(([title, body, Icon, tone]) => (
            <div className="signal-row" key={title}>
              <span className={`mini-ic ${tone}`}><Icon size={15} /></span>
              <div><b>{title}</b><p>{body}</p></div>
              <small>{title === 'Token unlocks' ? 'High' : 'Med'}</small>
            </div>
          ))}
        </div>
        <div className="product-right">
          <div className="gauge-card">
            <div className="ring"><span>VaR</span><b>-19.6%</b></div>
            <p>2,000 RS-GARCH MC paths</p>
          </div>
          <div className="metric-row"><span>Confidence</span><b>65%</b></div>
          <div className="metric-row"><span>Policy action</span><b>Full exit</b></div>
          <div className="commit-card"><Lock size={15} /> Commit hash prepared for Kite</div>
        </div>
      </div>
    </div>
  )
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> Verifiable DeFi Stress Oracle</div>
          <h1>Risk infrastructure for onchain capital before the shock hits.</h1>
          <p>
            UnlockShield monitors market-moving events, stress-tests AMM wrappers with regime-aware Monte Carlo simulation,
            and commits forecasts on Kite so risk decisions can be audited later.
          </p>
          <div className="hero-actions">
            <SmartLink to="/get-started" className="primary-btn big">Start Free Analysis <ArrowRight size={17} /></SmartLink>
            <SmartLink to="/app" className="ghost-btn big"><Play size={16} /> Launch Product</SmartLink>
          </div>
          <div className="trust-strip">
            <span>Built for Kite AI Hackathon</span>
            <span>RS-GARCH MC engine</span>
            <span>Onchain forecast proof</span>
          </div>
        </div>
        <ProductMockup />
      </section>
      <LogoCloud />
      <section className="section">
        <SectionHeader kicker="Product" title="From event detection to verifiable capital policy." body="A cleaner workflow for risk teams, LPs and builders who need more than price charts." />
        <FeatureGrid />
      </section>
      <section className="split-section">
        <div>
          <div className="eyebrow">Why it matters</div>
          <h2>DeFi users see prices. They rarely see the stress path.</h2>
          <p>UnlockShield turns known events into explicit volatility shocks, then tests how portfolios and AMM wrappers behave under thousands of possible futures.</p>
          <ul className="check-list">
            <li><Check size={16} /> Detect supply, liquidity and macro catalysts.</li>
            <li><Check size={16} /> Quantify downside using VaR, CVaR and LP loss metrics.</li>
            <li><Check size={16} /> Build a public scorecard for forecast quality.</li>
          </ul>
        </div>
        <div className="analytics-panel">
          <div className="panel-row"><span>Static LP range</span><b className="red">-14.8%</b></div>
          <div className="panel-row"><span>Adaptive policy</span><b className="green">-6.1%</b></div>
          <div className="bar-stack"><span style={{ width: '82%' }} /><span style={{ width: '39%' }} /></div>
          <p>Scenario: investor unlock + defensive market regime + falling stablecoin liquidity.</p>
        </div>
      </section>
      <CustomersPreview />
      <CTA />
    </>
  )
}

function LogoCloud() {
  return (
    <section className="logo-cloud">
      <span>Designed for workflows around</span>
      {['Kite AI', 'AMM LPs', 'DAO Treasuries', 'Risk Teams', 'DeFi Researchers'].map((x) => <b key={x}>{x}</b>)}
    </section>
  )
}

function SectionHeader({ kicker, title, body }) {
  return (
    <div className="section-head">
      <span>{kicker}</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  )
}

function FeatureGrid() {
  return (
    <div className="feature-grid">
      {featureCards.map(({ icon: Icon, title, body }) => (
        <div className="feature-card" key={title}>
          <span><Icon size={20} /></span>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
      ))}
    </div>
  )
}

function Features() {
  return (
    <PageShell
      kicker="Features"
      title="A full-stack risk workflow, not a black-box trading bot."
      body="The platform combines event intelligence, stochastic stress testing, bounded policy recommendations and verifiable prediction scoring."
    >
      <FeatureGrid />
      <section className="section tight">
        <SectionHeader kicker="Event coverage" title="Eight families of market-moving risk." body="Each event type changes either base volatility, jump probability, action constraints or confidence scoring." />
        <div className="event-family-grid">
          {eventFamilies.map(([title, body, Icon, tone]) => (
            <div className="event-family" key={title}>
              <span className={`mini-ic ${tone}`}><Icon size={18} /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function About() {
  return (
    <PageShell kicker="About" title="A research-grade product born from DeFi volatility stress testing." body="UnlockShield is built around a simple belief: risk intelligence should be measurable, explainable and publicly verifiable.">
      <div className="story-grid">
        <div className="story-card big">
          <h2>The thesis</h2>
          <p>Crypto does not move like a smooth textbook chart. It jumps around events: unlocks, liquidations, whale flows, policy news and liquidity migrations. UnlockShield models those jumps directly, then asks what they do to real DeFi capital.</p>
        </div>
        <div className="story-card"><b>Academic core</b><p>Stress testing AMM wrappers under realistic market volatility.</p></div>
        <div className="story-card"><b>Startup wedge</b><p>A verifiable DeFi stress oracle consumed by users, wrappers, vaults and DAOs.</p></div>
      </div>
      <div className="timeline">
        {['Hackathon MVP', 'Live prediction scorecard', 'Wrapper control policies', 'Risk oracle network'].map((x, i) => (
          <div key={x}><span>{i + 1}</span><b>{x}</b><p>{['Working product demo on Kite AI.', 'Track forecast quality over real market windows.', 'Bounded actions for LP ranges and vaults.', 'Composable risk states for DeFi protocols.'][i]}</p></div>
        ))}
      </div>
    </PageShell>
  )
}

function Pricing() {
  const plans = [
    ['Researcher', 'Free', 'For students and builders validating strategies.', ['Market radar', 'Stress previews', 'Public resources']],
    ['Pro', '$49/mo', 'For active DeFi users and LPs.', ['Portfolio monitoring', 'Advanced stress tests', 'Prediction history', 'Priority data refresh']],
    ['Protocol', 'Custom', 'For DAOs, treasuries and vault teams.', ['Risk oracle API', 'Custom event weights', 'Governance reporting', 'Integration support']],
  ]
  return (
    <PageShell kicker="Pricing" title="Start with research. Scale into infrastructure." body="Simple pricing for users now, protocol-grade integrations later.">
      <div className="pricing-grid">
        {plans.map(([name, price, body, items], i) => (
          <div className={`price-card ${i === 1 ? 'featured' : ''}`} key={name}>
            <h3>{name}</h3>
            <strong>{price}</strong>
            <p>{body}</p>
            <ul>{items.map((x) => <li key={x}><Check size={15} /> {x}</li>)}</ul>
            <SmartLink to={i === 2 ? '/contact' : '/get-started'} className={i === 1 ? 'primary-btn' : 'ghost-btn'}>{i === 2 ? 'Talk to us' : 'Get started'} <ArrowRight size={15} /></SmartLink>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

function CustomersPreview() {
  return (
    <section className="section">
      <SectionHeader kicker="Use cases" title="Built for the people who manage onchain risk." body="The product story is broad enough for a startup, while the hackathon demo stays focused and working." />
      <div className="case-grid">{caseStudies.map((c) => <CaseCard key={c.name} {...c} />)}</div>
    </section>
  )
}

function Customers() {
  return (
    <PageShell kicker="Customers" title="Case studies for the next generation of DeFi risk teams." body="Representative examples of how UnlockShield creates value for LPs, treasuries and protocol operators.">
      <div className="case-grid">{caseStudies.map((c) => <CaseCard key={c.name} {...c} />)}</div>
      <div className="quote-card">
        <MessageSquare size={22} />
        <p>“The valuable thing is not another buy/sell signal. It is a verifiable process for deciding when capital should become more defensive.”</p>
        <b>Early protocol advisor</b>
      </div>
    </PageShell>
  )
}

function CaseCard({ name, metric, label, body }) {
  return <div className="case-card"><span>{name}</span><strong>{metric}</strong><small>{label}</small><p>{body}</p></div>
}

function Resources() {
  return (
    <PageShell kicker="Resources" title="Research, guides and market intelligence." body="Clear writing for builders who want to understand the risk engine, not just use it.">
      <div className="resource-grid">
        {posts.map(([type, title, body]) => (
          <article className="resource-card" key={title}>
            <span>{type}</span>
            <h3>{title}</h3>
            <p>{body}</p>
            <SmartLink to="/contact">Read preview <ArrowRight size={14} /></SmartLink>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

function Contact() {
  return (
    <PageShell kicker="Contact" title="Talk to us about DeFi risk, LP stress testing or protocol integrations." body="Use this page for investor interest, hackathon judges, collaborators and early users.">
      <div className="contact-grid">
        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Thanks — demo form captured locally. Connect this to email after the hackathon.') }}>
          <label>Name<input placeholder="Rajat Durge" /></label>
          <label>Email<input placeholder="you@example.com" /></label>
          <label>What are you building?<textarea placeholder="Tell us about your protocol, treasury or research use case." /></label>
          <button className="primary-btn" type="submit">Send message <Mail size={15} /></button>
        </form>
        <div className="contact-card">
          <h3>For the hackathon</h3>
          <p>Judges can launch the working product, inspect the API, and review Kite integration details from the app route.</p>
          <SmartLink to="/app" className="ghost-btn">Open live product <ExternalLink size={15} /></SmartLink>
        </div>
      </div>
    </PageShell>
  )
}

function Login() {
  return (
    <PageShell kicker="Login" title="Welcome back." body="A polished placeholder login flow for the startup site. The hackathon app remains accessible from Launch Product.">
      <AuthCard mode="login" />
    </PageShell>
  )
}

function GetStarted() {
  return (
    <PageShell kicker="Get Started" title="Run your first stress review in minutes." body="Choose a token, inspect risk events, then launch the working product dashboard.">
      <AuthCard mode="signup" />
    </PageShell>
  )
}

function AuthCard({ mode }) {
  return (
    <div className="auth-card">
      <label>Email<input placeholder="you@example.com" /></label>
      <label>Password<input type="password" placeholder="••••••••" /></label>
      {mode === 'signup' && <label>Use case<input placeholder="LP strategy, treasury, research, protocol risk..." /></label>}
      <SmartLink to="/app" className="primary-btn">{mode === 'signup' ? 'Create workspace' : 'Login'} <ArrowRight size={15} /></SmartLink>
      <p>{mode === 'signup' ? 'No credit card needed for the hackathon demo.' : 'Demo login opens the product route.'}</p>
    </div>
  )
}

function PageShell({ kicker, title, body, children }) {
  return (
    <section className="page-shell">
      <div className="page-hero">
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      {children}
    </section>
  )
}

function CTA() {
  return (
    <section className="cta">
      <div>
        <span>Ready for the demo?</span>
        <h2>Launch the product and run the stress engine.</h2>
      </div>
      <SmartLink to="/app" className="primary-btn big">Launch App <ArrowRight size={17} /></SmartLink>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <Logo />
      <p>Verifiable DeFi Stress Oracle for event-driven onchain risk.</p>
      <div>
        <SmartLink to="/features">Features</SmartLink>
        <SmartLink to="/pricing">Pricing</SmartLink>
        <SmartLink to="/contact">Contact</SmartLink>
        <SmartLink to="/app">Launch App</SmartLink>
      </div>
    </footer>
  )
}

function StartupSite() {
  const [route, setRoute] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const Page = useMemo(() => ({
    '/': Home,
    '/about': About,
    '/features': Features,
    '/pricing': Pricing,
    '/customers': Customers,
    '/resources': Resources,
    '/contact': Contact,
    '/login': Login,
    '/get-started': GetStarted,
  }[route] || Home), [route])

  return <Layout route={route}><Page /></Layout>
}

export default StartupSite
