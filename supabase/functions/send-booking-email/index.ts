// =============================================================================
// NaKmetiji.si — Supabase Edge Function: send-booking-email
// Pošlje email lastniku kmetije ob novem povpraševanju gosta (via Resend API)
// =============================================================================

import { corsHeaders } from "../_shared/cors.ts";
import { bookingEmailHtml, statusEmailHtml } from "../_shared/email-templates.ts";

interface BookingEmailPayload {
  type: "novo_povprasevanje" | "potrditev" | "zavrnitev";
  // Kmetija
  farmName: string;
  farmOwnerEmail: string;
  // Gost
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  // Rezervacija
  dateFrom?: string;
  dateTo?: string;
  guests?: number;
  message?: string;
  // Za potrditev/zavrnitev
  reservationId?: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY ni nastavljen v okolju.");
    }

    const payload: BookingEmailPayload = await req.json();

    // Validate required fields
    if (!payload.farmOwnerEmail || !payload.guestName || !payload.farmName) {
      return new Response(
        JSON.stringify({ error: "Manjkajoča obvezna polja: farmOwnerEmail, guestName, farmName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subject: string;
    let html: string;
    let toEmail: string;

    switch (payload.type) {
      case "novo_povprasevanje":
        subject = `Novo povpraševanje — ${payload.guestName} | NaKmetiji`;
        html = bookingEmailHtml({
          farmName: payload.farmName,
          guestName: payload.guestName,
          guestEmail: payload.guestEmail,
          guestPhone: payload.guestPhone,
          dateFrom: payload.dateFrom,
          dateTo: payload.dateTo,
          guests: payload.guests,
          message: payload.message,
        });
        toEmail = payload.farmOwnerEmail;
        break;

      case "potrditev":
        subject = `Vaša rezervacija je potrjena — ${payload.farmName} | NaKmetiji`;
        html = statusEmailHtml({
          farmName: payload.farmName,
          guestName: payload.guestName,
          status: "potrjena",
          dateFrom: payload.dateFrom,
          dateTo: payload.dateTo,
        });
        toEmail = payload.guestEmail;
        break;

      case "zavrnitev":
        subject = `Posodobitev rezervacije — ${payload.farmName} | NaKmetiji`;
        html = statusEmailHtml({
          farmName: payload.farmName,
          guestName: payload.guestName,
          status: "zavrnjena",
          dateFrom: payload.dateFrom,
          dateTo: payload.dateTo,
        });
        toEmail = payload.guestEmail;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Neveljaven tip emaila" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Send via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NaKmetiji <obvestila@nakmetiji.si>",
        to: [toEmail],
        subject,
        html,
        reply_to: payload.type === "novo_povprasevanje" ? payload.guestEmail : undefined,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error("Resend API napaka:", errorBody);
      return new Response(
        JSON.stringify({ error: "Pošiljanje emaila ni uspelo", details: errorBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge Function napaka:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
