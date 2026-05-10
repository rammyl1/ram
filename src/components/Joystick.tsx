import { useEffect, useRef, useState } from "react";

interface Props {
  /** Called whenever the active direction changes. null = released. */
  onDirectionChange: (dir: "up" | "down" | "left" | "right" | null) => void;
}

const BASE_SIZE = 120;
const KNOB_SIZE = 50;
const DEAD_ZONE = 12;     // px from center treated as no-input
const MAX_RADIUS = (BASE_SIZE - KNOB_SIZE) / 2;

export default function Joystick({ onDirectionChange }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const lastDirRef = useRef<string | null>(null);

  useEffect(() => {
    const updateDir = (offX: number, offY: number) => {
      const dist = Math.sqrt(offX * offX + offY * offY);
      if (dist < DEAD_ZONE) {
        if (lastDirRef.current !== null) {
          lastDirRef.current = null;
          onDirectionChange(null);
        }
        return;
      }
      // Pick dominant axis
      let dir: "up" | "down" | "left" | "right";
      if (Math.abs(offX) > Math.abs(offY)) {
        dir = offX > 0 ? "right" : "left";
      } else {
        dir = offY > 0 ? "down" : "up";
      }
      if (lastDirRef.current !== dir) {
        lastDirRef.current = dir;
        onDirectionChange(dir);
      }
    };

    const computeOffset = (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return { x: 0, y: 0 };
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > MAX_RADIUS) {
        dx = (dx / dist) * MAX_RADIUS;
        dy = (dy / dist) * MAX_RADIUS;
      }
      return { x: dx, y: dy };
    };

    const handleStart = (e: TouchEvent | MouseEvent) => {
      const point = "touches" in e ? e.touches[0] : (e as MouseEvent);
      if (!point) return;
      const off = computeOffset(point.clientX, point.clientY);
      setKnobOffset(off);
      setActive(true);
      updateDir(off.x, off.y);
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!active && !(e as TouchEvent).touches) return;
      const point = "touches" in e ? e.touches[0] : (e as MouseEvent);
      if (!point) return;
      const off = computeOffset(point.clientX, point.clientY);
      setKnobOffset(off);
      updateDir(off.x, off.y);
      e.preventDefault();
    };

    const handleEnd = () => {
      setKnobOffset({ x: 0, y: 0 });
      setActive(false);
      if (lastDirRef.current !== null) {
        lastDirRef.current = null;
        onDirectionChange(null);
      }
    };

    const base = baseRef.current;
    if (!base) return;

    base.addEventListener("touchstart", handleStart as EventListener, { passive: false });
    base.addEventListener("touchmove", handleMove as EventListener, { passive: false });
    base.addEventListener("touchend", handleEnd as EventListener);
    base.addEventListener("touchcancel", handleEnd as EventListener);

    base.addEventListener("mousedown", handleStart as EventListener);
    window.addEventListener("mousemove", handleMove as EventListener);
    window.addEventListener("mouseup", handleEnd as EventListener);

    return () => {
      base.removeEventListener("touchstart", handleStart as EventListener);
      base.removeEventListener("touchmove", handleMove as EventListener);
      base.removeEventListener("touchend", handleEnd as EventListener);
      base.removeEventListener("touchcancel", handleEnd as EventListener);
      base.removeEventListener("mousedown", handleStart as EventListener);
      window.removeEventListener("mousemove", handleMove as EventListener);
      window.removeEventListener("mouseup", handleEnd as EventListener);
    };
  }, [active, onDirectionChange]);

  return (
    <div
      ref={baseRef}
      className="relative select-none touch-none"
      style={{
        width: BASE_SIZE,
        height: BASE_SIZE,
        background: "rgba(5,10,20,0.55)",
        border: "3px solid rgba(200,160,30,0.5)",
        borderRadius: "50%",
        boxShadow: "0 0 20px rgba(0,0,0,0.6), inset 0 0 18px rgba(0,0,0,0.5)",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Direction arrows on base */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="absolute top-2  left-1/2 -translate-x-1/2 text-yellow-500/70 text-xs font-mono">▲</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-yellow-500/70 text-xs font-mono">▼</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-yellow-500/70 text-xs font-mono">◀</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-500/70 text-xs font-mono">▶</div>
      </div>
      {/* Knob */}
      <div
        className="absolute"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          left: BASE_SIZE / 2 - KNOB_SIZE / 2 + knobOffset.x,
          top: BASE_SIZE / 2 - KNOB_SIZE / 2 + knobOffset.y,
          background: active
            ? "radial-gradient(circle, #ffd700 0%, #b88810 100%)"
            : "radial-gradient(circle, #ddc060 0%, #8a6810 100%)",
          border: "3px solid #1a1208",
          borderRadius: "50%",
          boxShadow: "2px 2px 0 rgba(0,0,0,0.7), inset -3px -3px 6px rgba(0,0,0,0.4)",
          transition: active ? "none" : "left 0.1s, top 0.1s",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
