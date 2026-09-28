import {
  WashingMachine,
  UtensilsCrossed,
  Tv,
  Monitor,
  Laptop,
  Refrigerator,
  Flame,
  CookingPot,
  CookingPot as Stove,
  Calculator as CalcIcon,
  AlertTriangle,
  Stethoscope,
  Cpu,
  Database,
  Package,
  Wallet,
  Bot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CategoryKey =
  | 'СТИРАЛЬНЫЕ МАШИНЫ'
  | 'ПОСУДОМОЕЧНЫЕ МАШИНЫ'
  | 'ТЕЛЕВИЗОРЫ'
  | 'КОМПЬЮТЕРЫ'
  | 'НОУТБУКИ'
  | 'ХОЛОДИЛЬНИКИ'
  | 'ВОДОНАГРЕВАТЕЛИ'
  | 'ДУХОВЫЕ ШКАФЫ'
  | 'ВАРОЧНЫЕ ПАНЕЛИ';

export interface CategoryDef {
  key: CategoryKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'СТИРАЛЬНЫЕ МАШИНЫ', label: 'СТИРАЛЬНЫЕ МАШИНЫ', shortLabel: 'СТИРАЛЬНЫЕ', icon: WashingMachine },
  { key: 'ПОСУДОМОЕЧНЫЕ МАШИНЫ', label: 'ПОСУДОМОЕЧНЫЕ МАШИНЫ', shortLabel: 'ПОСУДОМОЕЧНЫЕ', icon: UtensilsCrossed },
  { key: 'ТЕЛЕВИЗОРЫ', label: 'ТЕЛЕВИЗОРЫ', shortLabel: 'ТЕЛЕВИЗОРЫ', icon: Tv },
  { key: 'КОМПЬЮТЕРЫ', label: 'КОМПЬЮТЕРЫ', shortLabel: 'КОМПЬЮТЕРЫ', icon: Monitor },
  { key: 'НОУТБУКИ', label: 'НОУТБУКИ', shortLabel: 'НОУТБУКИ', icon: Laptop },
  { key: 'ХОЛОДИЛЬНИКИ', label: 'ХОЛОДИЛЬНИКИ', shortLabel: 'ХОЛОДИЛЬНИКИ', icon: Refrigerator },
  { key: 'ВОДОНАГРЕВАТЕЛИ', label: 'ВОДОНАГРЕВАТЕЛИ', shortLabel: 'ВОДОНАГРЕВАТЕЛИ', icon: Flame },
  { key: 'ДУХОВЫЕ ШКАФЫ', label: 'ДУХОВЫЕ ШКАФЫ', shortLabel: 'ДУХОВЫЕ ШКАФЫ', icon: CookingPot },
  { key: 'ВАРОЧНЫЕ ПАНЕЛИ', label: 'ВАРОЧНЫЕ ПАНЕЛИ', shortLabel: 'ВАРОЧНЫЕ ПАНЕЛИ', icon: Stove },
];

export type MenuKey =
  | 'КАЛЬКУЛЯТОР'
  | 'КОДЫ ОШИБОК'
  | 'ДИАГНОСТИКА'
  | 'ПРОШИВКИ'
  | 'БАЗА МОДЕЛЕЙ'
  | 'ЗАПЧАСТИ'
  | 'ФИНАНСЫ'
  | 'AI МАСТЕР';

export interface MenuDef {
  key: MenuKey;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const MENU_ITEMS: MenuDef[] = [
  { key: 'КАЛЬКУЛЯТОР', label: 'КАЛЬКУЛЯТОР', hint: 'РАСЧЁТ СТОИМОСТИ', icon: CalcIcon },
  { key: 'КОДЫ ОШИБОК', label: 'КОДЫ ОШИБОК', hint: 'РАСШИФРОВКА', icon: AlertTriangle },
  { key: 'ДИАГНОСТИКА', label: 'ДИАГНОСТИКА', hint: 'ЧЕК-ЛИСТЫ', icon: Stethoscope },
  { key: 'ПРОШИВКИ', label: 'ПРОШИВКИ', hint: 'СОФТ ТВ', icon: Cpu },
  { key: 'БАЗА МОДЕЛЕЙ', label: 'БАЗА МОДЕЛЕЙ', hint: 'СПРАВОЧНИК', icon: Database },
  { key: 'ЗАПЧАСТИ', label: 'ЗАПЧАСТИ', hint: 'НАЛИЧИЕ И ЦЕНЫ', icon: Package },
  { key: 'ФИНАНСЫ', label: 'ФИНАНСЫ', hint: 'ДОХОДЫ / РАСХОДЫ', icon: Wallet },
  { key: 'AI МАСТЕР', label: 'AI МАСТЕР', hint: 'GEMINI ПОМОЩНИК', icon: Bot },
];

export const COMPLEXITY_MULTIPLIER: Record<string, number> = {
  low: 1,
  medium: 1.5,
  high: 2,
};

export const COMPLEXITY_LABEL: Record<string, string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
};
