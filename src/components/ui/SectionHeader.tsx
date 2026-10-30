import type { ReactNode } from 'react';

// Header of a section (plant workspace tabs and their pages): title and a short summary on the
// left, the main actions on the right at the same height. Filters and views go below it.

interface SectionHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const SectionHeader = ({ title, description, actions, className = '' }: SectionHeaderProps) => (
  <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-gray-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default SectionHeader;
