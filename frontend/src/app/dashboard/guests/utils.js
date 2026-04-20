/**
 * Guest module helpers
 */

/**
 * Build public RSVP URL for a guest.
 * Format: /i/{slug}?g={guestId}
 */
export function buildGuestLink(slug, guestId) {
  if (typeof window === 'undefined' || !slug || !guestId) return '';
  return `${window.location.origin}/i/${slug}?g=${guestId}`;
}

/**
 * Compose a WhatsApp share link.
 * Strips non-numeric chars from phone.
 */
export function buildWhatsAppUrl(phone, message) {
  const p = (phone || '').replace(/[^\d]/g, '');
  const msg = encodeURIComponent(message || '');
  if (p) return `https://wa.me/${p}?text=${msg}`;
  return `https://wa.me/?text=${msg}`;
}

/**
 * QR image URL via public service (no extra dependency).
 * Returns an <img>-compatible src.
 */
export function buildQrUrl(text, size = 240) {
  const t = encodeURIComponent(text || '');
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${t}`;
}

/**
 * Simple CSV parser. Supports quoted fields with commas/newlines.
 */
export function parseCsv(text) {
  if (!text) return { headers: [], rows: [] };
  // Strip BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      field += ch;
    } else {
      if (ch === '"') { inQuotes = true; continue; }
      if (ch === ',') { cur.push(field); field = ''; continue; }
      if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        cur.push(field); field = '';
        if (cur.length > 0 && !(cur.length === 1 && cur[0] === '')) rows.push(cur);
        cur = [];
        continue;
      }
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }

  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows.shift().map(h => (h || '').trim().toLowerCase());
  const mapped = rows
    .filter(r => r.some(v => (v || '').trim().length))
    .map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] || '').trim(); });
      return obj;
    });
  return { headers, rows: mapped };
}

/**
 * Normalize CSV row headers to guest fields.
 * Accepts Spanish and English common header variants.
 */
export const CSV_HEADER_MAP = {
  // Name
  name: 'name', nombre: 'name', 'nombre completo': 'name',
  // Email
  email: 'email', correo: 'email', 'e-mail': 'email',
  // Phone
  phone: 'phone', telefono: 'phone', teléfono: 'phone', tel: 'phone', celular: 'phone', whatsapp: 'phone',
  // Party size
  party_size: 'party_size', 'party size': 'party_size', acompanantes: 'party_size', acompañantes: 'party_size', pases: 'party_size', pax: 'party_size', personas: 'party_size',
  // Group
  group: 'group_name', group_name: 'group_name', grupo: 'group_name', familia: 'group_name', categoria: 'group_name', categoría: 'group_name',
  // Dietary
  dietary: 'dietary_restrictions', dietary_restrictions: 'dietary_restrictions', restricciones: 'dietary_restrictions', dieta: 'dietary_restrictions', alergia: 'dietary_restrictions', alergias: 'dietary_restrictions',
  // Notes
  notes: 'notes', notas: 'notes', observaciones: 'notes',
};

export function mapCsvRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const target = CSV_HEADER_MAP[k.toLowerCase()];
    if (!target) continue;
    if (v === '' || v === null || v === undefined) continue;
    if (target === 'party_size') {
      const n = parseInt(v, 10);
      if (!isNaN(n) && n > 0) out.party_size = n;
    } else {
      out[target] = v;
    }
  }
  return out;
}

/**
 * Default WhatsApp message template for a guest.
 */
export function defaultWhatsAppMessage({ name, eventTitle, link }) {
  return `Hola ${name || ''} 👋\n\nTe invitamos a ${eventTitle || 'nuestro evento'}.\n\nConfirma tu asistencia aquí:\n${link}`;
}
