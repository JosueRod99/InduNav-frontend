import { FileText, Download, Eye } from 'lucide-react';

interface DocumentacionTabProps {
  language: 'es' | 'en';
}

const DocumentacionTab = ({ language }: DocumentacionTabProps) => {
  // Documentos de ejemplo
  const documents = [
    {
      id: 1,
      name: { es: 'Manual de Operación', en: 'Operation Manual' },
      type: 'PDF',
      size: '2.4 MB',
      category: { es: 'Operación', en: 'Operation' },
      lastUpdated: '2026-09-15',
    },
    {
      id: 2,
      name: { es: 'Normas de Seguridad ISO 45001', en: 'ISO 45001 Safety Standards' },
      type: 'PDF',
      size: '1.8 MB',
      category: { es: 'Seguridad', en: 'Safety' },
      lastUpdated: '2026-08-20',
    },
    {
      id: 3,
      name: { es: 'Procedimientos de Calidad', en: 'Quality Procedures' },
      type: 'PDF',
      size: '3.1 MB',
      category: { es: 'Calidad', en: 'Quality' },
      lastUpdated: '2026-09-01',
    },
    {
      id: 4,
      name: { es: 'Diagrama de Flujo de Proceso', en: 'Process Flow Diagram' },
      type: 'PDF',
      size: '1.2 MB',
      category: { es: 'Procesos', en: 'Processes' },
      lastUpdated: '2026-07-10',
    },
  ];

  const handleView = (_docId: number) => {
    // Aquí se implementaría la lógica para abrir el documento
  };

  const handleDownload = (_docId: number) => {
    // Aquí se implementaría la lógica para descargar el documento
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="text-sm font-semibold text-blue-700 mb-1">
          {language === 'es' ? 'Documentación del Área' : 'Area Documentation'}
        </h3>
        <p className="text-xs text-slate-600">
          {language === 'es'
            ? 'Accede a manuales, normas y procedimientos relacionados con esta área'
            : 'Access manuals, standards and procedures related to this area'}
        </p>
      </div>

      {/* Documents List */}
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-md border border-slate-200 hover:border-blue-300 transition-colors"
          >
            <div className="p-3">
              <div className="flex items-start justify-between gap-3">
                {/* Document Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 bg-blue-50 rounded p-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 mb-1 truncate">
                      {doc.name[language]}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        {doc.category[language]}
                      </span>
                      <span>{doc.type}</span>
                      <span>{doc.size}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === 'es' ? 'Actualizado: ' : 'Updated: '}
                      {new Date(doc.lastUpdated).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleView(doc.id)}
                    className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                    title={language === 'es' ? 'Ver' : 'View'}
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc.id)}
                    className="p-1.5 rounded hover:bg-blue-50 transition-colors"
                    title={language === 'es' ? 'Descargar' : 'Download'}
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-900 mb-1">
              {language === 'es' ? 'Acceso a Documentos' : 'Document Access'}
            </p>
            <p className="text-xs text-blue-800">
              {language === 'es'
                ? 'Todos los documentos están disponibles para consulta. Para descargarlos, asegúrate de tener los permisos necesarios.'
                : 'All documents are available for consultation. To download them, make sure you have the necessary permissions.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentacionTab;
