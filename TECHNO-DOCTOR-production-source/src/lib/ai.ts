const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface PartRecognition {
  name?: string;
  search_query?: string;
  confidence?: string;
  comment?: string;
}

export interface PriceEstimate {
  avg?: number;
  min?: number;
  max?: number;
  comment?: string;
}

interface AiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function askAi<T>(task: string, payload: Record<string, unknown> = {}): Promise<AiResult<T>> {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ task, payload }),
    });
    if (!resp.ok) {
      let msg = 'ИИ временно недоступен';
      try {
        const body = await resp.json();
        if (body?.error) msg = body.error;
      } catch {
        // ignore parse errors
      }
      return { ok: false, error: msg };
    }
    const body = await resp.json();
    if (!body || typeof body !== 'object' || !('result' in body)) {
      return { ok: false, error: 'Некорректный ответ ИИ' };
    }
    return { ok: true, data: body.result as T };
  } catch {
    return { ok: false, error: 'Нет соединения с ИИ-сервисом' };
  }
}

export const aiTasks = {
  recognizePart: (payload: { image: string; category?: string; hint?: string }) =>
    askAi<PartRecognition>('recognize_part', payload),
  priceEstimate: (payload: { category: string; part: string }) =>
    askAi<PriceEstimate>('price_estimate', payload),
  calculatorAdvice: (payload: {
    category: string;
    services: { name: string; price: number; qty: number }[];
    urgent: boolean;
    total: number;
  }) => askAi<{ text?: string }>('calculator_advice', payload),
  errorCodeAdvice: (payload: {
    category: string;
    code: { code?: string; brand?: string; description?: string; cause?: string; solution?: string };
  }) => askAi<{ text?: string }>('error_code_advice', payload),
  diagnosticsAdvice: (payload: {
    category: string;
    symptom: string;
    checks: string;
    cause?: string;
  }) => askAi<{ text?: string }>('diagnostics_advice', payload),
  firmwareAdvice: (payload: { category: string; brand: string; model: string; version: string }) =>
    askAi<{ text?: string }>('firmware_advice', payload),
  modelAdvice: (payload: {
    category: string;
    brand: string;
    model_name: string;
    year?: number | null;
    specs?: string | null;
    notes?: string | null;
  }) => askAi<{ text?: string }>('model_advice', payload),
  financeAdvice: (payload: { income: number; expense: number; debt: number; profit: number }) =>
    askAi<{ text?: string }>('finance_advice', payload),
};
