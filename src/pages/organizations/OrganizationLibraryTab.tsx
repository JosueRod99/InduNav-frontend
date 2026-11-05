import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import SectionHeader from '../../components/ui/SectionHeader';
import { deleteSystemCertification, formatDate, getOrganizationCertifications, STATUS_CLASSES, STATUS_LABELS, type SystemCertification } from '../../api/certifications';
import SystemCertificationModal from '../certifications/SystemCertificationModal';
import PlantDocumentsTab from '../documents/PlantDocumentsTab';
import { useCan } from '../../hooks/usePermissions';

// "Documentos y certificaciones" tab of the organization page: what applies to the whole company.
// It works without plants; what belongs to one plant or area stays in that plant's own tabs.

const thClass = 'px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500';

const OrganizationLibraryTab = ({ organization }: { organization: { id: string; name: string } }) => {
  const queryClient = useQueryClient();
  const can = useCan();
  const canEdit = can('certifications.update');
  const [modal, setModal] = useState<{ open: boolean; certification: SystemCertification | null }>({ open: false, certification: null });

  const { data, isLoading } = useQuery({
    queryKey: ['plant-certifications', 'organization', organization.id],
    queryFn: () => getOrganizationCertifications(organization.id),
  });
  const remove = useMutation({
    mutationFn: deleteSystemCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plant-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['organization-summary'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'No se pudo quitar'),
  });

  const certifications = data?.system || [];
  const statusBadge = (c: SystemCertification) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[c.effective_status]}`}>{STATUS_LABELS[c.effective_status]}</span>;
  const actions = (c: SystemCertification) =>
    canEdit && (
      <div className="flex items-center justify-end gap-3">
        <button onClick={() => setModal({ open: true, certification: c })} className="text-gray-600 hover:text-gray-900" title="Editar" aria-label={`Editar ${c.name}`}>
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => window.confirm(`¿Quitar "${c.name}"?`) && remove.mutate(c.id)} className="text-red-600 hover:text-red-900" title="Quitar" aria-label={`Quitar ${c.name}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  const details = (c: SystemCertification) => [c.issuing_body, c.certificate_number && `No. ${c.certificate_number}`].filter(Boolean).join(' · ');

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionHeader
          title="Certificaciones de la empresa"
          description="Normas y sistemas que cubren toda la empresa (ISO 9001, FSC…). Las de una planta, un área o una persona se manejan dentro de cada planta."
          actions={
            canEdit && (
              <Button onClick={() => setModal({ open: true, certification: null })} className="gap-2">
                <Plus className="h-4 w-4" /> Nueva certificación
              </Button>
            )
          }
        />
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {isLoading ? (
            <p className="flex items-center justify-center gap-2 p-8 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando certificaciones…
            </p>
          ) : certifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-600">Sin certificaciones de toda la empresa.</p>
          ) : (
            <>
              <table className="hidden min-w-full divide-y divide-gray-100 text-sm md:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={thClass}>Certificación</th>
                    <th className={thClass}>Estado</th>
                    <th className={thClass}>Vence</th>
                    <th className={thClass}>Próxima auditoría</th>
                    {canEdit && <th className="px-4 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {certifications.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{details(c)}</p>
                      </td>
                      <td className="px-4 py-2">{statusBadge(c)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">{formatDate(c.expiry_date)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-gray-700">{formatDate(c.next_audit_date)}</td>
                      {canEdit && <td className="whitespace-nowrap px-4 py-2">{actions(c)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-gray-100 md:hidden">
                {certifications.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{details(c)}</p>
                      </div>
                      {actions(c)}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                      {statusBadge(c)}
                      <span>Vence {formatDate(c.expiry_date)}</span>
                      {c.next_audit_date && <span>Auditoría {formatDate(c.next_audit_date)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <PlantDocumentsTab organization={organization} />

      <SystemCertificationModal isOpen={modal.open} onClose={() => setModal({ open: false, certification: null })} organizationId={organization.id} certification={modal.certification} />
    </div>
  );
};

export default OrganizationLibraryTab;
