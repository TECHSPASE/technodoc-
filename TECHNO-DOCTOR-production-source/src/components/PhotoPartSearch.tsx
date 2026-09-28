import { useState, useRef } from 'react';
import { aiTasks } from '@/lib/ai';
import type { CategoryKey } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import {
  Camera,
  Package,
  LoaderCircle,
  X,
  Sparkles,
  TrendingUp,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

export const MARKETPLACES = [
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
];

interface Recognition {
  name?: string;
  search_query?: string;
  confidence?: string;
  comment?: string;
}

interface PriceEstimate {
  avg?: number;
  min?: number;
  max?: number;
  comment?: string;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read error'));
    reader.readAsDataURL(file);
  });
}

export function PhotoPartSearchModal({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  category?: CategoryKey;
}) {
  const toast = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [recognition, setRecognition] = useState<Recognition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [price, setPrice] = useState<PriceEstimate | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setPhoto(null);
    setHint('');
    setRecognition(null);
    setError(null);
    setPrice(null);
    setPriceError(null);
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto(dataUrl);
      setRecognition(null);
      setError(null);
      setPrice(null);
      setPriceError(null);
    } catch {
      setError('Не удалось прочитать файл. Попробуйте другое фото.');
    }
  };

  const recognize = async () => {
    if (!photo || recognizing) return;
    setRecognizing(true);
    setError(null);
    setRecognition(null);
    const res = await aiTasks.recognizePart({ image: photo, category, hint: hint.trim() || undefined });
    setRecognizing(false);
    if (!res.ok) {
      setError(res.error ?? 'ИИ не смог распознать фото');
      toast.error('Не удалось распознать фото');
      return;
    }
    if (!res.data?.name) {
      setError('ИИ не смог определить деталь. Добавьте описание и попробуйте ещё раз.');
      toast.warning('Деталь не определена');
      return;
    }
    setRecognition(res.data);
    toast.success('Деталь распознана');
  };

  const searchQuery = recognition?.search_query || recognition?.name || '';

  const showPrice = async () => {
    if (!searchQuery || priceLoading) return;
    setPriceLoading(true);
    setPrice(null);
    setPriceError(null);
    const res = await aiTasks.priceEstimate({ category: category ?? 'неизвестно', part: searchQuery });
    setPriceLoading(false);
    if (!res.ok || !res.data?.avg) {
      setPriceError(res.error ?? 'ИИ не смог оценить цену');
      toast.error('Не удалось оценить цену');
      return;
    }
    setPrice(res.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-brand-900 ring-1 ring-white/15 p-5 max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent-300" /> Поиск запчасти по фото
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="w-9 h-9 rounded-xl glass-chip flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-danger-50 ring-1 ring-danger-200 p-3">
            <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

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

            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Искать на площадках</p>
              <div className="grid grid-cols-3 gap-2">
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

            <button
              onClick={showPrice}
              disabled={priceLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl glass-card py-3.5 text-sm font-semibold text-white hover:bg-white/15 active:scale-[0.98] disabled:opacity-60 transition-all"
            >
              {priceLoading ? (
                <LoaderCircle className="w-4 h-4 animate-spin text-accent-300" />
              ) : (
                <TrendingUp className="w-4 h-4 text-accent-300" />
              )}
              СРЕДНЯЯ ЦЕНА ДЕТАЛИ
            </button>

            {priceError && (
              <div className="flex items-start gap-2 rounded-xl bg-danger-50 ring-1 ring-danger-200 p-3">
                <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-700">{priceError}</p>
              </div>
            )}

            {price && (
              <div className="rounded-2xl bg-accent-50 ring-1 ring-accent-200 p-4 text-center animate-slide-up">
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
                {price.comment && <p className="text-xs text-slate-600 mt-2">{price.comment}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
