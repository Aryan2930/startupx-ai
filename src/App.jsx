import React, { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Sparkles, TrendingUp, Users, Target, DollarSign, Rocket, Palette,
  ShieldAlert, Mic, ArrowRight, Loader2, Moon, Sun, ChevronRight,
  Brain, Building2, Zap, LayoutDashboard, MapPin, Compass, Wallet,
  Layers, AlertTriangle, CheckCircle2, RefreshCw,
  Copy, Check
} from "lucide-react";
import "./styles/theme.css";
import { CALL_DEFS, generateReport, regenerateSections } from "./lib/api.js";

/* ------------------------------- SMALL PARTS ------------------------------- */

function ScoreDial({ value = 0, label = "Startup score", size = 180 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 150);
    return () => clearTimeout(t);
  }, [value]);
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(animated, 0), 100) / 100) * circ;
  const color = animated >= 75 ? "var(--sx-green)" : animated >= 50 ? "var(--sx-cyan)" : animated >= 30 ? "var(--sx-amber)" : "var(--sx-red)";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--sx-border)" strokeWidth="12" fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="12" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1), stroke 0.6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="sx-display" style={{ fontSize: size * 0.24, fontWeight: 700, lineHeight: 1 }}>{Math.round(animated)}</div>
        <div style={{ fontSize: 11, color: "var(--sx-text-dim)", marginTop: 6, textAlign: "center", maxWidth: size * 0.7 }}>{label}</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="sx-card sx-rise" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: "var(--sx-text-dim)", fontWeight: 500 }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: accent ? `${accent}22` : "var(--sx-glass)" }}>
          <Icon size={15} color={accent || "var(--sx-violet)"} />
        </div>
      </div>
      <div className="sx-display" style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--sx-text-faint)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc, onRegenerate, regenerating, regenerateError }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--sx-grad)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} color="#fff" />
        </div>
        <div>
          <h2 className="sx-display" style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{title}</h2>
          {desc && <p style={{ fontSize: 13, color: "var(--sx-text-dim)", margin: "3px 0 0" }}>{desc}</p>}
        </div>
      </div>
      {onRegenerate && (
        <div style={{ textAlign: "right" }}>
          <button className="sx-btn-ghost" onClick={onRegenerate} disabled={regenerating} style={{ padding: "8px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} style={{ animation: regenerating ? "sx-spin 0.9s linear infinite" : "none" }} />
            {regenerating ? "Regenerating…" : "Regenerate this section"}
          </button>
          {regenerateError && <div style={{ fontSize: 11.5, color: "var(--sx-red)", marginTop: 6, maxWidth: 220 }}>{regenerateError}</div>}
        </div>
      )}
    </div>
  );
}

function Pill({ children, tone = "violet" }) {
  const map = {
    violet: { bg: "rgba(138,108,255,0.15)", fg: "var(--sx-violet)" },
    cyan: { bg: "rgba(34,217,200,0.15)", fg: "var(--sx-cyan)" },
    green: { bg: "rgba(52,211,153,0.15)", fg: "var(--sx-green)" },
    amber: { bg: "rgba(245,166,35,0.15)", fg: "var(--sx-amber)" },
    red: { bg: "rgba(244,102,124,0.15)", fg: "var(--sx-red)" },
  };
  const c = map[tone] || map.violet;
  return <span className="sx-badge" style={{ background: c.bg, color: c.fg }}>{children}</span>;
}

/* --------------------------------- LANDING --------------------------------- */

const EXAMPLES = [
  "An AI-powered personal finance coach for gig workers in tier-2 India",
  "Hyperlocal quick-commerce for fresh vegetables in Indian metros",
  "Vernacular-language EdTech app for competitive exam prep",
  "B2B SaaS that automates GST and compliance for Indian startups",
];

const INDIA_SECTORS = [
  "Fintech", "EdTech", "Agritech", "D2C & quick commerce",
  "HealthTech", "SaaS", "Logistics & mobility", "ClimateTech",
];

