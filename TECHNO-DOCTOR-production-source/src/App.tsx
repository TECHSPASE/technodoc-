import { useCallback, useEffect, useRef, useState } from 'react';
import MainMenu from '@/components/MainMenu';
import { PhotoPartSearchModal } from '@/components/PhotoPartSearch';
import { MandalaBackground } from '@/components/MandalaBackground';
import { CategoryPicker } from '@/components/CategoryPicker';
import { CalculatorSection } from '@/components/CalculatorSection';
import { ErrorCodesSection } from '@/components/ErrorCodesSection';
import { DiagnosticsSection } from '@/components/DiagnosticsSection';
import { FirmwareSection } from '@/components/FirmwareSection';
import { ModelsSection } from '@/components/ModelsSection';
import { SparePartsSection } from '@/components/SparePartsSection';
import { FinanceSection } from '@/components/FinanceSection';
import { AiAssistantSection } from '@/components/AiAssistantSection';
import { Header, Logo, ProfileModal } from '@/components/Header';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import type { FinanceTotals } from '@/components/FinanceSection';
import type { MenuKey, CategoryKey } from '@/lib/constants';
import { MENU_ITEMS, CATEGORIES } from '@/lib/constants';

// Разделы, между которыми можно переключаться без возврата к выбору категории
const CATEGORY_TAB_ORDER: MenuKey[] = [
  'КАЛЬКУЛЯТОР',
  'ДИАГНОСТИКА',
  'КОДЫ ОШИБОК',
  'ПРОШИВКИ',
  'БАЗА МОДЕЛЕЙ',
  'ЗАПЧАСТИ',
];

function CategoryTabs({
  active,
  onSelect,
}: {
  active: MenuKey;
  onSelect: (key: MenuKey) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CATEGORY_TAB_ORDER.map((key) => {
        const meta = MENU_ITEMS.find((m) => m.key === key);
        const Icon = meta?.icon;
        const isActive = key === active;
        return (
          <button
            key={key}
            onClick={() => !isActive && onSelect(key)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-display whitespace-nowrap flex-shrink-0 ring-1 transition-all duration-200 ${
              isActive
                ? 'bg-accent-400 text-brand-950 ring-accent-300 shadow-lg'
                : 'glass-chip text-white/90 hover:bg-brand-600/60 hover:ring-accent-400/60 active:scale-[0.97]'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />}
            {meta?.label ?? key}
          </button>
        );
      })}
    </div>
  );
}

