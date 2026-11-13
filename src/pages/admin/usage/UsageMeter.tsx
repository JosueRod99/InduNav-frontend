// Bar of how much of a quota is used: gray, amber from 75 %, red from 90 %

const UsageMeter = ({ used, limit, title, note }: { used: number; limit: number; title: string; note?: string }) => {
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const color = percent >= 90 ? 'bg-red-500' : percent >= 75 ? 'bg-amber-500' : 'bg-blue-600';
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-600">{percent.toLocaleString('es-MX', { maximumFractionDigits: 1 })} %</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </div>
  );
};

export default UsageMeter;