function Landing({ theme, toggleTheme, onGenerate }) {
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("India");
  const [audience, setAudience] = useState("");
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [team, setTeam] = useState("");
  const [stage, setStage] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recogRef.current = recog;
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (e) => setIdea((prev) => (prev ? prev + " " : "") + e.results[0][0].transcript);
    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.start();
  };

  const canSubmit = idea.trim().length > 6;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div className="sx-mesh">
        <div className="sx-grid-overlay" />
        <div className="sx-blob" style={{ width: 520, height: 520, background: "var(--sx-violet)", top: -140, left: -120, animation: "sx-float1 16s ease-in-out infinite" }} />
        <div className="sx-blob" style={{ width: 420, height: 420, background: "var(--sx-cyan)", bottom: -140, right: -100, animation: "sx-float2 18s ease-in-out infinite" }} />
        <div className="sx-blob" style={{ width: 300, height: 300, background: "var(--sx-amber)", top: "35%", right: "12%", opacity: 0.14, animation: "sx-float1 22s ease-in-out infinite" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "28px 24px 100px" }}>
        {/* nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--sx-grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="sx-display" style={{ fontWeight: 700, fontSize: 16 }}>StartupX AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="sx-btn-ghost" onClick={toggleTheme} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* hero */}
        <div className="sx-rise" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Pill tone="violet">Under 30 second report</Pill>
          </div>
          <h1 className="sx-display" style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 700, lineHeight: 1.08, margin: "0 0 16px" }}>
            Evaluate any startup idea<br /><span className="sx-grad-text">from every angle.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--sx-text-dim)", maxWidth: 560, margin: "0 auto" }}>
            Market sizing, competitors, financial forecasts, funding strategy, brand and go-to-market — generated live by AI.
          </p>
        </div>

        {/* input card */}
        <div className="sx-glass sx-rise" style={{ padding: 22, marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <textarea
              className="sx-textarea"
              rows={3}
              placeholder="Describe your startup idea in a sentence or two..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (idea.trim().length > 6) {
                    onGenerate({ idea, industry, country, audience, model, budget, timeline, team, stage });
                  }
                }
              }}
              style={{ resize: "none", paddingRight: 46 }}
            />
            <button
              onClick={startVoice}
              className="sx-btn-ghost"
              aria-label="Voice input"
              style={{ position: "absolute", right: 10, top: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, animation: listening ? "sx-pulse 1s ease-in-out infinite" : "none" }}
            >
              <Mic size={14} color={listening ? "var(--sx-red)" : "var(--sx-text-dim)"} />
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {EXAMPLES.map((ex) => (
              <div key={ex} className="sx-chip" onClick={() => setIdea(ex)}>{ex}</div>
            ))}
          </div>

          <div style={{ margin: "16px 0 0" }}>
            <div style={{ fontSize: 11.5, color: "var(--sx-text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              Popular sectors in India
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INDIA_SECTORS.map((s) => (
                <div
                  key={s}
                  className="sx-chip"
                  style={{ borderColor: industry === s ? "var(--sx-violet)" : undefined, color: industry === s ? "var(--sx-text)" : undefined }}
                  onClick={() => { setIndustry(s); setCountry("India"); setShowMore(true); }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="sx-btn-ghost" style={{ fontSize: 12.5, padding: "8px 12px" }} onClick={() => setShowMore((s) => !s)}>
              {showMore ? "Hide details" : "Add context for a sharper report"} <ChevronRight size={12} style={{ display: "inline", verticalAlign: -1, transform: showMore ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
            </button>
          </div>

          {showMore && (
            <div className="sx-rise" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 10, marginTop: 14 }}>
              <input className="sx-input" placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
              <input className="sx-input" placeholder="Country / market" value={country} onChange={(e) => setCountry(e.target.value)} />
              <input className="sx-input" placeholder="Target audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
              <input className="sx-input" placeholder="Business model" value={model} onChange={(e) => setModel(e.target.value)} />
              <input className="sx-input" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} />
              <input className="sx-input" placeholder="Timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
              <input className="sx-input" placeholder="Team size" value={team} onChange={(e) => setTeam(e.target.value)} />
              <input className="sx-input" placeholder="Stage (idea, MVP, launched...)" value={stage} onChange={(e) => setStage(e.target.value)} />
            </div>
          )}

          <button
            className="sx-btn-primary"
            disabled={!canSubmit}
            style={{ width: "100%", padding: "14px 0", marginTop: 18, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={() => onGenerate({ idea, industry, country, audience, model, budget, timeline, team, stage })}
          >
            Generate full report <ArrowRight size={16} />
          </button>
        </div>

        {/* trending strip */}
        <div className="sx-rise" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center", fontSize: 12.5, color: "var(--sx-text-faint)" }}>
          <TrendingUp size={13} />
          <span>Trending today:</span>
          {["Fintech for Bharat", "D2C personal care brands", "AgriTech supply chains", "Vernacular creator commerce"].map((t) => (
            <span key={t} className="sx-chip" style={{ padding: "5px 12px" }} onClick={() => setIdea(t)}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- LOADING ---------------------------------- */

function LoadingScreen({ idea, progress }) {
  const total = CALL_DEFS.length;
  const pct = Math.round((progress / total) * 100);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <div className="sx-mesh">
        <div className="sx-blob" style={{ width: 460, height: 460, background: "var(--sx-violet)", top: "20%", left: "20%", animation: "sx-float1 10s ease-in-out infinite" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 480, width: "100%" }}>
        <div style={{ width: 74, height: 74, borderRadius: 20, margin: "0 auto 28px", background: "var(--sx-grad)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 50px -12px rgba(108,76,255,0.6)" }}>
          <Loader2 size={30} color="#fff" style={{ animation: "sx-spin 1.1s linear infinite" }} />
        </div>
        <h2 className="sx-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Analyzing your idea</h2>
        <p style={{ fontSize: 13.5, color: "var(--sx-text-dim)", marginBottom: 24 }}>"{idea}"</p>

        <div style={{ height: 6, borderRadius: 999, background: "var(--sx-border)", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--sx-grad)", transition: "width .4s cubic-bezier(.16,1,.3,1)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
          {CALL_DEFS.map((c, i) => {
            const done = progress > i;
            return (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, opacity: done ? 1 : 0.4, transition: "opacity .3s ease" }}>
                {done ? <CheckCircle2 size={16} color="var(--sx-green)" /> : <Loader2 size={16} style={{ animation: "sx-spin 1s linear infinite" }} color="var(--sx-text-faint)" />}
                <span style={{ fontSize: 13.5 }}>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- REPORT ---------------------------------- */

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "market", label: "Market", icon: Compass },
  { key: "customers", label: "Customers", icon: Users },
  { key: "competitors", label: "Competitors", icon: Target },
  { key: "revenue", label: "Revenue & funding", icon: Wallet },
  { key: "roadmap", label: "Roadmap & stack", icon: Layers },
  { key: "brand", label: "Brand & marketing", icon: Palette },
  { key: "risk", label: "Risk", icon: ShieldAlert },
];

const CHART_COLORS = ["#8A6CFF", "#22D9C8", "#F5A623", "#F4667C", "#34D399"];

const TAB_SECTION_MAP = {
  market: ["overviewMarket"],
  customers: ["customersCompetitors"],
  competitors: ["customersCompetitors"],
  revenue: ["revenueFinancials"],
  roadmap: ["roadmapTechBrand"],
  brand: ["roadmapTechBrand", "marketingRisks"],
  risk: ["marketingRisks"],
};

/* ---------------------------- MARKDOWN EXPORT ---------------------------- */

function mdList(items, mapFn) {
  const arr = items || [];
  if (arr.length === 0) return "_None provided_";
  return arr.map((it) => `- ${mapFn ? mapFn(it) : it}`).join("\n");
}

function mdTable(headers, rows) {
  if (!rows || rows.length === 0) return "_None provided_";
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return [head, sep, body].join("\n");
}

function buildMarkdownReport(idea, d) {
  const m = d.market || {};
  const f = d.financials || {};
  const fund = d.funding || {};
  const b = d.branding || {};
  const mk = d.marketing || {};
  const swot = d.swot || {};

  const lines = [];
  lines.push(`# ${idea?.idea || "Startup idea report"}`);
  lines.push("");
  lines.push(`_Generated by StartupX AI_`);
  lines.push("");

  lines.push(`## Executive summary`);
  lines.push("");
  lines.push(d.executiveSummary || "_None provided_");
  lines.push("");
  lines.push(mdTable(
    ["Metric", "Value"],
    [
      ["Startup score", `${d.startupScore ?? "—"}`],
      ["Market readiness", `${d.marketReadiness || "—"}`],
      ["Investment attractiveness", `${d.investmentAttractiveness || "—"}`],
      ["Unicorn potential", `${d.unicornPotential ?? "—"}%`],
      ["Success probability", `${d.successProbability ?? "—"}%`],
      ["Risk score", `${d.riskScore ?? "—"}/100`],
      ["AI confidence", `${d.aiConfidence ?? "—"}%`],
    ]
  ));
  lines.push("");

  lines.push(`## Market research`);
  lines.push("");
  lines.push(mdTable(
    ["TAM", "SAM", "SOM", "CAGR"],
    [[m.tam || "—", m.sam || "—", m.som || "—", m.cagr || "—"]]
  ));
  lines.push("");
  lines.push(`**Key trends**`);
  lines.push("");
  lines.push(mdList(m.trends));
  lines.push("");

  lines.push(`## Customer analysis`);
  lines.push("");
  (d.personas || []).forEach((p) => {
    lines.push(`### ${p.name || "Persona"}${p.age ? ` (${p.age})` : ""}${p.occupation ? ` — ${p.occupation}` : ""}`);
    lines.push("");
    lines.push(`**Pain points**`);
    lines.push("");
    lines.push(mdList(p.painPoints));
    lines.push("");
    lines.push(`**Goals**`);
    lines.push("");
    lines.push(mdList(p.goals));
    lines.push("");
  });
  if (!(d.personas || []).length) lines.push("_None provided_", "");

  lines.push(`## Competitor analysis`);
  lines.push("");
  lines.push(mdTable(
    ["Company", "Funding", "Strength", "Weakness", "Market share"],
    (d.competitors || []).map((c) => [c.name || "—", c.funding || "—", c.strengths || "—", c.weaknesses || "—", `${c.marketShare ?? "—"}%`])
  ));
  lines.push("");
  lines.push(`**SWOT**`);
  lines.push("");
  ["strengths", "weaknesses", "opportunities", "threats"].forEach((k) => {
    lines.push(`_${k.charAt(0).toUpperCase() + k.slice(1)}_`);
    lines.push("");
    lines.push(mdList(swot[k]));
    lines.push("");
  });

  lines.push(`## Revenue, financials & funding`);
  lines.push("");
  lines.push(mdTable(
    ["Revenue model", "Estimate"],
    (d.revenueModels || []).map((r) => [r.model || "—", r.estimate || "—"])
  ));
  lines.push("");
  lines.push(mdTable(
    ["Burn rate", "Runway", "Break-even", "CAC", "LTV"],
    [[f.burnRate || "—", f.runwayMonths ? `${f.runwayMonths} mo` : "—", f.breakEvenMonth ? `Month ${f.breakEvenMonth}` : "—", f.cac || "—", f.ltv || "—"]]
  ));
  lines.push("");
  lines.push(`**Funding outlook**`);
  lines.push("");
  lines.push(`- Recommended round: ${fund.recommendedRound || "—"}`);
  lines.push(`- Estimated valuation: ${fund.estimatedValuation || "—"}`);
  lines.push(`- Investor types: ${(fund.investorTypes || []).join(", ") || "—"}`);
  lines.push("");

  lines.push(`## Product roadmap & tech stack`);
  lines.push("");
  (d.roadmap || []).forEach((r, i) => {
    lines.push(`${i + 1}. **${r.phase || "Phase"}** (${r.timeline || "—"}) — ${r.milestone || "—"}`);
  });
  if (!(d.roadmap || []).length) lines.push("_None provided_");
  lines.push("");
  lines.push(`**Recommended tech stack**`);
  lines.push("");
  lines.push(mdList(Object.entries(d.techStack || {}), ([k, v]) => `**${k}**: ${v}`));
  lines.push("");

  lines.push(`## Branding & marketing`);
  lines.push("");
  lines.push(`- Tagline: "${b.tagline || "—"}"`);
  lines.push(`- Mission: ${b.mission || "—"}`);
  lines.push(`- Name ideas: ${(b.names || []).join(", ") || "—"}`);
  lines.push(`- Colors: ${(b.colors || []).join(", ") || "—"}`);
  lines.push("");
  lines.push(`**Go-to-market**`);
  lines.push("");
  lines.push(mk.strategy || "_None provided_");
  lines.push("");
  lines.push(`Channels: ${(mk.channels || []).join(", ") || "—"}`);
  lines.push("");

  lines.push(`## Risk assessment`);
  lines.push("");
  lines.push(mdTable(
    ["Risk", "Severity", "Mitigation"],
    (d.risks || []).map((r) => [r.risk || "—", r.severity || "—", r.mitigation || "—"])
  ));
  lines.push("");

  return lines.join("\n");
}

function CopyMarkdownButton({ idea, data }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopy = async () => {
    const md = buildMarkdownReport(idea, data);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(md);
      } else {
        const ta = document.createElement("textarea");
        ta.value = md;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setFailed(true);
      setTimeout(() => setFailed(false), 2500);
    }
  };

  return (
    <button
      className="sx-btn-ghost"
      style={{ padding: "9px 16px", fontSize: 13, flexShrink: 0, display: "flex", alignItems: "center", gap: 7 }}
      onClick={handleCopy}
    >
      {copied ? <Check size={14} color="var(--sx-green)" /> : <Copy size={14} />}
      {copied ? "Copied!" : failed ? "Copy failed — try again" : "Copy report as Markdown"}
    </button>
  );
}

function Report({ idea, data, onReset, warning, onUpdateData }) {
  const [tab, setTab] = useState("overview");
  const [regeneratingTabs, setRegeneratingTabs] = useState({});
  const [regenerateErrors, setRegenerateErrors] = useState({});
  const d = data;

  const handleRegenerate = async (tabKey) => {
    const keys = TAB_SECTION_MAP[tabKey];
    if (!keys) return;
    setRegeneratingTabs((prev) => ({ ...prev, [tabKey]: true }));
    setRegenerateErrors((prev) => ({ ...prev, [tabKey]: "" }));
    try {
      const partial = await regenerateSections(idea, keys);
      onUpdateData(partial);
    } catch (e) {
      setRegenerateErrors((prev) => ({ ...prev, [tabKey]: e.message || "Regeneration failed — try again." }));
    } finally {
      setRegeneratingTabs((prev) => ({ ...prev, [tabKey]: false }));
    }
  };

  const regenProps = (tabKey) => ({
    onRegenerate: () => handleRegenerate(tabKey),
    regenerating: !!regeneratingTabs[tabKey],
    regenerateError: regenerateErrors[tabKey],
  });

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(16px)", background: "var(--sx-void)cc", borderBottom: "1px solid var(--sx-border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--sx-grad)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{idea.idea}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <CopyMarkdownButton idea={idea} data={d} />
            <button className="sx-btn-ghost" style={{ padding: "9px 16px", fontSize: 13, flexShrink: 0 }} onClick={onReset}>New idea</button>
          </div>
        </div>
        <div className="sx-scroll" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
          {TABS.map((t) => (
            <div key={t.key} className={`sx-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              <t.icon size={14} /> {t.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px 80px" }}>
        {warning && (
          <div className="sx-card sx-rise" style={{ padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10, borderColor: "rgba(245,166,35,0.4)" }}>
            <AlertTriangle size={16} color="var(--sx-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: "var(--sx-text-dim)" }}>{warning}</span>
          </div>
        )}
        {tab === "overview" && <OverviewTab d={d} idea={idea} />}
        {tab === "market" && <MarketTab d={d} {...regenProps("market")} />}
        {tab === "customers" && <CustomersTab d={d} {...regenProps("customers")} />}
        {tab === "competitors" && <CompetitorsTab d={d} {...regenProps("competitors")} />}
        {tab === "revenue" && <RevenueTab d={d} {...regenProps("revenue")} />}
        {tab === "roadmap" && <RoadmapTab d={d} {...regenProps("roadmap")} />}
        {tab === "brand" && <BrandTab d={d} {...regenProps("brand")} />}
        {tab === "risk" && <RiskTab d={d} {...regenProps("risk")} />}
      </div>
    </div>
  );
}

function OverviewTab({ d, idea }) {
  return (
    <div className="sx-rise">
      <div className="sx-glass" style={{ padding: 28, marginBottom: 24, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
        <ScoreDial value={d.startupScore ?? 0} label="Startup score" />
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <Pill tone="violet">{idea.stage || "Idea stage"}</Pill>
            <Pill tone="cyan">{d.marketReadiness || "—"} market readiness</Pill>
            <Pill tone={d.investmentAttractiveness === "High" ? "green" : d.investmentAttractiveness === "Low" ? "red" : "amber"}>{d.investmentAttractiveness || "—"} investment attractiveness</Pill>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--sx-text-dim)" }}>{d.executiveSummary}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14 }}>
        <MetricCard icon={Rocket} label="Unicorn potential" value={`${d.unicornPotential ?? 0}%`} accent="#8A6CFF" />
        <MetricCard icon={TrendingUp} label="Success probability" value={`${d.successProbability ?? 0}%`} accent="#22D9C8" />
        <MetricCard icon={AlertTriangle} label="Risk score" value={`${d.riskScore ?? 0}/100`} accent="#F5A623" />
        <MetricCard icon={Brain} label="AI confidence" value={`${d.aiConfidence ?? 0}%`} accent="#34D399" />
      </div>
    </div>
  );
}

function ChartCard({ title, children, height = 260 }) {
  return (
    <div className="sx-card sx-rise" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>{title}</h3>
      <div style={{ width: "100%", height }}>{children}</div>
    </div>
  );
}

function MarketTab({ d, onRegenerate, regenerating, regenerateError }) {
  const m = d.market || {};
  return (
    <div className="sx-rise" style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Compass} title="Market research" desc="Sizing, growth and trends" onRegenerate={onRegenerate} regenerating={regenerating} regenerateError={regenerateError} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14 }}>
        <MetricCard icon={Building2} label="TAM" value={m.tam || "—"} accent="#8A6CFF" />
        <MetricCard icon={Target} label="SAM" value={m.sam || "—"} accent="#22D9C8" />
        <MetricCard icon={MapPin} label="SOM" value={m.som || "—"} accent="#F5A623" />
        <MetricCard icon={TrendingUp} label="CAGR" value={m.cagr || "—"} accent="#34D399" />
      </div>
      <ChartCard title="Projected market growth">
        <ResponsiveContainer>
          <AreaChart data={m.growthChart || []}>
            <defs>
              <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8A6CFF" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#8A6CFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--sx-border)" vertical={false} />
            <XAxis dataKey="year" stroke="var(--sx-text-faint)" fontSize={12} />
            <YAxis stroke="var(--sx-text-faint)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--sx-panel-2)", border: "1px solid var(--sx-border)", borderRadius: 10, fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#8A6CFF" fill="url(#growthFill)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="sx-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Key trends</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(m.trends || []).map((t, i) => <Pill key={i} tone="cyan">{t}</Pill>)}
        </div>
      </div>
    </div>
  );
}

function CustomersTab({ d, onRegenerate, regenerating, regenerateError }) {
  return (
    <div className="sx-rise" style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Users} title="Customer analysis" desc="Who you're building for" onRegenerate={onRegenerate} regenerating={regenerating} regenerateError={regenerateError} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
        {(d.personas || []).map((p, i) => (
          <div key={i} className="sx-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--sx-grad)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>
                {(p.name || "?").slice(0,1)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--sx-text-dim)" }}>{p.age} · {p.occupation}</div>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, color: "var(--sx-text-faint)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Pain points</div>
              {(p.painPoints || []).map((pp, j) => <div key={j} style={{ fontSize: 13, marginBottom: 4 }}>• {pp}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--sx-text-faint)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Goals</div>
              {(p.goals || []).map((g, j) => <div key={j} style={{ fontSize: 13, marginBottom: 4 }}>• {g}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitorsTab({ d, onRegenerate, regenerating, regenerateError }) {
  const comps = d.competitors || [];
  const radarData = (d.swot ? ["strengths","weaknesses","opportunities","threats"] : []).map((k) => ({
    subject: k.charAt(0).toUpperCase() + k.slice(1),
    value: (d.swot[k] || []).length * 40,
  }));
  return (
    <div className="sx-rise" style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Target} title="Competitor analysis" desc="Landscape and positioning" onRegenerate={onRegenerate} regenerating={regenerating} regenerateError={regenerateError} />
      <div className="sx-card" style={{ padding: 20, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--sx-text-faint)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              <th style={{ padding: "0 10px 10px 0" }}>Company</th>
              <th style={{ padding: "0 10px 10px" }}>Funding</th>
              <th style={{ padding: "0 10px 10px" }}>Strength</th>
              <th style={{ padding: "0 10px 10px" }}>Weakness</th>
              <th style={{ padding: "0 0 10px 10px" }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {comps.map((c, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--sx-border)" }}>
                <td style={{ padding: "10px 10px 10px 0", fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: "10px" }}>{c.funding}</td>
                <td style={{ padding: "10px", color: "var(--sx-text-dim)" }}>{c.strengths}</td>
                <td style={{ padding: "10px", color: "var(--sx-text-dim)" }}>{c.weaknesses}</td>
                <td style={{ padding: "10px 0 10px 10px" }}>{c.marketShare}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, alignItems: "stretch" }}>
        <ChartCard title="Market share by player" height={240}>
          <ResponsiveContainer>
            <BarChart data={comps} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke="var(--sx-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--sx-text-faint)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="var(--sx-text-faint)" fontSize={11} width={90} />
              <Tooltip contentStyle={{ background: "var(--sx-panel-2)", border: "1px solid var(--sx-border)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="marketShare" radius={[0,6,6,0]}>
                {comps.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="sx-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>SWOT</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {["strengths","weaknesses","opportunities","threats"].map((k) => (
              <div key={k}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--sx-text-faint)", marginBottom: 6 }}>{k}</div>
                {((d.swot || {})[k] || []).map((v, i) => <div key={i} style={{ fontSize: 12.5, marginBottom: 4 }}>• {v}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueTab({ d, onRegenerate, regenerating, regenerateError }) {
  const f = d.financials || {};
  return (
    <div className="sx-rise" style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Wallet} title="Revenue, financials & funding" desc="How this business makes and manages money" onRegenerate={onRegenerate} regenerating={regenerating} regenerateError={regenerateError} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 14 }}>
        {(d.revenueModels || []).map((r, i) => (
          <div key={i} className="sx-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, color: "var(--sx-text-dim)", marginBottom: 6 }}>{r.model}</div>
            <div className="sx-display" style={{ fontSize: 20, fontWeight: 700 }}>{r.estimate}</div>
          </div>
        ))}
      </div>
      <ChartCard title="5-year financial forecast (₹ lakh)">
        <ResponsiveContainer>
          <LineChart data={f.forecastChart || []}>
            <CartesianGrid stroke="var(--sx-border)" vertical={false} />
            <XAxis dataKey="year" stroke="var(--sx-text-faint)" fontSize={12} />
            <YAxis stroke="var(--sx-text-faint)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--sx-panel-2)", border: "1px solid var(--sx-border)", borderRadius: 10, fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#34D399" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="expenses" stroke="#F4667C" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="profit" stroke="#8A6CFF" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14 }}>
        <MetricCard icon={DollarSign} label="Burn rate" value={f.burnRate || "—"} accent="#F4667C" />
        <MetricCard icon={Zap} label="Runway" value={f.runwayMonths ? `${f.runwayMonths} mo` : "—"} accent="#F5A623" />
        <MetricCard icon={TrendingUp} label="Break-even" value={f.breakEvenMonth ? `Month ${f.breakEvenMonth}` : "—"} accent="#34D399" />
        <MetricCard icon={Users} label="CAC" value={f.cac || "—"} accent="#8A6CFF" />
        <MetricCard icon={Target} label="LTV" value={f.ltv || "—"} accent="#22D9C8" />
      </div>
      <div className="sx-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Funding outlook</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <Pill tone="violet">{(d.funding || {}).recommendedRound || "—"}</Pill>
          <Pill tone="cyan">Est. valuation {(d.funding || {}).estimatedValuation || "—"}</Pill>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {((d.funding || {}).investorTypes || []).map((t, i) => <Pill key={i} tone="amber">{t}</Pill>)}
        </div>
      </div>
    </div>
  );
}

function RoadmapTab({ d, onRegenerate, regenerating, regenerateError }) {
  return (
    <div className="sx-rise" style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Layers} title="Product roadmap & tech stack" desc="From MVP to scale" onRegenerate={onRegenerate} regenerating={regenerating} regenerateError={regenerateError} />
      <div className="sx-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {(d.roadmap || []).map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 16, paddingBottom: i < (d.roadmap.length - 1) ? 20 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sx-grad)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                {i < (d.roadmap.length - 1) && <div style={{ width: 2, flex: 1, background: "var(--sx-border)", marginTop: 4 }} />}
              </div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.phase} <span style={{ fontWeight: 400, color: "var(--sx-text-faint)", fontSize: 12.5 }}>· {r.timeline}</span></div>
                <div style={{ fontSize: 13, color: "var(--sx-text-dim)", marginTop: 4 }}>{r.milestone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="sx-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Recommended tech stack</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
          {Object.entries(d.techStack || {}).map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: "var(--sx-text-faint)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandTab({ d, onRegenerate, regenerating, regenerateError }) {
  const b = d.branding || {};
  const mk = d.marketing || {};
  return (
    <div className="sx-rise" style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={Palette} title="Branding & marketing" desc="Identity and go-to-market" onRegenerate={onRegenerate} regenerating={regenerating} regenerateError={regenerateError} />
      <div className="sx-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(b.colors || []).map((c, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: c, border: "1px solid var(--sx-border)" }} title={c} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {(b.names || []).map((n, i) => <Pill key={i} tone="violet">{n}</Pill>)}
        </div>
        <p className="sx-display" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>"{b.tagline}"</p>
        <p style={{ fontSize: 13.5, color: "var(--sx-text-dim)" }}>{b.mission}</p>
      </div>
      <div className="sx-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Go-to-market</h3>
        <p style={{ fontSize: 13.5, color: "var(--sx-text-dim)", marginBottom: 12 }}>{mk.strategy}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(mk.channels || []).map((c, i) => <Pill key={i} tone="cyan">{c}</Pill>)}
        </div>
      </div>
    </div>
  );
}

function RiskTab({ d, onRegenerate, regenerating, regenerateError }) {
  const sevColor = { High: "red", Medium: "amber", Low: "green" };
  return (
    <div className="sx-rise" style={{ display: "grid", gap: 20 }}>
      <SectionTitle icon={ShieldAlert} title="Risk assessment" desc="What could go wrong, and how to handle it" onRegenerate={onRegenerate} regenerating={regenerating} regenerateError={regenerateError} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 14 }}>
        {(d.risks || []).map((r, i) => (
          <div key={i} className="sx-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.risk}</span>
              <Pill tone={sevColor[r.severity] || "amber"}>{r.severity}</Pill>
            </div>
            <p style={{ fontSize: 13, color: "var(--sx-text-dim)", margin: 0 }}>{r.mitigation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- APP ---------------------------------- */

export default function StartupXAI() {
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState("landing");
  const [ideaCtx, setIdeaCtx] = useState(null);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [partialWarning, setPartialWarning] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const runGeneration = async (idea) => {
    setIdeaCtx(idea);
    setView("loading");
    setProgress(0);
    setErrorMsg("");
    setPartialWarning("");
    try {
      const { data, failed } = await generateReport(idea, () => setProgress((p) => p + 1));
      if (Object.keys(data).length === 0) {
        const firstMessage = failed[0]?.error?.message;
        throw new Error(
          firstMessage ||
            "The report generation hit a snag talking to the AI model. This can happen with rate limits or a temporary hiccup — try again."
        );
      }
      if (failed.length > 0) {
        setPartialWarning(
          `${failed.length} of ${CALL_DEFS.length} sections (${failed.map((f) => f.label).join(", ")}) couldn't be generated — showing the rest below.`
        );
      }
      setReport(data);
      setView("report");
    } catch (e) {
      setErrorMsg(e.message);
      setView("error");
    }
  };

  return (
    <div className="sx-root" data-sx-theme={theme}>
      <div className="sx-grain" />
      {view === "landing" && (
        <Landing theme={theme} toggleTheme={toggleTheme} onGenerate={runGeneration} />
      )}
      {view === "loading" && <LoadingScreen idea={ideaCtx?.idea || ""} progress={progress} />}
      {view === "report" && report && (
        <Report
          idea={ideaCtx}
          data={report}
          onReset={() => setView("landing")}
          warning={partialWarning}
          onUpdateData={(partial) => setReport((prev) => ({ ...prev, ...partial }))}
        />
      )}
      {view === "error" && (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <ShieldAlert size={36} color="var(--sx-red)" style={{ marginBottom: 16 }} />
          <h2 className="sx-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Couldn't generate the report</h2>
          <p style={{ fontSize: 13.5, color: "var(--sx-text-dim)", maxWidth: 380, marginBottom: 20 }}>{errorMsg}</p>
          <button className="sx-btn-primary" style={{ padding: "12px 22px" }} onClick={() => ideaCtx && runGeneration(ideaCtx)}>Try again</button>
        </div>
      )}
    </div>
  );
}
