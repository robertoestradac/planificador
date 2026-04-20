/**
 * Country dial codes — focused on the Americas (Central, North, South).
 * Ordered by region, then alphabetically. The first entry is the default.
 */
export const COUNTRY_CODES = [
  // Central America (default: Guatemala)
  { code: '+502', flag: '🇬🇹', country: 'Guatemala' },
  { code: '+501', flag: '🇧🇿', country: 'Belice' },
  { code: '+503', flag: '🇸🇻', country: 'El Salvador' },
  { code: '+504', flag: '🇭🇳', country: 'Honduras' },
  { code: '+505', flag: '🇳🇮', country: 'Nicaragua' },
  { code: '+506', flag: '🇨🇷', country: 'Costa Rica' },
  { code: '+507', flag: '🇵🇦', country: 'Panamá' },

  // North America
  { code: '+1',   flag: '🇺🇸', country: 'Estados Unidos / Canadá' },
  { code: '+52',  flag: '🇲🇽', country: 'México' },

  // Caribbean (common among diaspora)
  { code: '+53',  flag: '🇨🇺', country: 'Cuba' },
  { code: '+1809',flag: '🇩🇴', country: 'República Dominicana' },
  { code: '+1787',flag: '🇵🇷', country: 'Puerto Rico' },

  // South America
  { code: '+54',  flag: '🇦🇷', country: 'Argentina' },
  { code: '+591', flag: '🇧🇴', country: 'Bolivia' },
  { code: '+55',  flag: '🇧🇷', country: 'Brasil' },
  { code: '+56',  flag: '🇨🇱', country: 'Chile' },
  { code: '+57',  flag: '🇨🇴', country: 'Colombia' },
  { code: '+593', flag: '🇪🇨', country: 'Ecuador' },
  { code: '+592', flag: '🇬🇾', country: 'Guyana' },
  { code: '+595', flag: '🇵🇾', country: 'Paraguay' },
  { code: '+51',  flag: '🇵🇪', country: 'Perú' },
  { code: '+597', flag: '🇸🇷', country: 'Surinam' },
  { code: '+598', flag: '🇺🇾', country: 'Uruguay' },
  { code: '+58',  flag: '🇻🇪', country: 'Venezuela' },

  // Europa / otros (opcional, por si el anfitrión tiene invitados fuera)
  { code: '+34',  flag: '🇪🇸', country: 'España' },
];

export const DEFAULT_COUNTRY_CODE = '+502';

/**
 * Split a raw phone string like "+502 1234 5678" or "+1234 567 8900"
 * into { code, number }. If no known code matches, returns default code + raw.
 */
export function splitPhone(raw) {
  if (!raw) return { code: DEFAULT_COUNTRY_CODE, number: '' };
  const trimmed = String(raw).trim();

  // Try to match the longest known prefix first
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.code)) {
      const rest = trimmed.slice(c.code.length).trim();
      return { code: c.code, number: rest };
    }
    // Allow "+502-xxxx" without space
    if (trimmed.startsWith(c.code + '-') || trimmed.startsWith(c.code + ' ')) {
      const rest = trimmed.slice(c.code.length).replace(/^[\s-]+/, '');
      return { code: c.code, number: rest };
    }
  }

  // No known code: treat as local number
  if (trimmed.startsWith('+')) return { code: DEFAULT_COUNTRY_CODE, number: trimmed };
  return { code: DEFAULT_COUNTRY_CODE, number: trimmed };
}

/**
 * Join a country code and a local number into a canonical phone string.
 * Returns '' if number is empty (so the DB gets NULL, not just the code).
 */
export function joinPhone(code, number) {
  const n = (number || '').trim();
  if (!n) return '';
  return `${code} ${n}`;
}
