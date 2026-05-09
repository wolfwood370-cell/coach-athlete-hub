// =============================================================================
// supabase/functions/forgot-password/index.ts
// =============================================================================
// Sends a password recovery email WITHOUT going through Supabase's
// rate-limited default mailer. Uses admin.generateLink({ type: 'recovery' })
// to mint the recovery link, then delivers it via Resend.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Payload {
  email?: string;
  redirectTo?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      console.error("forgot-password: missing env vars");
      return json({ error: "Server misconfigured" }, 500);
    }

    let payload: Payload;
    try {
      payload = (await req.json()) as Payload;
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const email = payload.email?.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return json({ error: "Email non valida" }, 400);
    }

    const redirectTo =
      typeof payload.redirectTo === "string" && payload.redirectTo.startsWith("http")
        ? payload.redirectTo
        : undefined;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: redirectTo ? { redirectTo } : undefined,
      });

    if (linkError) {
      const message = linkError.message ?? "";
      const lower = message.toLowerCase();
      // Don't leak whether the user exists — return success silently.
      if (lower.includes("not found") || lower.includes("user")) {
        return json({ success: true }, 200);
      }
      console.error("forgot-password: generateLink failed", linkError);
      return json({ error: message || "Failed to generate link" }, 500);
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      // Same — don't leak existence.
      return json({ success: true }, 200);
    }

    const subject = "Recupera la tua password";
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
        <h1 style="font-size:22px;margin:0 0 16px;">Reimposta la tua password</h1>
        <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 24px;">
          Abbiamo ricevuto una richiesta di reimpostazione della password. Clicca sul pulsante qui sotto per crearne una nuova. Il link scadrà a breve.
        </p>
        <p style="margin:0 0 32px;">
          <a href="${actionLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">
            Reimposta password
          </a>
        </p>
        <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 8px;">
          Oppure copia e incolla questo link nel browser:
        </p>
        <p style="font-size:12px;color:#64748b;word-break:break-all;margin:0 0 24px;">${actionLink}</p>
        <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0;">
          Se non hai richiesto tu questa email, puoi ignorarla in tutta sicurezza.
        </p>
      </div>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Account <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      console.error("forgot-password: Resend send failed", resendResp.status, errBody);
      return json({ error: "Failed to send email", details: errBody }, 502);
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error("forgot-password: unexpected error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
