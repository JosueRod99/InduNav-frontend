import { useQuery } from '@tanstack/react-query';
import { Award, Calendar, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { getCertificationsByArea } from '../../../api/areaCertifications';
import Badge from '../../../components/ui/Badge';

interface CertificationsTabProps {
  areaId: string;
}

const CertificationsTab = ({ areaId }: CertificationsTabProps) => {
  const { data: certifications, isLoading } = useQuery({
    queryKey: ['area-certifications', areaId],
    queryFn: () => getCertificationsByArea(areaId),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-600">Cargando certificaciones...</div>;
  }

  if (!certifications || certifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Certificaciones</h3>
        <p className="text-gray-600">Aún no hay certificaciones registradas para esta área.</p>
      </div>
    );
  }

  const activeCerts = certifications.filter((c) => c.status === 'active');
  const expiringSoon = certifications.filter(
    (c) =>
      c.status === 'active' &&
      c.expiry_date &&
      new Date(c.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Certificaciones Activas</p>
          <p className="text-3xl font-bold text-green-900">{activeCerts.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700 mb-1">Por Vencer (90 días)</p>
          <p className="text-3xl font-bold text-yellow-900">{expiringSoon.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Total</p>
          <p className="text-3xl font-bold text-blue-900">{certifications.length}</p>
        </div>
      </div>

      {/* Certifications List */}
      <div className="space-y-4">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <Award className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{cert.certification_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{cert.certification_type}</p>
                  {cert.certification_body && (
                    <p className="text-sm text-gray-500 mt-1">Emisor: {cert.certification_body}</p>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  cert.status === 'active'
                    ? 'success'
                    : cert.status === 'expired'
                    ? 'danger'
                    : 'warning'
                }
              >
                {cert.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {cert.issue_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Emisión</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {cert.expiry_date && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500">Vencimiento</p>
                    <p className={`text-sm font-medium ${new Date(cert.expiry_date) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(cert.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {cert.next_audit_date && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Próxima Auditoría</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(cert.next_audit_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {cert.last_audit_result && (
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {cert.last_audit_result === 'passed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="text-sm font-medium">Última Auditoría: {cert.last_audit_result}</span>
                </div>
                {cert.last_audit_score && (
                  <Badge variant="default">Score: {cert.last_audit_score}%</Badge>
                )}
              </div>
            )}

            {(cert.audit_findings_count > 0 || cert.corrective_actions_pending > 0) && (
              <div className="flex flex-wrap gap-4 mb-4">
                {cert.audit_findings_count > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Hallazgos:</span>
                    <Badge variant="warning">{cert.audit_findings_count}</Badge>
                  </div>
                )}
                {cert.corrective_actions_pending > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Acciones Correctivas Pendientes:</span>
                    <Badge variant="danger">{cert.corrective_actions_pending}</Badge>
                  </div>
                )}
              </div>
            )}

            {cert.notes && (
              <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded">{cert.notes}</p>
            )}

            {(cert.certificate_url || cert.audit_report_url) && (
              <div className="flex gap-2 mt-4">
                {cert.certificate_url && (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Ver Certificado
                  </a>
                )}
                {cert.audit_report_url && (
                  <a
                    href={cert.audit_report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Ver Reporte de Auditoría
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificationsTab;
