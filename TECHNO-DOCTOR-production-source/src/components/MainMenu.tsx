import { Phone, Globe, Clock, Camera } from 'lucide-react';
import type { MenuKey } from '@/lib/constants';
import { MENU_ITEMS } from '@/lib/constants';

export default function MainMenu({
  onSelect,
  onOpenPhotoSearch,
}: {
  onSelect: (key: MenuKey) => void;
  onOpenPhotoSearch: () => void;
}) {
  return (
    <div className="flex flex-col px-4 py-6 animate-fade-in">
      {/* Список разделов в два столбца */}
      <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-2.5">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className="group flex items-center gap-3 rounded-2xl glass-card-hover px-3.5 py-3 text-left active:scale-[0.97] active:brightness-125 transition-all duration-200"
            >
              <span className="w-9 h-9 rounded-xl glass-icon flex items-center justify-center flex-shrink-0 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.7)] transition-[filter] duration-200">
                <Icon className="w-[18px] h-[18px] text-accent-300" strokeWidth={2} />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-display text-[13px] leading-tight tracking-wide text-white">
                  {item.label}
                </span>
                <span className="text-[9px] tracking-widest text-white/50 mt-0.5">
                  {item.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Поиск запчасти по фото */}
      <button
        onClick={onOpenPhotoSearch}
        className="w-full max-w-md mx-auto mt-3 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-400 py-4 font-display text-base tracking-wide text-brand-950 shadow-lg shadow-brand-950/40 hover:brightness-110 active:scale-[0.98] transition-all"
      >
        <Camera className="w-5 h-5" strokeWidth={2.2} />
        ПОИСК ЗАПЧАСТИ ПО ФОТО
      </button>

      {/* Контактная полоса */}
      <div className="w-full max-w-md mx-auto mt-8 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 px-4 py-3.5 flex flex-col items-center gap-2 glass-card-hover">
        <a href="tel:+79301141836" className="flex items-center gap-2 text-white hover:text-accent-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all">
          <Phone className="w-4 h-4 text-accent-300" />
          <span className="font-display text-lg tracking-wide">8 (930) 114-18-36</span>
        </a>
        <span className="flex items-center gap-2 text-white/90">
          <Clock className="w-4 h-4 text-accent-300" />
          <span className="text-sm">Без выходных 7:00–22:00</span>
        </span>
        <a href="https://td76.ru" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/90 hover:text-accent-300 transition-colors">
          <Globe className="w-4 h-4 text-accent-300" />
          <span className="text-sm">td76.ru</span>
        </a>
      </div>
    </div>
  );
}
