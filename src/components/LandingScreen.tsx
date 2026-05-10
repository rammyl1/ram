import { useState, useEffect, useRef } from "react";

interface Props {
  onExplore: () => void;
}

function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() < 0.7 ? 1 : 2,
      a: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 0.025 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    let raf: number;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      for (const st of stars) {
        const a = st.a + Math.sin(frame * st.speed + st.phase) * 0.25;
        ctx.fillStyle = `rgba(255,255,220,${Math.max(0.05, a)})`;
        ctx.fillRect(Math.floor(st.x * W), Math.floor(st.y * H), st.s, st.s);
      }
      frame++;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ imageRendering: "pixelated" }} />;
}

function PixelCityscape() {
  const W = 1200;
  const H = 220;
  const buildings = [
    { x: 20, y: 70, w: 55, h: 90 },
    { x: 85, y: 50, w: 40, h: 110 },
    { x: 135, y: 30, w: 75, h: 130 },
    { x: 220, y: 60, w: 50, h: 100 },
    { x: 280, y: 20, w: 85, h: 140 },
    { x: 375, y: 55, w: 60, h: 105 },
    { x: 445, y: 35, w: 65, h: 125 },
    { x: 520, y: 60, w: 55, h: 100 },
    { x: 585, y: 10, w: 90, h: 150 },
    { x: 685, y: 55, w: 55, h: 105 },
    { x: 750, y: 30, w: 70, h: 130 },
    { x: 830, y: 50, w: 60, h: 110 },
    { x: 900, y: 25, w: 80, h: 135 },
    { x: 990, y: 55, w: 50, h: 105 },
    { x: 1050, y: 35, w: 65, h: 125 },
    { x: 1125, y: 55, w: 55, h: 105 },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: "pixelated", display: "block" }}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(0,0,0,0)" />
            <stop offset="1" stopColor="#050810" />
          </linearGradient>
        </defs>
        <rect x="0" y={H - 30} width={W} height="30" fill="#0a0f16" />
        {buildings.map((b, i) => {
          const baseY = H - 30;
          const by = baseY - b.h;
          const litRatio = 0.65;
          return (
            <g key={i}>
              <rect x={b.x} y={by} width={b.w} height={b.h} fill="#0d1520" />
              {Array.from({ length: Math.floor(b.h / 18) }).map((_, wy) =>
                Array.from({ length: Math.floor(b.w / 14) }).map((_, wx) => {
                  const lit = Math.random() < litRatio || (i * 5 + wy * 3 + wx * 7) % 4 < 3;
                  return (
                    <rect
                      key={`w${wy}-${wx}`}
                      x={b.x + 3 + wx * 14}
                      y={by + 4 + wy * 18}
                      width={8}
                      height={10}
                      fill={lit ? `rgba(255,${180 + (i * 13) % 60},${60 + (wy * 30) % 80},0.7)` : "rgba(20,30,50,0.9)"}
                    />
                  );
                })
              )}
            </g>
          );
        })}
        <rect x="0" y={H - 32} width={W} height="2" fill="#1a2535" />
        {[100, 250, 420, 580, 750, 920, 1080].map((lx, i) => (
          <g key={i}>
            <rect x={lx} y={H - 60} width="3" height="30" fill="#3a4555" />
            <rect x={lx - 8} y={H - 62} width="20" height="5" fill="#4a5565" />
            <rect x={lx - 4} y={H - 65} width="12" height="5" fill="rgba(255,230,120,0.85)" />
            <ellipse cx={lx + 2} cy={H - 62} rx="18" ry="12" fill="rgba(255,220,100,0.07)" />
          </g>
        ))}
        {[180, 380, 570, 760, 960, 1130].map((tx, i) => (
          <g key={i}>
            <rect x={tx + 8} y={H - 56} width="7" height="24" fill="#5a3a1a" />
            <rect x={tx} y={H - 82} width="24" height="26" fill="#1e4818" />
            <rect x={tx + 3} y={H - 90} width="18" height="16" fill="#2a6828" />
            <rect x={tx + 6} y={H - 96} width="12" height="12" fill="#3a8838" />
            <rect x={tx + 8} y={H - 90} width="6" height="5" fill="#48a848" />
          </g>
        ))}
        <rect x="0" y="0" width={W} height={H} fill="url(#skyGrad)" />
      </svg>
    </div>
  );
}

