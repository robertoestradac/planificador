'use client';
import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import useSettingsStore from '@/store/settingsStore';

/* Hook: auto-fetches settings and returns them */
export function useAppSettings() {
  const { settings, loaded, fetch } = useSettingsStore();
  useEffect(() => {
    if (!loaded) {
      fetch();
    }
  }, [loaded, fetch]);
  return settings;
}

/* Reusable branding block: logo + app name */
export default function AppBranding({
  size    = 'md',
  dark    = false,
  className = '',
  showTagline = false,
}) {
  const settings = useAppSettings();

  const wrapSize  = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const iconSize  = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  const nameClass = size === 'sm'
    ? 'text-xs font-bold'
    : size === 'lg' ? 'text-lg font-bold' : 'text-sm font-bold';
  const nameColor = dark ? 'text-white' : 'text-gray-900';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${wrapSize} rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        {settings.logo_url
          ? <img src={settings.logo_url} alt={settings.app_name} className="w-full h-full object-cover" />
          : <Sparkles className={`${iconSize} text-white`} />
        }
      </div>
      <div>
        <p className={`${nameClass} ${nameColor} leading-none`}>{settings.app_name}</p>
        {showTagline && settings.tagline && (
          <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{settings.tagline}</p>
        )}
      </div>
    </div>
  );
}

/* Tiny logo-only version for footers */
export function AppLogo({ size = 28, className = '' }) {
  const settings = useAppSettings();
  return (
    <div
      className={`rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {settings.logo_url
        ? <img src={settings.logo_url} alt={settings.app_name} className="w-full h-full object-cover" />
        : <Sparkles style={{ width: size * 0.55, height: size * 0.55 }} className="text-white" />
      }
    </div>
  );
}
