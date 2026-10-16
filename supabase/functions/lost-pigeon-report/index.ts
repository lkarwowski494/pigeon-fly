/**
 * PIGEON-FLY — Supabase Edge Function: Lost Pigeon Public Report & Landing Page
 * Allows anyone with a smartphone to report a found pigeon without installing the app.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const qrCodeUuid = url.searchParams.get('qr');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. GET: Serve clean mobile HTML landing page for finder
  if (req.method === 'GET') {
    if (!qrCodeUuid) {
      return new Response('Brak identyfikatora ptaka (QR UUID).', { status: 400 });
    }

    // Lookup bird ring number
    const { data: pigeon } = await supabase
      .from('pigeons')
      .select('ring_number, country_code, year, plumage_color')
      .eq('qr_code_uuid', qrCodeUuid)
      .maybeSingle();

    const ringTitle = pigeon ? `${pigeon.country_code}-${pigeon.ring_number}` : 'Gołąb Pocztowy';

    const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Znalazłem Gołębia — Pigeon-Fly</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #121417;
      color: #FFFFFF;
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #1E2127;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid #2F343F;
      box-sizing: border-box;
    }
    .badge {
      color: #E5A93C;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 1px;
    }
    h1 {
      font-size: 24px;
      margin: 8px 0 16px;
    }
    p {
      color: #A0A6B2;
      line-height: 1.5;
      font-size: 15px;
    }
    .form-group {
      margin-top: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #D4D8E0;
      margin-bottom: 6px;
    }
    input, textarea {
      width: 100%;
      background: #15171B;
      border: 1px solid #3D424D;
      border-radius: 10px;
      color: #FFFFFF;
      padding: 12px;
      font-size: 16px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      background: #E5A93C;
      color: #121417;
      font-weight: 800;
      font-size: 17px;
      border: none;
      border-radius: 12px;
      padding: 16px;
      margin-top: 20px;
      cursor: pointer;
    }
    .success-msg {
      display: none;
      background: #1B3B22;
      color: #81C784;
      padding: 16px;
      border-radius: 10px;
      font-weight: 700;
      margin-top: 16px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">PIGEON-FLY • SIEĆ POMOCY</div>
    <h1>Znalazłeś gołębia: ${ringTitle}</h1>
    <p>Ptak mógł osłabnąć w trakcie trudnego lotu lub złej pogody. Właściciel bardzo się martwi i natychmiast otrzyma Twoje powiadomienie.</p>

    <form id="reportForm">
      <input type="hidden" name="qr_code_uuid" value="${qrCodeUuid}">
      <input type="hidden" name="ring_number" value="${pigeon ? pigeon.ring_number : ''}">
      <input type="hidden" id="lat" name="latitude">
      <input type="hidden" id="lon" name="longitude">

      <div class="form-group">
        <label>Twój numer telefonu (do kontaktu z hodowcą):</label>
        <input type="tel" name="finder_phone" required placeholder="np. +48 600 000 000">
      </div>

      <div class="form-group">
        <label>Twoje imię / miejscowość:</label>
        <input type="text" name="finder_name" placeholder="np. Marek, Grójec">
      </div>

      <div class="form-group">
        <label>Stan ptaka i uwagi:</label>
        <textarea name="finder_notes" rows="3" placeholder="np. Ptak siedzi na parapecie, nakarmiony pszenicą i napojony..."></textarea>
      </div>

      <button type="submit" id="submitBtn">Powiadom Właściciela</button>
    </form>
    <div id="successBox" class="success-msg">Dziękujemy! Właściciel ptaka został powiadomiony.</div>
  </div>

  <script>
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById('lat').value = pos.coords.latitude;
        document.getElementById('lon').value = pos.coords.longitude;
      }, err => {});
    }

    document.getElementById('reportForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.innerText = 'Wysyłanie...';

      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          document.getElementById('reportForm').style.display = 'none';
          document.getElementById('successBox').style.display = 'block';
        }
      } catch (err) {
        alert('Wystąpił błąd. Spróbuj ponownie.');
        btn.disabled = false;
        btn.innerText = 'Powiadom Właściciela';
      }
    });
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // 2. POST: Ingest report and notify owner
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { qr_code_uuid, ring_number, finder_name, finder_phone, finder_notes, latitude, longitude } = body;

      const { data, error } = await supabase.from('lost_pigeon_reports').insert({
        qr_code_uuid,
        ring_number: ring_number || 'UNKNOWN',
        finder_name,
        finder_phone,
        finder_notes,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
