import { avatarUrl } from '../../utils/avatarUrl';

// A person's photo (face-centered) or, without one, their initials on a color picked from the name.

const COLORS = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-800'];

interface Props {
  person: { avatar_url?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined;
  size?: number; // px
  className?: string;
}

const EmployeeAvatar = ({ person, size = 36, className = '' }: Props) => {
  const src = avatarUrl(person?.avatar_url, size);
  const initials = `${person?.first_name?.[0] || ''}${person?.last_name?.[0] || ''}`.toUpperCase() || '?';
  const color = COLORS[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % COLORS.length];
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  return src ? (
    <img src={src} alt="" style={style} className={`flex-shrink-0 rounded-full object-cover ${className}`} loading="lazy" />
  ) : (
    <span style={style} className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold ${color} ${className}`} aria-hidden>
      {initials}
    </span>
  );
};

export default EmployeeAvatar;
