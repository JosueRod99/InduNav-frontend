import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, MapPin, User, Wrench } from 'lucide-react';
import type { ProcessStep } from '../../api/processes';
import { useBackState } from '../../hooks/useBackNavigation';

// Steps of a process as a vertical list, like the product process steps: number, name, area and
// responsible; details (activities, documents, equipment) open on demand.

const ProcessStepsList = ({ steps }: { steps: ProcessStep[] }) => {
  const backState = useBackState(); // area / equipment pages opened from here return here
  const [open, setOpen] = useState<Set<string>>(() => new Set(steps.slice(0, 1).map((s) => s.id)));
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!steps.length) return <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">Este proceso todavía no tiene pasos.</p>;

  return (
    <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {steps.map((step, index) => {
        const hasDetails = !!step.description || step.activities.length > 0 || step.documents.length > 0 || step.equipment.length > 0;
        const isOpen = open.has(step.id);
        return (
          <li key={step.id} className="relative p-3">
            {/* Line joining the step numbers */}
            {index < steps.length - 1 && <span className="absolute left-[1.75rem] top-11 bottom-0 w-px bg-blue-100" aria-hidden />}
            <div className="flex items-start gap-3">
              <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {step.step_number}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => hasDetails && toggle(step.id)}
                  className={`flex w-full items-start gap-1 text-left ${hasDetails ? '' : 'cursor-default'}`}
                  aria-expanded={hasDetails ? isOpen : undefined}
                >
                  {hasDetails &&
                    (isOpen ? <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />)}
                  <span className="text-sm font-semibold text-gray-900">{step.name}</span>
                </button>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  {step.area_id ? (
                    <Link to={`/areas/${step.area_id}`} state={backState} className="inline-flex items-center gap-1 hover:text-blue-700 hover:underline">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {step.area_name}
                      {step.area_code && <span className="text-gray-400">({step.area_code})</span>}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <MapPin className="h-3 w-3" /> Sin área
                    </span>
                  )}
                  {step.responsible_name && (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3 text-gray-400" />
                      {step.responsible_name}
                      {step.responsible_position && <span className="text-gray-400">· {step.responsible_position}</span>}
                    </span>
                  )}
                  {!isOpen && step.activities.length > 0 && <span className="text-gray-400">{step.activities.length} actividades</span>}
                </div>

                {isOpen && hasDetails && (
                  <div className="mt-3 space-y-3 text-sm">
                    {step.description && <p className="whitespace-pre-line text-gray-700">{step.description}</p>}
                    {step.activities.length > 0 && (
                      <ul className="list-disc space-y-1 pl-5 text-gray-700">
                        {step.activities.map((activity, i) => (
                          <li key={i}>{activity}</li>
                        ))}
                      </ul>
                    )}
                    {step.documents.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {step.documents.map((doc) => {
                          const label = (
                            <>
                              <FileText className="h-3.5 w-3.5" />
                              {doc.code && <span className="font-mono font-semibold">{doc.code}</span>}
                              <span className="max-w-[16rem] truncate">{doc.title}</span>
                              {!doc.file_url && <span className="text-amber-700">· sin archivo</span>}
                            </>
                          );
                          return doc.file_url ? (
                            <a
                              key={doc.id}
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
                            >
                              {label}
                            </a>
                          ) : (
                            <span key={doc.id} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600">
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {step.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {step.equipment.map((eq) => (
                          <Link
                            key={eq.id}
                            to={`/equipment/${eq.id}`}
                            state={backState}
                            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            {eq.name}
                            <span className="font-mono text-gray-400">{eq.code}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default ProcessStepsList;
