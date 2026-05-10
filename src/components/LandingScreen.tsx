import { useState, useEffect, useRef } from "react";
import { PORTFOLIO_DATA } from "../data/portfolioData";

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
          return (
            <g key={i}>
              <rect x={b.x} y={by} width={b.w} height={b.h} fill="#0d1520" />
              {Array.from({ length: Math.floor(b.h / 18) }).map((_, wy) =>
                Array.from({ length: Math.floor(b.w / 14) }).map((_, wx) => {
                  const lit = (i * 5 + wy * 3 + wx * 7) % 4 < 3;
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

        <rect x="0" y="0" width={W} height={H} fill="url(#skyGrad)" />
      </svg>
    </div>
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

        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-600/60" />
          <p className="text-base sm:text-xl font-mono text-gray-400 tracking-widest">
            Work Portfolio
          </p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-600/60" />
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
      </div>

      <nav className="absolute top-5 right-5 z-20 flex items-center gap-5">
        {[
          { label: "LinkedIn", href: PORTFOLIO_DATA.contact.linkedin },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-gray-200 text-sm font-mono transition-colors tracking-wider"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
