import { cn } from '../../utils/cn';

const variantClasses = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-indigo-100 text-indigo-800',
  secondary: 'bg-slate-200 text-slate-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  danger: 'bg-red-100 text-red-800', // alias of error
  info: 'bg-blue-100 text-blue-800',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export type BadgeVariant = keyof typeof variantClasses;

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: keyof typeof sizeClasses;
  className?: string;
}

const Badge = ({ children, variant = 'default', size = 'md', className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
