import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, GitBranch, Loader2, User, Wrench } from 'lucide-react';
import { getAreaProcessSteps, type AreaProcessStep } from '../../../api/processes';

// "Procesos" tab of an area: the steps of the plant processes that happen here.

const AreaProcessesTab = ({ areaId, plantId }: { areaId: string; plantId: string | null }) => {
  const { data: steps = [], isLoading } = useQuery({ queryKey: ['area-process-steps', areaId], queryFn: () => getAreaProcessSteps(areaId) });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 py-6 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando procesos…
      </p>
    );
  }

  // Group by process, keeping step order
  const byProcess = new Map<string, AreaProcessStep[]>();
  for (const step of steps) byProcess.set(step.process_id, [...(byProcess.get(step.process_id) || []), step]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">Pasos de los procesos de la planta que se realizan en esta área.</p>
        {plantId && (
          <Link to={`/plants/${plantId}/procesos`} className="text-sm font-medium text-blue-600 hover:underline">
            Ver todos los procesos
          </Link>
        )}
      </div>
      {byProcess.size === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <GitBranch className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="font-medium text-gray-900">Esta área no participa en ningún proceso</p>
          <p className="mt-1 text-sm text-gray-600">Los procesos se capturan en la pestaña Procesos de la planta; ahí se elige qué área hace cada paso.</p>
        </div>
      ) : (
        [...byProcess.values()].map((list) => {
          const first = list[0];
          return (
            <section key={first.process_id} className="rounded-lg border border-gray-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <Link
                  to={`/plants/${first.plant_id}/procesos?proceso=${first.process_id}`}
                  className="min-w-0 font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                >
                  {first.process_code && <span className="mr-2 font-mono text-xs text-blue-700">{first.process_code}</span>}
                  {first.process_name}
                </Link>
                {first.process_status === 'draft' && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">Borrador</span>}
              </div>
              <ul className="divide-y divide-gray-100">
                {list.map((step) => (
                  <li key={step.id} className="flex gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {step.step_number}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                      <p>
                        <span className="font-semibold text-gray-900">{step.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          Paso {step.step_number} de {step.total_steps}
                        </span>
                      </p>
                      {step.responsible_name && (
                        <p className="flex items-center gap-1 text-xs text-gray-600">
                          <User className="h-3 w-3" /> {step.responsible_name}
                        </p>
                      )}
                      {step.activities.length > 0 && (
                        <ul className="list-disc space-y-0.5 pl-5 text-gray-700">
                          {step.activities.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      )}
                      {(step.documents.length > 0 || step.equipment.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {step.documents.map((d) => (
                            <span key={d.id} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-gray-700">
                              <FileText className="h-3 w-3" /> {d.code || d.title}
                            </span>
                          ))}
                          {step.equipment.map((e) => (
                            <span key={e.id} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-gray-700">
                              <Wrench className="h-3 w-3" /> {e.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
};

export default AreaProcessesTab;
