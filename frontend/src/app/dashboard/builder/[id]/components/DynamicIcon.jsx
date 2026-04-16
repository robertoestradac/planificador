'use client';
import { useState, useEffect } from 'react';
import { getIconComponent } from './iconRegistry';

// In-memory component cache keyed by icon name
const componentCache = {};

export default function DynamicIcon({ name, size = 24, color, className = '', style = {}, ...props }) {
  const [Icon, setIcon] = useState(() => componentCache[name] || null);

  useEffect(() => {
    if (!name) { setIcon(null); return; }

    // Already cached
    if (componentCache[name]) {
      setIcon(() => componentCache[name]);
      return;
    }

    let cancelled = false;
    getIconComponent(name).then(comp => {
      if (comp) componentCache[name] = comp;
      if (!cancelled) setIcon(() => comp);
    });
    return () => { cancelled = true; };
  }, [name]);

  if (!Icon) return null;
  return <Icon size={size} color={color} className={className} style={style} {...props} />;
}
