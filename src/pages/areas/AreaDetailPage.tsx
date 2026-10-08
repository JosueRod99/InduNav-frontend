import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import { getArea } from '../../api/areas';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

// Tab components
import GeneralTab from './tabs/GeneralTab';
import PersonalTab from './tabs/PersonalTab';
import SafetyTab from './tabs/SafetyTab';
import CertificationsTab from './tabs/CertificationsTab';
import DocumentsTab from './tabs/DocumentsTab';
import GalleryTab from './tabs/GalleryTab';

type TabType = 'general' | 'personal' | 'safety' | 'certifications' | 'documents' | 'gallery';

const AreaDetailPage = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Fetch area details
  const { data: area, isLoading, error } = useQuery({
    queryKey: ['organizational-area', areaId],
    queryFn: () => getArea(areaId!, true),
    enabled: !!areaId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Cargando información del área...</div>
      </div>
    );
  }

  if (error || !area) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-600 mb-4">Error al cargar el área</div>
        <Button onClick={() => navigate('/areas')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Áreas
        </Button>
      </div>
    );
  }

  const tabs: Array<{ id: TabType; label: string; icon?: string }> = [
    { id: 'general', label: 'General' },
    { id: 'personal', label: 'Personal' },
    { id: 'safety', label: 'Seguridad' },
    { id: 'certifications', label: 'Certificaciones' },
    { id: 'documents', label: 'Documentos' },
    { id: 'gallery', label: 'Galería' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab area={area} />;
      case 'personal':
        return <PersonalTab areaId={areaId!} area={area} />;
      case 'safety':
        return <SafetyTab areaId={areaId!} />;
      case 'certifications':
        return <CertificationsTab areaId={areaId!} />;
      case 'documents':
        return <DocumentsTab areaId={areaId!} />;
      case 'gallery':
        return <GalleryTab areaId={areaId!} area={area} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={() => navigate('/areas')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            {area.code && (
              <Badge variant="secondary" className="font-mono">
                {area.code}
              </Badge>
            )}
            <Badge
              variant={area.area_type === 'production' ? 'success' : 'default'}
            >
              {area.area_type}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{area.name}</h1>
          {area.description && (
            <p className="mt-2 text-gray-600">{area.description}</p>
          )}
          {area.supervisor && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Supervisor:</span>
              <span className="font-semibold text-gray-900">
                {area.supervisor.first_name} {area.supervisor.last_name}
              </span>
              {area.supervisor.position && (
                <span className="text-gray-500">• {area.supervisor.position}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AreaDetailPage;
