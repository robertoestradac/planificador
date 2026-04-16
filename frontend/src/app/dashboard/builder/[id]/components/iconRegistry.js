/**
 * Icon Registry — maps all react-icons packs for lazy loading.
 * Icons are stored by full name (e.g. "LuHeart", "FaHome", "MdSearch").
 * The prefix determines which pack to dynamically import.
 */

export const ICON_PACKS = [
  { id: 'lu',  name: 'Lucide',            prefix: 'Lu' },
  { id: 'tb',  name: 'Tabler',            prefix: 'Tb' },
  { id: 'hi2', name: 'Heroicons 2',       prefix: 'Hi2' },
  { id: 'fa6', name: 'Font Awesome 6',    prefix: 'Fa6' },
  { id: 'bs',  name: 'Bootstrap',         prefix: 'Bs' },
  { id: 'md',  name: 'Material Design',   prefix: 'Md' },
  { id: 'pi',  name: 'Phosphor',          prefix: 'Pi' },
  { id: 'ri',  name: 'Remix',             prefix: 'Ri' },
  { id: 'io5', name: 'Ionicons 5',        prefix: 'Io5' },
  { id: 'ai',  name: 'Ant Design',        prefix: 'Ai' },
  { id: 'bi',  name: 'BoxIcons',          prefix: 'Bi' },
  { id: 'ci',  name: 'Circum',            prefix: 'Ci' },
  { id: 'cg',  name: 'css.gg',            prefix: 'Cg' },
  { id: 'di',  name: 'Devicons',          prefix: 'Di' },
  { id: 'fi',  name: 'Feather',           prefix: 'Fi' },
  { id: 'fc',  name: 'Flat Color',        prefix: 'Fc' },
  { id: 'fa',  name: 'Font Awesome 5',    prefix: 'Fa' },
  { id: 'gi',  name: 'Game Icons',        prefix: 'Gi' },
  { id: 'go',  name: 'Octicons',          prefix: 'Go' },
  { id: 'gr',  name: 'Grommet',           prefix: 'Gr' },
  { id: 'hi',  name: 'Heroicons',         prefix: 'Hi' },
  { id: 'im',  name: 'IcoMoon',           prefix: 'Im' },
  { id: 'lia', name: 'Line Awesome',      prefix: 'Lia' },
  { id: 'io',  name: 'Ionicons 4',        prefix: 'Io' },
  { id: 'rx',  name: 'Radix',             prefix: 'Rx' },
  { id: 'si',  name: 'Simple Icons',      prefix: 'Si' },
  { id: 'sl',  name: 'Simple Line',       prefix: 'Sl' },
  { id: 'tfi', name: 'Themify',           prefix: 'Tfi' },
  { id: 'ti',  name: 'Typicons',          prefix: 'Ti' },
  { id: 'vsc', name: 'VS Code',           prefix: 'Vsc' },
  { id: 'wi',  name: 'Weather',           prefix: 'Wi' },
];

// Sorted by prefix length DESC so "Fa6" matches before "Fa", "Hi2" before "Hi", etc.
const SORTED_PREFIXES = ICON_PACKS
  .map(p => ({ prefix: p.prefix, id: p.id }))
  .sort((a, b) => b.prefix.length - a.prefix.length);

/** Given an icon name like "LuHeart", return the pack id "lu" */
export function getPackIdFromName(iconName) {
  if (!iconName) return null;
  for (const { prefix, id } of SORTED_PREFIXES) {
    if (iconName.startsWith(prefix)) return id;
  }
  return null;
}

// ── Pack cache (loaded modules stay in memory) ──
const packCache = {};

/** Dynamically import a react-icons pack by id. Webpack creates a chunk per pack. */
export async function loadPack(packId) {
  if (packCache[packId]) return packCache[packId];

  let mod;
  switch (packId) {
    case 'ai':  mod = await import('react-icons/ai');  break;
    case 'bs':  mod = await import('react-icons/bs');  break;
    case 'bi':  mod = await import('react-icons/bi');  break;
    case 'ci':  mod = await import('react-icons/ci');  break;
    case 'cg':  mod = await import('react-icons/cg');  break;
    case 'di':  mod = await import('react-icons/di');  break;
    case 'fi':  mod = await import('react-icons/fi');  break;
    case 'fc':  mod = await import('react-icons/fc');  break;
    case 'fa':  mod = await import('react-icons/fa');  break;
    case 'fa6': mod = await import('react-icons/fa6'); break;
    case 'gi':  mod = await import('react-icons/gi');  break;
    case 'go':  mod = await import('react-icons/go');  break;
    case 'gr':  mod = await import('react-icons/gr');  break;
    case 'hi':  mod = await import('react-icons/hi');  break;
    case 'hi2': mod = await import('react-icons/hi2'); break;
    case 'im':  mod = await import('react-icons/im');  break;
    case 'lia': mod = await import('react-icons/lia'); break;
    case 'io':  mod = await import('react-icons/io');  break;
    case 'io5': mod = await import('react-icons/io5'); break;
    case 'lu':  mod = await import('react-icons/lu');  break;
    case 'md':  mod = await import('react-icons/md');  break;
    case 'pi':  mod = await import('react-icons/pi');  break;
    case 'rx':  mod = await import('react-icons/rx');  break;
    case 'ri':  mod = await import('react-icons/ri');  break;
    case 'si':  mod = await import('react-icons/si');  break;
    case 'sl':  mod = await import('react-icons/sl');  break;
    case 'tb':  mod = await import('react-icons/tb');  break;
    case 'tfi': mod = await import('react-icons/tfi'); break;
    case 'ti':  mod = await import('react-icons/ti');  break;
    case 'vsc': mod = await import('react-icons/vsc'); break;
    case 'wi':  mod = await import('react-icons/wi');  break;
    default: return {};
  }

  packCache[packId] = mod;
  return mod;
}

/**
 * Resolve any icon name to its React component.
 * Supports:
 *  - Full react-icons name: "LuHeart", "FaHome", "MdSearch"
 *  - Legacy lucide-react name: "Heart" → tries "LuHeart"
 */
export async function getIconComponent(iconName) {
  if (!iconName) return null;

  let packId = getPackIdFromName(iconName);
  let lookupName = iconName;

  // Backward compat: plain name like "Heart" → try as "LuHeart"
  if (!packId) {
    packId = 'lu';
    lookupName = 'Lu' + iconName;
  }

  const mod = await loadPack(packId);
  return mod[lookupName] || null;
}
