/**
 * «Космические» эффекты поверх фона, видимые на всех экранах приложения:
 * летающая тарелка (и вторая, дальняя, в обратную сторону), кометы,
 * мерцающие дрейфующие звёзды и мягкие светящиеся туманности.
 * Всё декоративное: pointer-events none + aria-hidden, только
 * GPU-трансформации (transform/opacity), поэтому не тормозит прокрутку.
 */
import { useMemo } from 'react';

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_COUNT = 30;

function Saucer({ className = '' }: { className?: string }) {
  const lights = [
    { x: 28, y: 44 },
    { x: 44, y: 49 },
    { x: 60, y: 51 },
    { x: 76, y: 49 },
    { x: 92, y: 44 },
  ];
  return (
    <div className={`ufo-wobble ${className}`}>
      <svg width="120" height="78" viewBox="0 0 120 78" className="ufo-glow" aria-hidden>
        <defs>
          <linearGradient id="ufoBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0c2a6b" />
          </linearGradient>
          <linearGradient id="ufoDome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="ufoGlowUnder" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ufoBeamG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Свечение под тарелкой */}
        <ellipse cx="60" cy="46" rx="58" ry="26" fill="url(#ufoGlowUnder)" />

        {/* Луч «абдукции», пульсирующий вниз */}
        <polygon className="ufo-beam" points="46,42 30,78 90,78 74,42" fill="url(#ufoBeamG)" />

        {/* Нижняя юбка корпуса */}
        <ellipse cx="60" cy="43" rx="34" ry="8" fill="#0b2a66" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.5" />

        {/* Корпус */}
        <ellipse cx="60" cy="38" rx="46" ry="13.5" fill="url(#ufoBody)" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.8" />

        {/* Купол с окошками */}
        <path d="M 45 34 A 15 15 0 0 1 75 34 Z" fill="url(#ufoDome)" stroke="#e0f2fe" strokeWidth="0.8" strokeOpacity="0.7" />
        <circle cx="52" cy="28.5" r="2.4" fill="#f0f9ff" fillOpacity="0.9" />
        <circle cx="60" cy="26.5" r="2.4" fill="#f0f9ff" fillOpacity="0.9" />
        <circle cx="68" cy="28.5" r="2.4" fill="#f0f9ff" fillOpacity="0.9" />

        {/* Бегающие огни по ободу */}
        {lights.map((l, i) => (
          <circle
            key={i}
            className="ufo-light"
            cx={l.x}
            cy={l.y}
            r="2.6"
            fill={i % 2 === 0 ? '#22d3ee' : '#e0f2fe'}
            style={{ animationDelay: `${i * 0.22}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

const ORBS = [
  { left: '-8%', top: '12%', size: 240, color: 'rgba(56, 189, 248, 0.16)', duration: '23s', delay: '0s' },
  { left: '72%', top: '38%', size: 300, color: 'rgba(34, 211, 238, 0.13)', duration: '29s', delay: '-9s' },
  { left: '18%', top: '68%', size: 200, color: 'rgba(29, 78, 216, 0.2)', duration: '25s', delay: '-15s' },
] as const;

export function FlyingEffects() {
  const stars = useMemo(() => {
    const rnd = mulberry32(7);
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      left: `${(rnd() * 100).toFixed(2)}%`,
      top: `${(rnd() * 100).toFixed(2)}%`,
      size: 1.5 + rnd() * 2.4,
      duration: `${(11 + rnd() * 13).toFixed(1)}s`,
      delay: `-${(rnd() * 22).toFixed(1)}s`,
      glow: rnd() > 0.55,
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Мягкие дрейфующие туманности */}
      {ORBS.map((o, i) => (
        <div
          key={i}
          className="orb-float absolute rounded-full"
          style={{
            left: o.left,
            top: o.top,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, ${o.color} 0%, rgba(0,0,0,0) 70%)`,
            filter: 'blur(38px)',
            animationDuration: o.duration,
            animationDelay: o.delay,
            willChange: 'transform',
          }}
        />
      ))}

      {/* Мерцающие звёзды, медленно плывущие вверх */}
      {stars.map((s) => (
        <span key={s.id} className="star-drift absolute" style={{ left: s.left, top: s.top, animationDuration: s.duration, animationDelay: s.delay }}>
          <span
            className={`star-twinkle block rounded-full bg-sky-200 ${s.glow ? 'shadow-[0_0_6px_2px_rgba(125,211,252,0.8)]' : ''}`}
            style={{ width: s.size, height: s.size }}
          />
        </span>
      ))}

      {/* Кометы */}
      <span className="comet comet-a absolute left-0 top-0" />
      <span className="comet comet-b absolute left-0 top-0" />

      {/* Главная тарелка: слева направо через весь экран */}
      <div className="ufo-path absolute left-0 top-0">
        <Saucer />
      </div>
      {/* Далёкая вторая: меньше, тусклее, в обратную сторону */}
      <div className="ufo-path-back absolute left-0 top-0">
        <Saucer />
      </div>
    </div>
  );
}
