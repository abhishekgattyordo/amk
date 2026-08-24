import React, { useState } from 'react';

export interface UserAvatarProps {
  name?: string;
  username?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  textClassName?: string;
  showStatus?: boolean;
}

/**
 * Calculates initials based on Avatar Rules:
 * - Display the first letter of the user's first name.
 * - If the first name is unavailable, display the first letter of the username.
 * - If both first and last names are available, display the initials (e.g., AB, RK).
 */
export function getInitials(name?: string, username?: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const firstInitial = parts[0][0];
      const lastInitial = parts[parts.length - 1][0];
      return (firstInitial + lastInitial).toUpperCase();
    } else if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }

  if (username && username.trim().length > 0) {
    const cleaned = username.trim().split('@')[0];
    const parts = cleaned.split(/[\._\-\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }

  return 'A';
}

const COLOR_PALETTES = [
  'bg-emerald-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white',
  'bg-blue-600 text-white',
  'bg-cyan-600 text-white',
  'bg-slate-700 text-white',
  'bg-violet-600 text-white',
];

export function getAvatarColor(keyString: string): string {
  if (!keyString) return 'bg-emerald-600 text-white';
  let hash = 0;
  for (let i = 0; i < keyString.length; i++) {
    hash = keyString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  username,
  src,
  size = 'md',
  className = '',
  textClassName = '',
  showStatus = false
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name, username);
  const colorClass = getAvatarColor(name || username || initials);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  // Check if src is valid and not a default unsplash placeholder or empty
  const isDefaultUnsplash = src && (src.includes('unsplash.com') || src.trim() === '');
  const hasValidImage = src && !isDefaultUnsplash && !imgError;

  if (hasValidImage) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClass} ${className}`}>
        <img
          src={src}
          alt={name || username || 'User avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover ring-2 ring-emerald-500/20"
        />
        {showStatus && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full shrink-0 font-bold uppercase tracking-wider select-none shadow-sm ${sizeClass} ${colorClass} ${className}`}>
      <span className={textClassName}>{initials}</span>
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
      )}
    </div>
  );
};