function FloatingPixel({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x, top: y, width: size, height: size,
        backgroundColor: color,
        imageRendering: "pixelated",
        opacity: 0.4,
        animation: `float-pixel 4s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export default function LandingScreen({ onExplore }: Props) {
  const [phase, setPhase] = useState<"idle" | "activating" | "done">("idle");
  const [glitchChar, setGlitchChar] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setGlitchChar(true);
      setTimeout(() => setGlitchChar(false), 120);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleExplore = () => {
    if (phase !== "idle") return;
    setPhase("activating");
    setTimeout(() => {
      setPhase("done");
      onExplore();
    }, 600);
  };

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0a1628 0%, #050810 60%, #020408 100%)",
      }}
    >
      <StarCanvas />
      <PixelCityscape />

      <FloatingPixel x="8%"  y="25%" size={4} color="#4a90e2" delay={0} />
      <FloatingPixel x="15%" y="60%" size={2} color="#50c878" delay={1.2} />
      <FloatingPixel x="85%" y="20%" size={3} color="#ffd700" delay={0.5} />
      <FloatingPixel x="90%" y="55%" size={4} color="#e04060" delay={2.1} />
      <FloatingPixel x="75%" y="70%" size={2} color="#c050e0" delay={0.8} />
      <FloatingPixel x="25%" y="15%" size={3} color="#50e0c0" delay={1.8} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(74,144,226,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,144,226,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      <div
        className="relative z-10 text-center px-6 transition-all duration-500"
        style={{
          opacity: phase === "done" ? 0 : 1,
          transform: phase === "activating" ? "scale(1.03)" : "scale(1)",
        }}
      >
        <h1
          className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white mb-3 leading-none tracking-tight"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textShadow: glitchChar
              ? "2px 0 #ff4080, -2px 0 #40c8ff, 0 0 30px rgba(74,144,226,0.5)"
              : "0 0 60px rgba(74,144,226,0.2), 0 2px 8px rgba(0,0,0,0.9)",
            transition: "text-shadow 0.05s",
          }}
        >
          Rammyl Matabalan
        </h1>

        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-600/60" />
          <p className="text-base sm:text-xl font-mono text-gray-400 tracking-widest">
            Work Portfolio
          </p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-600/60" />
        </div>

        <div className="flex items-center justify-center gap-4 mb-10 mt-4 flex-wrap">
          {[
            { icon: "⚙", label: "5+ Years XP" },
            { icon: "👥", label: "Team Leader" },
            { icon: "🎯", label: "QA Expert" },
            { icon: "🤖", label: "LLM / AI" },
            { icon: "🚗", label: "DMS/AMS" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1 text-gray-500 text-xs font-mono">
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="relative inline-block">
          <div
            className="absolute inset-0 blur-xl"
            style={{
              background: "radial-gradient(ellipse, rgba(74,144,226,0.2) 0%, transparent 70%)",
              transform: "scale(1.5)",
            }}
          />
          <button
            onClick={handleExplore}
            className="relative group font-mono font-bold text-lg text-white transition-all duration-150 active:scale-95"
            style={{
              padding: "14px 48px",
              background: "rgba(5,15,30,0.8)",
              border: "2px solid rgba(255,255,255,0.7)",
              boxShadow: "4px 4px 0 rgba(255,255,255,0.08), 0 0 30px rgba(74,144,226,0.15)",
              imageRendering: "pixelated",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#ffd700";
              (e.currentTarget as HTMLButtonElement).style.color = "#ffd700";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0 rgba(255,215,0,0.2), 0 0 40px rgba(255,215,0,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.7)";
              (e.currentTarget as HTMLButtonElement).style.color = "white";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0 rgba(255,255,255,0.08), 0 0 30px rgba(74,144,226,0.15)";
            }}
          >
            {phase === "activating" ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse">Loading World</span>
                <span className="animate-bounce">...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Explore</span>
                <span className="group-hover:translate-x-1 transition-transform inline-block">▶</span>
              </span>
            )}
          </button>
        </div>

        <p className="mt-5 text-gray-600 text-xs font-mono">
          Enter the pixel RPG world ↑ to explore the portfolio
        </p>
      </div>

      <nav className="absolute top-5 right-5 z-20 flex items-center gap-5">
        {[
          { label: "Resume" },
          { label: "Projects" },
          { label: "Contact" },
        ].map((link) => (
          <button
            key={link.label}
            onClick={handleExplore}
            className="text-gray-500 hover:text-gray-200 text-sm font-mono transition-colors tracking-wider"
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="absolute top-5 left-5 z-20 flex items-center gap-3">
        <div
          className="px-3 py-1.5 font-mono text-xs text-gray-500"
          style={{ border: "1px solid rgba(100,100,100,0.25)" }}
        >
          🕹 RPG Portfolio
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-10">
        <div
          className="text-gray-600 text-xs font-mono"
          style={{ animation: "fadeIn 2s ease-in" }}
        >
          Click <span className="text-white/60">Explore</span> to enter Rammyl's Town
        </div>
        <div
          className="text-gray-700 text-xs font-mono"
          style={{ animation: "bounce 2s ease-in-out infinite" }}
        >
          ▼ ▼ ▼
        </div>
      </div>

      <style>{`
        @keyframes float-pixel {
          0%, 100% { transform: translateY(0px); opacity: 0.35; }
          50% { transform: translateY(-12px); opacity: 0.7; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(4px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
