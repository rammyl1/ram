import { useEffect, useRef } from "react";
import { PORTFOLIO_DATA } from "../data/portfolioData";

interface Props { section: string; onClose: () => void; }
const data = PORTFOLIO_DATA;

// ── Stardew / RPG dialog frame ─────────────────────────────────────────────
function Frame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-col max-h-[84vh] w-full"
      style={{
        background: "linear-gradient(180deg,#1c2614 0%,#0e1a08 100%)",
        border: "3px solid #9a7820",
        boxShadow: "0 0 0 1px #4a3810, 0 0 0 6px #0a1006, 0 0 0 8px #9a7820, 0 24px 64px rgba(0,0,0,0.95)",
      }}
    >
      {/* Corner pixels */}
      {[["top-0 left-0","polygon(0 0,100% 0,0 100%)"],["top-0 right-0","polygon(100% 0,100% 100%,0 0)"],
        ["bottom-0 left-0","polygon(0 0,100% 100%,0 100%)"],["bottom-0 right-0","polygon(100% 0,0 100%,100% 100%)"],
      ].map(([pos, clip], i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3 bg-yellow-700`} style={{ clipPath: clip }} />
      ))}

      {/* Title bar */}
      <div
        className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
        style={{ background:"linear-gradient(180deg,#283018 0%,#1a2210 100%)", borderBottom:"2px solid #6a5010" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500" />
          <span className="text-yellow-200 font-mono font-bold text-sm tracking-widest uppercase">{title}</span>
          <div className="w-2 h-2 bg-yellow-500" />
        </div>
        <button
          onClick={onClose}
          className="text-yellow-600 hover:text-red-400 font-mono font-bold text-lg px-2 py-0.5 transition-colors"
          style={{ border:"1px solid rgba(200,160,30,0.4)" }}
        >✕</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0" style={{ scrollbarWidth:"thin", scrollbarColor:"#4a3810 #0e1a08" }}>
        {children}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 flex-shrink-0 flex items-center justify-between" style={{ borderTop:"2px solid #2a1a06", background:"#0e1a08" }}>
        <span className="text-yellow-900 text-xs font-mono">ESC or click ✕ to close</span>
        <span className="text-yellow-700 text-xs font-mono animate-pulse">▼</span>
      </div>
    </div>
  );
}

// ── Utility components ─────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px" style={{ background:"rgba(200,160,30,0.25)" }} />
      <span className="text-yellow-700 text-xs font-mono uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px" style={{ background:"rgba(200,160,30,0.25)" }} />
    </div>
  );
}

function Tag({ ch, color = "green" }: { ch: string; color?: string }) {
  const s: Record<string, string> = {
    green:  "rgba(80,200,80,0.15)  border-green-700/50  text-green-300",
    blue:   "rgba(80,120,220,0.15) border-blue-700/50   text-blue-300",
    purple: "rgba(160,80,220,0.15) border-purple-700/50 text-purple-300",
    yellow: "rgba(220,160,30,0.15) border-yellow-700/50 text-yellow-300",
    red:    "rgba(220,60,60,0.15)  border-red-700/50    text-red-300",
    teal:   "rgba(40,180,180,0.15) border-teal-700/50   text-teal-300",
  };
  const parts = s[color]?.split(" ") ?? s.green.split(" ");
  return (
    <span className={`px-2 py-0.5 border text-xs font-mono ${parts[1]} ${parts[2]}`}
      style={{ background: parts[0] }}>
      {ch}
    </span>
  );
}

function StatBar({ label, pct, color="#50c850" }: { label: string; pct: number; color?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-gray-300">{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-900 border border-gray-700">
        <div className="h-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})` }} />
      </div>
    </div>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────────────────
function About() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        {/* Pixel avatar */}
        <div className="flex-shrink-0">
          <div className="w-[72px] h-[90px] flex items-end justify-center overflow-hidden"
            style={{ background:"linear-gradient(180deg,#1a3a24 0%,#0e2418 100%)", border:"2px solid #3a6828" }}>
            <svg width="48" height="76" viewBox="0 0 48 76" style={{ imageRendering:"pixelated" }}>
              <rect x="12" y="70" width="24" height="4" fill="rgba(0,0,0,0.3)" />
              <rect x="12" y="62" width="10" height="8" fill="#0a0808" />
              <rect x="26" y="62" width="10" height="8" fill="#0a0808" />
              <rect x="13" y="50" width="9" height="13" fill="#1a2a50" />
              <rect x="26" y="50" width="9" height="13" fill="#1a2a50" />
              <rect x="10" y="47" width="28" height="4" fill="#100808" />
              <rect x="20" y="47" width="8" height="4" fill="#c0a020" />
              <rect x="10" y="28" width="28" height="20" fill="#181818" />
              <rect x="14" y="29" width="20" height="18" fill="#e8e0d0" />
              <rect x="10" y="29" width="5" height="18" fill="#181818" />
              <rect x="33" y="29" width="5" height="18" fill="#181818" />
              <rect x="18" y="30" width="12" height="16" fill="#1a2a70" />
              <rect x="20" y="30" width="8" height="16" fill="#0a1850" />
              <rect x="2" y="30" width="8" height="16" fill="#181818" />
              <rect x="38" y="30" width="8" height="16" fill="#181818" />
              <rect x="2" y="44" width="8" height="6" fill="#c8a070" />
              <rect x="38" y="44" width="8" height="6" fill="#c8a070" />
              <rect x="20" y="24" width="8" height="6" fill="#c8a070" />
              <rect x="14" y="8" width="20" height="18" fill="#d4a878" />
              <rect x="14" y="8" width="20" height="5" fill="#1a1208" />
              <rect x="14" y="8" width="3" height="10" fill="#1a1208" />
              <rect x="17" y="16" width="4" height="3" fill="#e8f0ff" />
              <rect x="27" y="16" width="4" height="3" fill="#e8f0ff" />
              <rect x="18" y="16" width="2" height="3" fill="#3080e0" />
              <rect x="28" y="16" width="2" height="3" fill="#3080e0" />
              <rect x="18" y="17" width="1" height="2" fill="#0a0a1a" />
              <rect x="28" y="17" width="1" height="2" fill="#0a0a1a" />
              <rect x="19" y="21" width="10" height="2" fill="#a06040" />
            </svg>
          </div>
          <div className="text-center text-yellow-500 text-xs font-mono font-bold mt-1">RAMMYL</div>
          <div className="text-center text-gray-600 text-xs font-mono">Lv.5 IT Pro</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-yellow-200 font-mono font-bold text-base leading-tight mb-0.5">Rammyl Matabalan</div>
          <div className="text-green-400 font-mono text-xs mb-2">⚙ Technical Support & IT Specialist</div>
          <p className="text-gray-300 text-xs font-mono leading-relaxed">{data.about.content}</p>
        </div>
      </div>

      <Divider label="Character Stats" />
      <div className="space-y-2">
        <StatBar label="IT Troubleshooting"   pct={95} color="#50c850" />
        <StatBar label="Manual QA Testing"     pct={88} color="#50a8e0" />
        <StatBar label="Team Leadership"        pct={90} color="#e0a050" />
        <StatBar label="LLM / AI Evaluation"    pct={82} color="#c050e0" />
        <StatBar label="Customer Operations"    pct={95} color="#e05080" />
        <StatBar label="DMS / AMS Platforms"    pct={85} color="#50e0c0" />
      </div>

      <Divider label="Highlights" />
      <div className="space-y-1.5">
        {data.about.details.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-xs font-mono text-gray-300">
            <span className="text-green-500 mt-0.5 flex-shrink-0">▸</span><span>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CV ────────────────────────────────────────────────────────────────────
const expColors = ["#c8a020","#50a8e0","#50c880","#c050e0"];

function CV() {
  return (
    <div className="space-y-4">
      <div className="text-yellow-500 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
        <span>◆</span><span>Work Experience</span>
      </div>

      {data.cv.experience.map((exp, i) => (
        <div key={i} className="space-y-2 p-3"
          style={{ background:"rgba(255,255,255,0.018)", border:`1px solid ${expColors[i % 4]}30` }}>
          <div className="flex flex-wrap items-start justify-between gap-1">
            <div>
              <div className="text-yellow-200 font-mono font-bold text-sm leading-tight">{exp.role}</div>
              <div className="font-mono text-xs mt-0.5" style={{ color: expColors[i % 4] }}>{exp.company}</div>
            </div>
            <div className="text-gray-500 font-mono text-xs px-2 py-0.5 flex-shrink-0"
              style={{ border:"1px solid rgba(100,100,100,0.3)", background:"rgba(0,0,0,0.3)" }}>
              {exp.period}
            </div>
          </div>
          <ul className="space-y-1">
            {exp.bullets.map((b, j) => (
              <li key={j} className="flex items-start gap-2 text-xs font-mono text-gray-300">
                <span className="text-blue-500 flex-shrink-0 mt-0.5">◦</span>
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Divider label="Education" />

      {data.cv.education.map((edu, i) => (
        <div key={i} className="p-3 space-y-1"
          style={{ background:"rgba(255,255,255,0.018)", border:"1px solid rgba(80,200,80,0.2)" }}>
          <div className="flex flex-wrap items-start justify-between gap-1">
            <div>
              <div className="text-yellow-200 font-mono font-bold text-sm">{edu.degree}</div>
              <div className="text-green-400 font-mono text-xs">{edu.school}</div>
              <div className="text-gray-500 font-mono text-xs">{edu.field}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-gray-500 font-mono text-xs">{edu.period}</div>
              <div className="text-yellow-400 font-mono text-xs">GPA: {edu.gpa}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── PROJECTS ──────────────────────────────────────────────────────────────
function Projects() {
  const tagVariants = ["green","blue","yellow","purple","teal","red"];
  return (
    <div className="space-y-3">
      <div className="text-yellow-500 text-xs font-mono uppercase tracking-wider">◆ Project Inventory</div>
      {data.projects.items.map((proj, i) => (
        <div key={i} className="p-3 space-y-2"
          style={{ background:"rgba(255,255,255,0.018)", border:"1px solid rgba(80,150,80,0.22)" }}>
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">⚙</span>
            <span className="text-yellow-200 font-mono font-bold text-sm">{proj.name}</span>
            <span className="text-gray-700 font-mono text-xs ml-auto">#{String(i+1).padStart(2,"0")}</span>
          </div>
          <p className="text-gray-300 text-xs font-mono leading-relaxed">{proj.description}</p>
          <div className="flex flex-wrap gap-1">
            {proj.tech.map((t, j) => <Tag key={j} ch={t} color={tagVariants[j % tagVariants.length]} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TECHNOLOGIES ──────────────────────────────────────────────────────────
function Tech() {
  const groups = [
    { label:"Technical Skills",        items: data.technologies.technical, color:"blue"   as const },
    { label:"Support & Operations",    items: data.technologies.operations, color:"green"  as const },
    { label:"Tools & Platforms",       items: data.technologies.tools,     color:"yellow" as const },
    { label:"Soft Skills",             items: data.technologies.soft,      color:"purple" as const },
  ];
  return (
    <div className="space-y-4">
      <div className="text-yellow-500 text-xs font-mono uppercase tracking-wider">◆ Skill Tree</div>
      {groups.map((g, i) => (
        <div key={i} className="space-y-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider"
            style={{ color: g.color==="blue"?"#60a8e8":g.color==="green"?"#50c850":g.color==="yellow"?"#e0c040":"#c060e0" }}>
            ▶ {g.label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {g.items.map((item, j) => <Tag key={j} ch={item} color={g.color} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MEMO ──────────────────────────────────────────────────────────────────
function Memo() {
  const noteColors = ["#1e2c10","#101e2a","#1e102a","#102a1e","#2a1e10","#0e1e1e","#2a100e"];
  return (
    <div className="space-y-3">
      <div className="text-yellow-500 text-xs font-mono uppercase tracking-wider">◆ Bulletin Board</div>
      <div className="space-y-2">
        {data.memo.notes.map((note, i) => (
          <div key={i} className="p-3 font-mono text-sm text-yellow-100"
            style={{
              background: noteColors[i % noteColors.length],
              border:"1px solid rgba(200,160,30,0.2)",
              transform:`rotate(${(i%3-1)*0.35}deg)`,
            }}>
            {note}
          </div>
        ))}
      </div>
      <Divider label="Personal Note" />
      <div className="p-3 text-center font-mono text-sm italic text-yellow-200/60"
        style={{ border:"1px dashed rgba(200,160,30,0.2)" }}>
        "Code, Coffee, and Customer Success — making IT simple for everyone."
      </div>
    </div>
  );
}

// ── CONTACT ──────────────────────────────────────────────────────────────
function Contact() {
  const c = data.contact;
  const items = [
    { icon:"📞", label:"Phone",    value:c.phone,          color:"text-green-300" },
    { icon:"📧", label:"Email",    value:c.email,          color:"text-blue-300",   href:`mailto:${c.email}` },
    { icon:"🔗", label:"LinkedIn", value:c.linkedinDisplay,color:"text-purple-300", href:c.linkedin },
    { icon:"📍", label:"Address",  value:c.address,        color:"text-yellow-300" },
  ];
  return (
    <div className="space-y-3">
      <div className="text-yellow-500 text-xs font-mono uppercase tracking-wider">◆ Contact Information</div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-3"
          style={{ background:"rgba(255,255,255,0.018)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-2xl flex-shrink-0">{item.icon}</span>
          <div className="min-w-0">
            <div className="text-gray-500 font-mono text-xs">{item.label}</div>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer"
                className={`font-mono text-sm ${item.color} hover:underline break-all`}>{item.value}</a>
            ) : (
              <div className={`font-mono text-sm ${item.color} break-all`}>{item.value}</div>
            )}
          </div>
        </div>
      ))}
      <Divider label="Availability" />
      <div className="p-3 text-center font-mono text-sm text-green-300"
        style={{ border:"1px solid rgba(80,200,80,0.25)", background:"rgba(80,200,80,0.04)" }}>
        ✓ Open to new opportunities & collaborations!
      </div>
    </div>
  );
}

// ── COFFEE ────────────────────────────────────────────────────────────────
function Coffee() {
  return (
    <div className="space-y-4 text-center">
      <div className="text-5xl">☕</div>
      <div className="text-yellow-200 font-mono font-bold text-lg">Rammyl's Coffee Shop</div>
      <p className="text-gray-400 font-mono text-xs italic">"The best ideas happen over a good cup of coffee."</p>
      <Divider label="Today's Menu" />
      <div className="space-y-2 text-left">
        {[
          ["☕","Morning Americano",    "+10 Focus"],
          ["🍵","Green Tea Latte",     "+5 Cozy"],
          ["🧋","Milk Tea",            "+3 Productivity"],
          ["🥐","Buttered Croissant",  "+8 Energy"],
          ["🥞","Pixel Pancakes",      "+15 HP"],
        ].map(([em, name, bonus], i) => (
          <div key={i} className="flex items-center justify-between p-2"
            style={{ border:"1px solid rgba(200,160,30,0.18)", background:"rgba(200,160,30,0.04)" }}>
            <div className="flex items-center gap-2 font-mono text-sm text-gray-300">
              <span>{em}</span><span>{name}</span>
            </div>
            <span className="text-green-400 font-mono text-xs">{bonus}</span>
          </div>
        ))}
      </div>
      <div className="text-green-500 font-mono text-xs pt-2">
        ★ Fuel your code sessions here ★
      </div>
    </div>
  );
}

// ── REGISTRY ─────────────────────────────────────────────────────────────
const SECTIONS: Record<string, { title: string; node: React.ReactNode }> = {
  about:        { title: "About Me",               node: <About /> },
  cv:           { title: "Experience & Education", node: <CV /> },
  projects:     { title: "Projects",               node: <Projects /> },
  technologies: { title: "Technologies & Skills",  node: <Tech /> },
  memo:         { title: "Memo Board",             node: <Memo /> },
  contact:      { title: "Contact",                node: <Contact /> },
  coffee:       { title: "Coffee Shop ☕",          node: <Coffee /> },
};

// ── MAIN EXPORT ───────────────────────────────────────────────────────────
export default function ContentOverlay({ section, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const sec = SECTIONS[section];
  if (!sec) return null;

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-30 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.68)", backdropFilter:"blur(5px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}
      tabIndex={-1}
      aria-modal="true"
    >
      <div className="w-full max-w-xl" style={{ animation:"fadeSlideIn 0.18s ease-out" }}>
        <Frame title={sec.title} onClose={onClose}>{sec.node}</Frame>
      </div>
    </div>
  );
}
