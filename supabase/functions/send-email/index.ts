import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

function buildInviteHtml(coachName: string, ctaUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 40px 16px;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
            Coach Athlete Hub
          </h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:16px 40px 32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#cbd5e1;">
            Ciao! 👋
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#cbd5e1;">
            Il Coach <strong style="color:#ffffff;">${coachName}</strong> ti ha invitato su <strong style="color:#ffffff;">Coach Athlete Hub</strong> per iniziare il tuo percorso di allenamento personalizzato.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td align="center" style="border-radius:12px;background:#7c3aed;">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                Accetta Invito &amp; Entra →
              </a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#64748b;text-align:center;">
            Se il pulsante non funziona, copia e incolla questo link nel browser:<br/>
            <a href="${ctaUrl}" style="color:#7c3aed;word-break:break-all;">${ctaUrl}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">
            Questa è un'email automatica del tuo servizio di coaching.<br/>
            © ${new Date().getFullYear()} Coach Athlete Hub
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a coach
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "coach") {
      return new Response(JSON.stringify({ error: "Only coaches can send invites" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, type, data: emailData } = await req.json();

    if (!to || !type) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let html = "";
    let emailSubject = subject || "";

    if (type === "invite") {
      const coachName = emailData?.coachName || profile.full_name || "Il tuo Coach";
      const origin = req.headers.get("origin") || "https://id-preview--e1c56229-82db-4ffc-8215-23b357d4c3a9.lovable.app";
      const ctaUrl = `${origin}/auth?mode=signup&email=${encodeURIComponent(to)}`;
      emailSubject = emailSubject || `${coachName} ti ha invitato su Coach Athlete Hub`;
      html = buildInviteHtml(coachName, ctaUrl);
    } else {
      return new Response(JSON.stringify({ error: "Unsupported email type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sendResult, error: sendError } = await resend.emails.send({
      from: "Coach Athlete Hub <onboarding@resend.dev>",
      to: [to],
      subject: emailSubject,
      html,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return new Response(JSON.stringify({ error: sendError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: sendResult?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
