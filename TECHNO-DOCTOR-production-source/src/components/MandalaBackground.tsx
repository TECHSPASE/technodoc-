/**
 * Геометрический фрактально-мандала фон в чёрно-сине-белой гамме.
 * Несколько слоёв концентрических мандал с лепестками и лучами,
 * медленно вращающихся на разных скоростях. Служит фоном — контент поверх.
 * Слои живо реагируют на курсор/наклон: параллакс + лёгкий 3D-наклон,
 * только GPU-трансформации (transform), поэтому анимация не тормозит.
 */
import { useEffect, useRef } from 'react';

function Mandala({ size, opacity, duration, reverse = false, className = '' }: {
  size: number;
  opacity: number;
  duration: number;
  reverse?: boolean;
  className?: string;
}) {
  const c = size / 2;
  const petals = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  const rays = Array.from({ length: 32 }, (_, i) => (i * 360) / 32);
  const dots = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{
        opacity,
        animation: `mandalaSpin ${duration}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
      transformOrigin: '50% 50%',
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`mg-${size}-${reverse ? 'r' : 'f'}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Внешнее тонкое кольцо с делениями */}
      <circle cx={c} cy={c} r={c - 2} fill="none" stroke="#93c5fd" strokeWidth="0.6" strokeOpacity="0.5" />
      {rays.map((a) => (
        <line
          key={`ray-${a}`}
          x1={c}
          y1={c - (c - 2)}
          x2={c}
          y2={c - (c - 8)}
          stroke="#bfdbfe"
          strokeWidth="0.7"
          strokeOpacity="0.55"
          transform={`rotate(${a} ${c} ${c})`}
        />
      ))}

      {/* Кольца */}
      <circle cx={c} cy={c} r={(c - 2) * 0.82} fill="none" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.4" />
      <circle cx={c} cy={c} r={(c - 2) * 0.55} fill="none" stroke="#93c5fd" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx={c} cy={c} r={(c - 2) * 0.55} fill="none" stroke={`url(#mg-${size}-${reverse ? 'r' : 'f'})`} strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="3 6" />

      {/* Лепестки-фрактал: пары дуг */}
      {petals.map((a) => (
        <g key={`petal-${a}`} transform={`rotate(${a} ${c} ${c})`}>
          <path
            d={`M ${c} ${c - (c - 2) * 0.82} Q ${c + (c * 0.13)} ${c - (c - 2) * 0.68} ${c} ${c - (c - 2) * 0.55}`}
            fill="none"
            stroke="#bfdbfe"
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
          <path
            d={`M ${c} ${c - (c - 2) * 0.82} Q ${c - (c * 0.13)} ${c - (c - 2) * 0.68} ${c} ${c - (c - 2) * 0.55}`}
            fill="none"
            stroke="#bfdbfe"
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
        </g>
      ))}

      {/* Внутренние лепестки поменьше, встречным шагом */}
      {petals.map((a) => (
        <g key={`petal2-${a}`} transform={`rotate(${a + 11.25} ${c} ${c})`}>
          <path
            d={`M ${c} ${c - (c - 2) * 0.55} Q ${c + (c * 0.1)} ${c - (c - 2) * 0.4} ${c} ${c - (c - 2) * 0.27}`}
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="0.7"
            strokeOpacity="0.45"
          />
          <path
            d={`M ${c} ${c - (c - 2) * 0.55} Q ${c - (c * 0.1)} ${c - (c - 2) * 0.4} ${c} ${c - (c - 2) * 0.27}`}
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="0.7"
            strokeOpacity="0.45"
          />
        </g>
      ))}

      {/* Шестигранник и точки-узлы */}
      <polygon
        points={[0, 60, 120, 180, 240, 300]
          .map((a) => {
            const r = (c - 2) * 0.27;
            const x = c + r * Math.sin((a * Math.PI) / 180);
            const y = c - r * Math.cos((a * Math.PI) / 180);
            return `${x},${y}`;
          })
          .join(' ')}
        fill="none"
        stroke="#93c5fd"
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />
      {dots.map((a) => {
        const r = (c - 2) * 0.27;
        const x = c + r * Math.sin((a * Math.PI) / 180);
        const y = c - r * Math.cos((a * Math.PI) / 180);
        return <circle key={`dot-${a}`} cx={x} cy={y} r="2" fill="#e0f2fe" fillOpacity="0.7" />;
      })}

      {/* Ядро */}
      <circle cx={c} cy={c} r={(c - 2) * 0.1} fill="none" stroke="#e0f2fe" strokeWidth="0.9" strokeOpacity="0.6" />
      <circle cx={c} cy={c} r={(c - 2) * 0.045} fill="#bae6fd" fillOpacity="0.5" />
    </svg>
  );
}

const LAYERS = [
  { size: 560, opacity: 0.16, duration: 120, reverse: false, className: 'absolute -top-40 left-1/2 -translate-x-1/2', depth: 22 },
  { size: 520, opacity: 0.12, duration: 150, reverse: true, className: 'absolute -bottom-56 -left-40', depth: -34 },
  { size: 440, opacity: 0.1, duration: 180, reverse: false, className: 'absolute top-1/3 -right-48', depth: 14 },
] as const;

export function MandalaBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    // Один rAF-цикл плавно тянет все слои к целевой позиции курсора.
    const tick = () => {
      const cur = current.current;
      const tgt = target.current;
      cur.x += (tgt.x - cur.x) * 0.05;
      cur.y += (tgt.y - cur.y) * 0.05;
      const root = rootRef.current;
      if (root) {
        const layers = root.querySelectorAll<HTMLElement>('[data-depth]');
        layers.forEach((el) => {
          const depth = Number(el.dataset.depth) || 0;
          el.style.transform = `translate3d(${(cur.x * depth).toFixed(2)}px, ${(cur.y * depth).toFixed(2)}px, 0)`;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    const onPointer = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.current = { x: nx, y: ny };
    };
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.current = {
        x: Math.max(-1, Math.min(1, e.gamma / 35)),
        y: Math.max(-1, Math.min(1, (e.beta - 45) / 35)),
      };
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('deviceorientation', onOrientation);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onOrientation);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {LAYERS.map((l) => (
        <div key={l.size} className={l.className} data-depth={l.depth} style={{ willChange: 'transform' }}>
          <Mandala size={l.size} opacity={l.opacity} duration={l.duration} reverse={l.reverse} />
        </div>
      ))}
      {/* Крупная тусклая сетка-фрактал поверх всего */}
      <svg className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <pattern id="mandalaGrid" width="72" height="72" patternUnits="userSpaceOnUse">
            <circle cx="36" cy="36" r="30" fill="none" stroke="#93c5fd" strokeWidth="0.4" strokeOpacity="0.16" />
            <circle cx="36" cy="36" r="18" fill="none" stroke="#7dd3fc" strokeWidth="0.4" strokeOpacity="0.12" />
            <path d="M36 6 L36 66 M6 36 L66 36" stroke="#bfdbfe" strokeWidth="0.3" strokeOpacity="0.1" />
            <circle cx="36" cy="36" r="2" fill="#e0f2fe" fillOpacity="0.14" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mandalaGrid)" opacity="0.5" />
      </svg>
    </div>
  );
}
