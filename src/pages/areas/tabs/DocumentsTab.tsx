import { FileText, Download, Calendar } from 'lucide-react';
import Badge from '../../../components/ui/Badge';

interface DocumentsTabProps {
  areaId: string;
}

const DocumentsTab = ({ areaId }: DocumentsTabProps) => {
  // TODO: Implement documents fetching when area_documents API is ready
  // For now, showing placeholder

  return (
    <div className="text-center py-12">
      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Documentos del Área</h3>
      <p className="text-gray-600 mb-4">
        Aquí se mostrarán SOPs, manuales, instrucciones de trabajo y otros documentos.
      </p>
      <p className="text-sm text-gray-500">Funcionalidad en desarrollo</p>
    </div>
  );
};

export default DocumentsTab;
