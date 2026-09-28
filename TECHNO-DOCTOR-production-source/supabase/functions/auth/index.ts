const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const GENERIC_ERROR = "Неверный номер или код доступа";

function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  // 9012713157, +7 901..., 8 901..., 7 901... -> 9012713157
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return digits.slice(1);
  }
  if (digits.length === 10 && digits.startsWith("9")) return digits;
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, phone, pin, token, newPin } = (await req.json()) as {
      action?: string;
      phone?: string;
      pin?: string;
      token?: string;
      newPin?: string;
    };

    if (action === "login") {
      const norm = normalizePhone(phone);
      if (!norm || typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
        return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await admin.rpc("app_login", { p_phone: norm, p_pin: pin });
      if (error || !data || data.length === 0) {
        console.error("login failed", error?.message);
        return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const row = data[0] as { token: string; expires_at: string };
      return new Response(JSON.stringify({ token: row.token, expiresAt: row.expires_at }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check") {
      if (typeof token !== "string" || token.length < 32) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await admin.rpc("app_validate_session", { p_token: token });
      if (error) {
        console.error("check error", error.message);
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ valid: data === true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_pin") {
      if (typeof token !== "string" || token.length < 32 || typeof newPin !== "string" || !/^\d{4,8}$/.test(newPin)) {
        return new Response(JSON.stringify({ error: "Код должен быть из 4-8 цифр" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await admin.rpc("app_set_pin", { p_token: token, p_pin: newPin });
      if (error) {
        console.error("set_pin failed", error.message);
        return new Response(JSON.stringify({ error: "Не удалось сохранить код" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "logout") {
      if (typeof token === "string" && token.length >= 32) {
        await admin.rpc("app_logout", { p_token: token });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Неизвестное действие" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("auth function error", err);
    return new Response(JSON.stringify({ error: "Внутренняя ошибка" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
