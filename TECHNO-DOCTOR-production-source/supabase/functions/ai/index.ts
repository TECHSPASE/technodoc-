const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

interface AiRequest {
  task: string;
  payload?: Record<string, unknown>;
}

const SYSTEM_PROMPT = `Ты — ИИ-помощник для мастерской по ремонту бытовой техники и электроники "TechnoDoctor".
Отвечай всегда на русском языке, кратко и по делу, простыми словами мастера.
Ты помогаешь: расшифровывать коды ошибок, советовать порядок диагностики, оценивать средние рыночные цены запчастей в рублях (РФ, ориентировочно), объяснять смету ремонта клиенту, давать рекомендации по прошивкам и моделям, анализировать финансы мастерской.
Не выдумывай несуществующие артикулы. Если данных мало — сделай разумное предположение и пометь его как ориентировочное.`;

function buildOpenAiMessages(task: string, payload: Record<string, unknown>): { role: string; content: unknown }[] {
  switch (task) {
    case "recognize_part":
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Определи, какая запчасть на фото. Категория техники: ${payload.category ?? "неизвестно"}. Дополнительное описание от мастера: ${payload.hint || "нет"}.
Ответь строго в JSON: {"name": "название детали по-русски", "search_query": "запрос для поиска на Авито/Озоне", "confidence": "высокая|средняя|низкая", "comment": "краткое пояснение"}.`,
            },
            { type: "image_url", image_url: { url: payload.image as string } },
          ],
        },
      ];
    case "price_estimate":
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Оцени среднюю рыночную цену запчасти в РФ на сегодня. Категория техники: ${payload.category}. Деталь: ${payload.part}.
Ответь строго в JSON: {"avg": число, "min": число, "max": число, "comment": "краткая пометка, от чего зависит цена"}. Цены в рублях, без слов "примерно".`,
        },
      ];
    case "calculator_advice":
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Смета ремонта для клиента. Категория техники: ${payload.category}. Услуги: ${JSON.stringify(payload.services)}. Срочный ремонт: ${payload.urgent ? "да" : "нет"}. Итого: ${payload.total} руб.
Напиши 2-3 предложения, которыми мастер может объяснить клиенту, из чего складывается эта цена. Без списков, сплошным текстом.`,
        },
      ];
    case "error_code_advice": {
      const code = payload.code as Record<string, unknown> | null;
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Код ошибки ${code?.code ?? ""} (${code?.brand ?? "бренд неизвестен"}), категория: ${payload.category}. Описание: ${code?.description ?? ""}. Причина: ${code?.cause ?? "неизвестна"}. Решение из базы: ${code?.solution ?? "нет"}.
Дай практический совет мастеру: с чего начать проверку и типичные ловушки. Максимум 3 предложения.`,
        },
      ];
    }
    case "diagnostics_advice":
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Симптом: ${payload.symptom}. Категория: ${payload.category}. Методика проверки: ${payload.checks}. Найденная причина: ${payload.cause ?? "неизвестна"}.
Дай краткую подсказку: в каком порядке действовать и что часто упускают. Максимум 3 предложения.`,
        },
      ];
    case "firmware_advice":
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Мастер смотрит прошивку ${payload.brand} ${payload.model} (версия ${payload.version}), категория: ${payload.category}.
Дай краткую рекомендацию: на что обратить внимание при прошивке, типичные риски. Максимум 3 предложения.`,
        },
      ];
    case "model_advice":
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Мастер смотрит модель ${payload.brand} ${payload.model_name} (${payload.year ?? "год неизвестен"}), категория: ${payload.category}. Характеристики: ${payload.specs ?? "нет"}. Заметки: ${payload.notes ?? "нет"}.
Дай краткую справку: типичные болячки этой модели и что проверить первым делом. Максимум 3 предложения.`,
        },
      ];
    case "finance_advice":
      return [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Итоги мастерской: доходы ${payload.income} руб., расходы ${payload.expense} руб., должны клиентам/нам ${payload.debt} руб., прибыль ${payload.profit} руб.
Дай краткую сводку из 2-3 предложений: как идут дела и на что обратить внимание. Без списков.`,
        },
      ];
    default:
      return [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: String(payload.text ?? "Привет") },
      ];
  }
}

