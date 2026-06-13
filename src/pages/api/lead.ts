export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// site configuration
const SITE_DOMAIN = 'borne-recharge-nord.fr';
const SITE_NICHE = 'borne-recharge';
const DEPT_CODE = '59';
const CP_PATTERN = /^59\d{3}$/;

// ViteUnDevis API
const VUD_API_KEY = '17695301406978e31c715766978e31c715ae';
const VUD_API_URL = 'https://www.viteundevis.com/api/get.php';
const VUD_PING_URL = 'https://www.viteundevis.com/api/ping.php';

// Supabase
const SUPABASE_URL = 'https://nhmvgsrwhjsjnpncpiaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5obXZnc3J3aGpzam5wbmNwaWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTY0NjQsImV4cCI6MjA4MzU3MjQ2NH0.qpG5CJDNa53BB7ZpDy414GL3hmb51omxqPrnrrd7O6I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CAT_NAMES: Record<number, string> = {
  281: 'Pose de borne de recharge',
  282: 'Pose de prise de recharge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.json();
    const {
      nom, prenom, email, tel, adresse, cp, ville,
      catId, typeBien, situation, chauffageActuel, delais,
      pageUrl,
    } = rawBody;

    // ── Server-side validation ──
    const errors: string[] = [];
    if (!nom || nom.trim().length < 2) errors.push('Nom requis (2 caractères minimum)');
    if (!prenom || prenom.trim().length < 2) errors.push('Prénom requis (2 caractères minimum)');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide');
    if (!tel || tel.replace(/\D/g, '').length < 10) errors.push('Téléphone invalide (10 chiffres minimum)');
    if (!adresse || adresse.trim().length < 5) errors.push('Adresse complète requise');
    if (!cp || !CP_PATTERN.test(cp)) errors.push(`Code postal invalide (doit commencer par ${DEPT_CODE})`);
    if (!ville || ville.trim().length < 2) errors.push('Ville requise');
    if (!catId) errors.push('Projet requis');

    if (errors.length > 0) {
      return new Response(JSON.stringify({ success: false, errors }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    const cleanTel = tel.replace(/\D/g, '');
    const isMobile = cleanTel.startsWith('06') || cleanTel.startsWith('07') || cleanTel.startsWith('336') || cleanTel.startsWith('337');

    const workDescription = `Projet: Installation recharge VE en ${ville} (${cp}). Configuration: ${chauffageActuel || 'Non renseigné'}. Délai souhaité: ${
      delais === '1' ? 'Immédiat' : delais === '2' ? 'Moins de 3 mois' : 'Plus de 3 mois'
    }. Adresse chantier: ${adresse}, ${cp} ${ville}.`;

    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // ══════════════════════════════════════════════════════════════
    // ÉTAPE 1 : INSERT dans Supabase
    // ══════════════════════════════════════════════════════════════
    let supabaseId = null;
    const delaisLabel = delais === '1' ? 'Immédiat' : delais === '2' ? 'Moins de 3 mois' : 'Plus de 3 mois';
    const typeBienLabel = typeBien === '1' ? 'Maison' : 'Appartement';
    const situationLabel = situation === '1' ? 'Propriétaire occupant' : situation === '2' ? 'Locataire' : 'Propriétaire bailleur';

    try {
      const supabasePayload = {
        source_site: SITE_DOMAIN,
        niche: SITE_NICHE,
        nom: nom.trim(),
        prenom: (prenom || '').trim(),
        email: email.trim(),
        telephone: cleanTel,
        adresse: (adresse || '').trim(),
        ville: ville.trim(),
        code_postal: cp,
        departement: 'Nord',
        cat_id: Number(catId),
        cat_name: CAT_NAMES[Number(catId)] || `Catégorie ${catId}`,
        type_bien: typeBienLabel,
        situation: situationLabel,
        chauffage_actuel: chauffageActuel || null,
        delais: delaisLabel,
        description: workDescription,
        ip_address: clientIp,
        user_agent: userAgent,
        page_url: pageUrl || `https://${SITE_DOMAIN}`,
        vud_status: 'pending',
      };

      const { data: sbData, error: sbError } = await supabase
        .from('rank_rent_leads')
        .insert(supabasePayload)
        .select('id');

      if (sbError) {
        console.error('[Supabase] Insert error:', sbError);
      } else {
        supabaseId = sbData?.[0]?.id || null;
        console.log(`[Supabase] Lead saved: ${supabaseId}`);
      }
    } catch (sbErr) {
      console.error('[Supabase] Insert exception:', sbErr);
    }

    // ══════════════════════════════════════════════════════════════
    // ÉTAPE 2 : PING ViteUnDevis
    // ══════════════════════════════════════════════════════════════
    let pingResult = { accept: 0, recommande: 1, cpl: '0', ecpl: '0', buyers: 0 };
    try {
      const pingBody = new URLSearchParams({
        token: VUD_API_KEY,
        cat_id: String(catId),
        code_postal: cp,
        pays: 'fr',
        description: workDescription,
        cpl_mini: '0',
      });

      const pingRes = await fetch(VUD_PING_URL, {
        method: 'POST',
        body: pingBody,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (pingRes.ok) {
        const pingJson = await pingRes.json() as any;
        pingResult = {
          accept: pingJson.accept || 0,
          recommande: pingJson.recommande || 1,
          cpl: pingJson.cpl || '0',
          ecpl: pingJson.ecpl || '0',
          buyers: pingJson.nb_buyers || 0,
        };
      }
    } catch (e) {
      console.error('[VUD] Ping error:', e);
    }

    // ══════════════════════════════════════════════════════════════
    // ÉTAPE 3 : POST lead à ViteUnDevis API
    // ══════════════════════════════════════════════════════════════
    const vudPayload = new URLSearchParams({
      key: VUD_API_KEY,
      cat_id: String(catId),
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim(),
      tel: isMobile ? '' : cleanTel,
      mobile: isMobile ? cleanTel : '',
      adresse1: adresse.trim(),
      adresse2: '',
      cp: cp,
      ville: ville.trim(),
      cp_projet: cp,
      ville_projet: ville.trim(),
      pays: 'fr',
      tp: '1',
      type_bien: typeBien || '1',
      situation: situation || '1',
      delais: delais || '2',
      terrain: '0',
      permis: '3',
      description: workDescription,
      site_name: SITE_DOMAIN,
      format_return: 'json',
      matin: '1',
      midi: '1',
      soir: '1',
      we: '0',
    });

    let vudData: any = null;
    let vudSuccess = false;
    let devisId = '';
    let devisHash = '';

    try {
      const vudRes = await fetch(VUD_API_URL, {
        method: 'POST',
        body: vudPayload,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': `partenaire-apivud-${VUD_API_KEY}`,
        },
      });

      const vudText = await vudRes.text();
      vudData = JSON.parse(vudText);

      const code = vudData?.code_retour?.[0]?.code?.toString();
      if (code === '200') {
        vudSuccess = true;
        devisId = vudData?.devis_data?.devis_id || '';
        devisHash = vudData?.devis_data?.devis_hash || '';
      }
    } catch (parseError) {
      console.error('[VUD] POST or Parse error:', parseError);
      return new Response(JSON.stringify({
        success: false,
        errors: ['Réponse invalide de la plateforme partenaire. Veuillez réessayer.'],
      }), { status: 502, headers: CORS_HEADERS });
    }

    // ══════════════════════════════════════════════════════════════
    // ÉTAPE 4 : UPDATE Supabase avec les résultats VUD
    // ══════════════════════════════════════════════════════════════
    if (supabaseId) {
      try {
        const updatePayload = {
          vud_ping_accept: pingResult.accept === 1,
          vud_ping_recommande: pingResult.recommande === 1,
          vud_ping_cpl: Number(pingResult.cpl) || 0,
          vud_ping_ecpl: Number(pingResult.ecpl) || 0,
          vud_ping_buyers: Number(pingResult.buyers) || 0,
          vud_devis_id: devisId ? `#${devisId}` : null,
          vud_devis_hash: devisHash || null,
          vud_status: vudSuccess ? 'sent' : 'error',
          vud_response: vudData,
          vud_cpl: Number(pingResult.cpl) || 0,
          vud_validated: vudSuccess,
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('rank_rent_leads')
          .update(updatePayload)
          .eq('id', supabaseId);

        console.log(`[Supabase] Lead updated with VUD results: ${supabaseId}`);
      } catch (updateErr) {
        console.error('[Supabase] Update error:', updateErr);
      }
    }

    // ── Return response ──
    if (vudSuccess) {
      return new Response(JSON.stringify({
        success: true,
        devis_id: devisId,
        devis_hash: devisHash,
        ping: {
          accept: pingResult.accept,
          recommande: pingResult.recommande,
          cpl: pingResult.cpl,
        },
      }), { status: 200, headers: CORS_HEADERS });
    } else {
      const vudErrors = (vudData?.code_retour || []).map((e: any) => e.code_texte || `Erreur ${e.code}`);
      return new Response(JSON.stringify({
        success: false,
        errors: vudErrors.length > 0 ? vudErrors : ['Le partenaire a refusé la demande.'],
      }), { status: 422, headers: CORS_HEADERS });
    }

  } catch (error) {
    console.error('[Lead API] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      errors: ['Une erreur serveur est survenue. Veuillez réessayer.'],
    }), { status: 500, headers: CORS_HEADERS });
  }
};
