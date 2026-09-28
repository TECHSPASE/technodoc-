import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { aiTasks } from '@/lib/ai';
import type { SparePart } from '@/lib/types';
import type { CategoryKey } from '@/lib/constants';
import { AiAdvice } from '@/components/AiAdvice';
import { useToast } from '@/components/Toast';
import {
  Package,
  Search,
  Hash,
  Boxes,
  LoaderCircle,
  Camera,
  X,
  Sparkles,
  TrendingUp,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface Props {
  category: CategoryKey;
}

const MARKETPLACES = [
  {
    name: 'Авито',
    color: '#04E061',
    text: '#0A0A0A',
    url: (q: string) => `https://www.avito.ru/all?q=${encodeURIComponent(q)}`,
  },
  {
    name: 'Озон',
    color: '#005BFF',
    text: '#FFFFFF',
    url: (q: string) => `https://www.ozon.ru/search/?text=${encodeURIComponent(q)}`,
  },
  {
    name: 'Яндекс',
    color: '#FC3F1D',
    text: '#FFFFFF',
    url: (q: string) => `https://yandex.ru/search/?text=${encodeURIComponent(q)}`,
  },
  {
    name: 'Google',
    color: '#FFFFFF',
    text: '#1A73E8',
    url: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=shop`,
  },
];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read error'));
    reader.readAsDataURL(file);
  });
}

export function SparePartsSection({ category }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Поиск по фото
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoModal, setPhotoModal] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [recognition, setRecognition] = useState<{
    name?: string;
    search_query?: string;
    confidence?: string;
    comment?: string;
  } | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Окно средней цены
  const [priceModal, setPriceModal] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [price, setPrice] = useState<{ avg?: number; min?: number; max?: number; comment?: string } | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });
    if (err) {
      setError('Не удалось загрузить запчасти. Проверьте подключение.');
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    setSearch('');
    load();
  }, [load]);

  const filtered = items.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.part_number.toLowerCase().includes(search.toLowerCase()),
  );

  const openPhotoModal = () => {
    setPhoto(null);
    setHint('');
    setRecognition(null);
    setRecognitionError(null);
    setPhotoModal(true);
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto(dataUrl);
      setRecognition(null);
      setRecognitionError(null);
    } catch {
      setRecognitionError('Не удалось прочитать файл. Попробуйте другое фото.');
    }
  };

  const recognize = async () => {
    if (!photo || recognizing) return;
    setRecognizing(true);
    setRecognitionError(null);
    setRecognition(null);
    const res = await aiTasks.recognizePart({ image: photo, category, hint: hint.trim() || undefined });
    setRecognizing(false);
    if (!res.ok) {
      setRecognitionError(res.error ?? 'ИИ не смог распознать фото');
      toast.error('Не удалось распознать фото');
      return;
    }
    if (!res.data?.name) {
      setRecognitionError('ИИ не смог определить деталь. Добавьте описание и попробуйте ещё раз.');
      toast.warning('Деталь не определена');
      return;
    }
    setRecognition(res.data);
    toast.success('Деталь распознана');
  };

  const searchQuery = recognition?.search_query || recognition?.name || '';

  const showPrice = async () => {
    const part = searchQuery;
    if (!part) return;
    setPriceModal(true);
    setPriceLoading(true);
    setPrice(null);
    setPriceError(null);
    const res = await aiTasks.priceEstimate({ category, part });
    setPriceLoading(false);
    if (!res.ok || !res.data?.avg) {
      setPriceError(res.error ?? 'ИИ не смог оценить цену');
      toast.error('Не удалось оценить цену');
      return;
    }
    setPrice(res.data);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoaderCircle className="w-8 h-8 text-white animate-spin" />
        <p className="text-white/80 text-sm">Загружаем запчасти...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl glass-card p-6 text-center">
        <p className="text-danger-600 text-sm font-medium">{error}</p>
        <button
          onClick={load}
          className="mt-4 rounded-xl bg-brand-500 px-6 py-2.5 text-white text-sm font-semibold hover:bg-brand-600 active:bg-brand-700 active:scale-[0.98] transition-all duration-200"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl glass-icon flex items-center justify-center">
          <Package className="w-6 h-6 text-accent-300" strokeWidth={2} />
        </span>
        <h2 className="font-display text-2xl text-white">ЗАПЧАСТИ</h2>
      </div>

      {/* Поиск по фото */}
      <button
        onClick={openPhotoModal}
        className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-400 py-4 font-display text-base tracking-wide text-brand-950 shadow-lg shadow-brand-950/40 hover:brightness-110 active:scale-[0.98] transition-all mb-5"
      >
        <Camera className="w-5 h-5" strokeWidth={2.2} />
        НАЙТИ ПО ФОТО
      </button>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или артикулу..."
          className="w-full rounded-2xl glass-input pl-11 pr-4 py-3 text-sm shadow-lg shadow-brand-950/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-6 text-center text-white/80 text-sm">
          {search ? 'Ничего не найдено' : 'Нет запчастей для этой категории'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((part) => {
            const stock = part.stock ?? 0;
            return (
              <div
                key={part.id}
                className="flex items-center gap-3 rounded-2xl glass-card-hover p-3.5"
              >
                <span className="w-11 h-11 rounded-xl glass-icon flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-accent-300" strokeWidth={1.9} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{part.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-white/50">
                      <Hash className="w-3 h-3" />
                      {part.part_number}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        stock > 5 ? 'text-success-600' : stock > 0 ? 'text-accent-600' : 'text-danger-600'
                      }`}
                    >
                      <Boxes className="w-3 h-3" />
                      {stock > 0 ? `В наличии: ${stock}` : 'Нет в наличии'}
                    </span>
                  </div>
                </div>
                <p className="font-display text-lg text-accent-300 flex-shrink-0">
                  {Number(part.price ?? 0).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно: поиск по фото */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-brand-900 ring-1 ring-white/15 p-5 max-h-[92vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-accent-300" /> Найти по фото
              </h3>
              <button
                onClick={() => setPhotoModal(false)}
                aria-label="Закрыть"
                className="w-9 h-9 rounded-xl glass-chip flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Выбор фото */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl glass-card py-5 text-white active:scale-[0.97] transition-all"
              >
                <Camera className="w-6 h-6 text-accent-300" />
                <span className="text-sm">Камера</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-2xl glass-card py-5 text-white active:scale-[0.97] transition-all"
              >
                <Package className="w-6 h-6 text-accent-300" />
                <span className="text-sm">Из файлов</span>
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={pickPhoto}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickPhoto}
            />

            {/* Предпросмотр + уточнение */}
            {photo && (
              <div className="mb-4">
                <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/15">
                  <img src={photo} alt="Фото детали" className="w-full max-h-56 object-contain bg-black/40" />
                  <button
                    onClick={() => {
                      setPhoto(null);
                      setRecognition(null);
                    }}
                    aria-label="Убрать фото"
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80 active:scale-90 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Уточните деталь (необязательно)..."
                  maxLength={100}
                  className="w-full mt-3 rounded-2xl glass-input px-4 py-3 text-sm shadow-lg shadow-brand-950/20"
                />
                <button
                  onClick={recognize}
                  disabled={recognizing}
                  className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60 transition-all"
                >
                  {recognizing ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {recognizing ? 'ИИ рассматривает фото...' : 'Распознать деталь'}
                </button>
              </div>
            )}

            {recognitionError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-danger-50 ring-1 ring-danger-200 p-3">
                <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-700">{recognitionError}</p>
              </div>
            )}

            {/* Результат распознавания */}
            {recognition?.name && (
              <div className="space-y-4 animate-slide-up">
                <div className="rounded-2xl bg-accent-50 ring-1 ring-accent-200 p-4">
                  <p className="text-[10px] text-accent-700/70 uppercase tracking-wide mb-1">
                    ИИ определил деталь {recognition.confidence ? `· уверенность: ${recognition.confidence}` : ''}
                  </p>
                  <p className="text-base font-semibold text-brand-900">{recognition.name}</p>
                  {recognition.comment && (
                    <p className="text-xs text-slate-600 mt-1">{recognition.comment}</p>
                  )}
                </div>

                {/* Кнопки площадок */}
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Искать на площадках</p>
                  <div className="grid grid-cols-4 gap-2">
                    {MARKETPLACES.map((mp) => (
                      <a
                        key={mp.name}
                        href={mp.url(searchQuery)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1.5 rounded-xl py-3 active:scale-95 hover:brightness-105 transition-all ring-1 ring-white/10"
                        style={{ backgroundColor: mp.color }}
                      >
                        <span className="text-xs font-bold leading-none" style={{ color: mp.text }}>
                          {mp.name}
                        </span>
                        <ExternalLink className="w-3 h-3" style={{ color: mp.text }} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Средняя цена — отдельная кнопка той же ширины */}
                <button
                  onClick={showPrice}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl glass-card py-3.5 text-sm font-semibold text-white hover:bg-white/15 active:scale-[0.98] transition-all"
                >
                  <TrendingUp className="w-4 h-4 text-accent-300" />
                  СРЕДНЯЯ ЦЕНА ДЕТАЛИ
                </button>

                <AiAdvice
                  buttonLabel="Спросить ИИ об этой детали"
                  ask={() =>
                    aiTasks.diagnosticsAdvice({
                      category,
                      symptom: `Запчасть: ${recognition.name}. ${recognition.comment ?? ''}`,
                      checks: 'Подскажите, на что обратить внимание при покупке и установке этой детали.',
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно: средняя цена */}
      {priceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-brand-900 ring-1 ring-white/15 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-300" /> Средняя цена
              </h3>
              <button
                onClick={() => setPriceModal(false)}
                aria-label="Закрыть"
                className="w-9 h-9 rounded-xl glass-chip flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {priceLoading && (
              <div className="flex flex-col items-center py-8 gap-3">
                <LoaderCircle className="w-8 h-8 text-accent-300 animate-spin" />
                <p className="text-white/80 text-sm">ИИ оценивает рыночную цену...</p>
              </div>
            )}

            {priceError && (
              <div className="flex items-start gap-2 rounded-xl bg-danger-50 ring-1 ring-danger-200 p-3">
                <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-700">{priceError}</p>
              </div>
            )}

            {price && (
              <div>
                <p className="text-sm text-white/70 mb-3">{searchQuery}</p>
                <div className="rounded-2xl bg-accent-50 ring-1 ring-accent-200 p-4 text-center">
                  <p className="text-[10px] text-accent-700/70 uppercase tracking-wide mb-1">
                    Средняя рыночная цена · ориентировочно
                  </p>
                  <p className="font-display text-3xl text-brand-900">
                    {Math.round(price.avg ?? 0).toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    разброс: {Math.round(price.min ?? 0).toLocaleString('ru-RU')} —{' '}
                    {Math.round(price.max ?? 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                {price.comment && <p className="text-xs text-white/60 mt-3">{price.comment}</p>}
                <p className="text-[10px] text-white/40 mt-2">
                  Оценка ИИ на основе знаний рынка. Живые цены смотрите кнопками площадок выше.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
