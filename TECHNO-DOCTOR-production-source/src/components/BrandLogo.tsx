export function BrandLogo() {
  return (
    <div className="brand-lockup" aria-label="ТЕХНО-ДОКТОР — сервисный центр">
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 84 64" fill="none">
          <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M2 18h13M2 32h13M2 46h13M69 18h13M69 32h13M69 46h13" />
            <circle cx="2" cy="18" r="2.4" fill="currentColor"/><circle cx="2" cy="32" r="2.4" fill="currentColor"/><circle cx="2" cy="46" r="2.4" fill="currentColor"/>
            <circle cx="82" cy="18" r="2.4" fill="currentColor"/><circle cx="82" cy="32" r="2.4" fill="currentColor"/><circle cx="82" cy="46" r="2.4" fill="currentColor"/>
          </g>
          <g transform="translate(17 5)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M25 1l4 6 7-1 2 7 7 2-1 7 6 4-4 6 3 7-7 3-1 7-7-1-5 6-5-5-7 2-3-7-7-1 1-7-6-4 4-6-3-7 7-3 1-7 7 1z" strokeWidth="3"/>
            <circle cx="25" cy="27" r="14" strokeWidth="3"/>
            <path d="M14 17c3 0 5 1 7 3l-4 4 6 6 4-4c2 2 3 4 3 7l10 10-5 5-10-10c-4 0-7-2-9-5-2-4-2-8-2-12z" fill="currentColor" strokeWidth="1"/>
          </g>
        </svg>
      </div>
      <div className="min-w-0">
        <div className="brand-title">ТЕХНО-ДОКТОР</div>
        <div className="brand-subtitle">СЕРВИСНЫЙ ЦЕНТР</div>
      </div>
    </div>
  );
}