const TASK_PROMPTS: Record<string, (p: Record<string, unknown>) => string> = {
  recognize_part: (p) => `Определи, какая запчасть на фото. Категория техники: ${p.category ?? "неизвестно"}. Дополнительное описание от мастера: ${p.hint || "нет"}.
Ответь строго в JSON: {"name": "название детали по-русски", "search_query": "запрос для поиска на Авито/Озоне", "confidence": "высокая|средняя|низкая", "comment": "краткое пояснение"}.`,
  price_estimate: (p) => `Оцени среднюю рыночную цену запчасти в РФ на сегодня. Категория техники: ${p.category}. Деталь: ${p.part}.
Ответь строго в JSON: {"avg": число, "min": число, "max": число, "comment": "краткая пометка, от чего зависит цена"}. Цены в рублях, без слов "примерно".`,
  calculator_advice: (p) => `Смета ремонта для клиента. Категория техники: ${p.category}. Услуги: ${JSON.stringify(p.services)}. Срочный ремонт: ${p.urgent ? "да" : "нет"}. Итого: ${p.total} руб.
Напиши 2-3 предложения, которыми мастер может объяснить клиенту, из чего складывается эта цена. Без списков, сплошным текстом.`,
  error_code_advice: (p) => {
    const code = (p.code ?? {}) as Record<string, unknown>;
    return `Код ошибки ${code.code ?? ""} (${code.brand ?? "бренд неизвестен"}), категория: ${p.category}. Описание: ${code.description ?? ""}. Причина: ${code.cause ?? "неизвестна"}. Решение из базы: ${code.solution ?? "нет"}.
Дай практический совет мастеру: с чего начать проверку и типичные ловушки. Максимум 3 предложения.`;
  },
  diagnostics_advice: (p) => `Симптом: ${p.symptom}. Категория: ${p.category}. Методика проверки: ${p.checks}. Найденная причина: ${p.cause ?? "неизвестна"}.
Дай краткую подсказку: в каком порядке действовать и что часто упускают. Максимум 3 предложения.`,
  firmware_advice: (p) => `Мастер смотрит прошивку ${p.brand} ${p.model} (версия ${p.version}), категория: ${p.category}.
Дай краткую рекомендацию: на что обратить внимание при прошивке, типичные риски. Максимум 3 предложения.`,
  model_advice: (p) => `Мастер смотрит модель ${p.brand} ${p.model_name} (${p.year ?? "год неизвестен"}), категория: ${p.category}. Характеристики: ${p.specs ?? "нет"}. Заметки: ${p.notes ?? "нет"}.
Дай краткую справку: типичные болячки этой модели и что проверить первым делом. Максимум 3 предложения.`,
  finance_advice: (p) => `Итоги мастерской: доходы ${p.income} руб., расходы ${p.expense} руб., должны клиентам/нам ${p.debt} руб., прибыль ${p.profit} руб.
Дай краткую сводку из 2-3 предложений: как идут дела и на что обратить внимание. Без списков.`,
  default: (p) => String(p.text ?? "Привет"),
};

function getPrompt(task: string, payload: Record<string, unknown>): string {
  return (TASK_PROMPTS[task] ?? TASK_PROMPTS.default)(payload);
}

const WANTS_JSON = (task: string) => task === "recognize_part" || task === "price_estimate";

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function callGemini(apiKey: string, task: string, payload: Record<string, unknown>): Promise<string> {
  const parts: Record<string, unknown>[] = [{ text: getPrompt(task, payload) }];
  if (task === "recognize_part" && typeof payload.image === "string") {
    const img = splitDataUrl(payload.image);
    if (img) {
      parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    }
  }

  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.4,
    },
  };
  if (WANTS_JSON(task)) body.generationConfig = { ...body.generationConfig, responseMimeType: "application/json" };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Gemini error", resp.status, errText.slice(0, 500));
    if (resp.status === 429) throw new Error("RATE_LIMIT");
    if (resp.status === 403 || resp.status === 400) throw new Error("BAD_KEY");
    throw new Error("UPSTREAM");
  }

  const data = await resp.json();
  const c = data?.candidates?.[0];
  const content = c?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") || "";
  if (!content) {
    const reason = c?.finishReason ?? data?.promptFeedback?.blockReason ?? "unknown";
    console.error("Gemini empty content", reason);
    throw new Error("EMPTY");
  }
  return content;
}

async function callOpenAi(apiKey: string, task: string, payload: Record<string, unknown>): Promise<string> {
  const body: Record<string, unknown> = {
    model: "gpt-4o-mini",
    messages: buildOpenAiMessages(task, payload),
    max_tokens: 500,
  };
  if (WANTS_JSON(task)) body.response_format = { type: "json_object" };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("OpenAI error", resp.status, errText.slice(0, 500));
    const isNoCredits = errText.includes("insufficient_quota") || errText.includes("credit_balance");
    throw new Error(isNoCredits ? "NO_CREDITS" : resp.status === 429 ? "RATE_LIMIT" : "UPSTREAM");
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("EMPTY");
  return content;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { task, payload = {} } = (await req.json()) as AiRequest;
    if (!task) {
      return new Response(JSON.stringify({ error: "Не указана задача" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: secrets } = await admin.from("app_secrets").select("name,value");
    const secretMap = new Map((secrets ?? []).map((s: { name: string; value: string }) => [s.name, s.value]));

    const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? secretMap.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? secretMap.get("OPENAI_API_KEY");

    if (!geminiKey && !openaiKey) {
      return new Response(JSON.stringify({ error: "ИИ-ключ не настроен на сервере" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let content: string | null = null;
    const errors: string[] = [];

    if (geminiKey) {
      try {
        content = await callGemini(geminiKey, task, payload);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`gemini:${msg}`);
        if (msg === "RATE_LIMIT" && !openaiKey) {
          return new Response(JSON.stringify({ error: "Бесплатный лимит ИИ на сегодня исчерпан, попробуйте позже" }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (content === null && openaiKey) {
      try {
        content = await callOpenAi(openaiKey, task, payload);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`openai:${msg}`);
        if (msg === "NO_CREDITS" && !geminiKey) {
          return new Response(
            JSON.stringify({
              error: "На аккаунте OpenAI закончились средства. Пополните баланс на platform.openai.com (Billing), после этого ИИ заработает сам.",
            }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (content === null) {
      console.error("All AI providers failed", errors.join("; "));
      return new Response(JSON.stringify({ error: "ИИ временно недоступен, попробуйте ещё раз" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (WANTS_JSON(task)) {
      try {
        return new Response(JSON.stringify({ result: JSON.parse(content) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ result: { text: content } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ result: { text: content.trim() } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai function error", err);
    return new Response(JSON.stringify({ error: "Внутренняя ошибка ИИ-функции" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