type Screen = 'menu' | 'category' | 'content';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [activeSection, setActiveSection] = useState<MenuKey | null>(null);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [closing, setClosing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [totals, setTotals] = useState<FinanceTotals | null>(null);
  const [photoSearchOpen, setPhotoSearchOpen] = useState(false);
  const [lastCategory, setLastCategory] = useState<CategoryKey | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  // Разделы, которым нужно выбрать категорию техники
  const needsCategory = (key: MenuKey | null) =>
    key !== null && key !== 'ФИНАНСЫ' && key !== 'AI МАСТЕР';

  const openSection = (key: MenuKey) => {
    setActiveSection(key);
    if (needsCategory(key)) {
      setScreen('category');
    } else {
      setScreen('content');
    }
  };

  // Плавное закрытие: сначала анимация, потом смена экрана
  const closeWithAnimation = (action: () => void) => {
    if (closing) return;
    setClosing(true);
    pendingRef.current = action;
  };

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      pendingRef.current?.();
      pendingRef.current = null;
      setClosing(false);
    }, 300);
    return () => clearTimeout(t);
  }, [closing]);

  const backToMenu = () =>
    closeWithAnimation(() => {
      setScreen('menu');
      setActiveSection(null);
      setCategory(null);
    });

  const backToCategory = () => closeWithAnimation(() => setScreen('category'));

  const chooseCategory = (key: CategoryKey) => {
    setCategory(key);
    setLastCategory(key);
    setScreen('content');
  };

  // Переключение раздела внутри выбранной категории — без возврата в меню
  const switchSection = (key: MenuKey) => {
    if (needsCategory(key)) {
      setActiveSection(key);
    } else {
      closeWithAnimation(() => {
        setActiveSection(key);
        setScreen('menu');
      });
    }
  };

  const handleTotalsChange = useCallback((t: FinanceTotals) => setTotals(t), []);

  const sectionMeta = activeSection ? MENU_ITEMS.find((m) => m.key === activeSection) : null;
  const categoryMeta = category ? CATEGORIES.find((c) => c.key === category) : null;
  const showHeader = screen === 'menu' || closing;

  return (
    <div className="min-h-screen bg-brand-950 bg-[radial-gradient(circle_at_50%_-10%,#0b3d7a_0%,#04152f_34%,#020711_72%,#01040a_100%)]">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col relative">
        {/* Геометрический фрактально-мандала фон */}
        <MandalaBackground />
        {/* Неоновое свечение фона, как на флаере */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            background:
              'radial-gradient(60% 35% at 50% 0%, rgba(47,123,255,0.28) 0%, rgba(47,123,255,0) 70%), radial-gradient(45% 30% at 85% 55%, rgba(34,211,238,0.12) 0%, rgba(34,211,238,0) 70%), radial-gradient(50% 35% at 10% 85%, rgba(13,42,102,0.55) 0%, rgba(13,42,102,0) 70%)',
          }}
        />
        {/* Логотип по центру в самом верху */}
        {screen === 'menu' && <Logo />}
        {/* Шапка только на главной */}
        {showHeader && <Header totals={totals} onOpenProfile={() => setProfileOpen(true)} />}

        {screen === 'menu' && (
          <div className={`flex-1 ${closing ? 'animate-section-out' : ''}`}>
            <MainMenu onSelect={openSection} onOpenPhotoSearch={() => setPhotoSearchOpen(true)} />
          </div>
        )}

        <PhotoPartSearchModal
          open={photoSearchOpen}
          onClose={() => setPhotoSearchOpen(false)}
        />

        {screen === 'category' && (
          <div className={`flex-1 ${closing ? 'animate-section-out' : 'animate-section-in'}`}>
            <CategoryPicker
              title={sectionMeta?.label ?? ''}
              lastCategory={lastCategory}
              onSelect={chooseCategory}
              onBack={backToMenu}
            />
          </div>
        )}

        {screen === 'content' && activeSection && (
          <div
            className={`flex-1 px-4 py-5 ${
              closing ? 'animate-section-out' : 'animate-section-in'
            }`}
          >
            {/* Кнопка НАЗАД + горизонтальные табы разделов */}
            <div className="flex items-center justify-between mb-3 gap-3">
              <button
                onClick={needsCategory(activeSection) ? backToCategory : backToMenu}
                className="flex items-center gap-1.5 rounded-xl glass-chip px-4 py-2 text-sm active:scale-[0.97] transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                НАЗАД
              </button>
              {categoryMeta && (
                <span className="rounded-xl glass-chip px-3 py-2 text-xs truncate">
                  {categoryMeta.label}
                </span>
              )}
            </div>

            {needsCategory(activeSection) && (
              <CategoryTabs active={activeSection} onSelect={switchSection} />
            )}

            {activeSection === 'КАЛЬКУЛЯТОР' && category && (
              <CalculatorSection category={category} />
            )}
            {activeSection === 'КОДЫ ОШИБОК' && category && (
              <ErrorCodesSection category={category} />
            )}
            {activeSection === 'ДИАГНОСТИКА' && category && (
              <DiagnosticsSection category={category} />
            )}
            {activeSection === 'ПРОШИВКИ' && category && (
              <FirmwareSection category={category} />
            )}
            {activeSection === 'БАЗА МОДЕЛЕЙ' && category && (
              <ModelsSection category={category} />
            )}
            {activeSection === 'ЗАПЧАСТИ' && category && (
              <SparePartsSection category={category} />
            )}
            {activeSection === 'ФИНАНСЫ' && (
              <FinanceSection onTotalsChange={handleTotalsChange} />
            )}
            {activeSection === 'AI МАСТЕР' && <AiAssistantSection />}
          </div>
        )}
      </div>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      <PWAInstallBanner />
    </div>
  );
}
