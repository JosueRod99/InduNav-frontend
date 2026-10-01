import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { OrgChart } from 'd3-org-chart';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';
import { getOrgChart, type OrgChartNode } from '../../api/employees';
import Button from '../../components/ui/Button';

const OrgChartPage = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const chartRef = useRef<HTMLDivElement>(null);
  const orgChartInstance = useRef<any>(null);

  // Fetch organizations
  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  // Fetch plants for selected organization
  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ limit: 100, organization_id: selectedOrg }),
    enabled: !!selectedOrg,
  });

  // Fetch org chart data for selected organization and plant
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['orgChart', selectedOrg, selectedPlant],
    queryFn: () => getOrgChart(selectedOrg, selectedPlant || undefined),
    enabled: !!selectedOrg,
  });

  useEffect(() => {
    if (!chartRef.current || !chartData || chartData.length === 0) return;

    // Clear existing chart
    chartRef.current.innerHTML = '';

    // Create org chart instance
    const chart = new OrgChart();

    orgChartInstance.current = chart
      .container(chartRef.current)
      .data(chartData)
      .nodeWidth(() => 250)
      .nodeHeight(() => 120)
      .childrenMargin(() => 50)
      .compactMarginBetween(() => 35)
      .compactMarginPair(() => 30)
      .neighbourMargin(() => 50)
      .nodeContent((d: any) => {
        const node: OrgChartNode = d.data;
        return `
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            padding: 16px;
            width: 100%;
            height: 100%;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            color: white;
          ">
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
              ${node.name}
            </div>
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">
              ${node.position}
            </div>
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">
              ${node.department}
            </div>
            <div style="font-size: 11px; opacity: 0.7; font-family: monospace;">
              ${node.employee_number}
            </div>
            ${node.plant ? `
              <div style="
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.3);
                font-size: 11px;
                opacity: 0.8;
              ">
                📍 ${node.plant}${node.area ? ` - ${node.area}` : ''}
              </div>
            ` : ''}
          </div>
        `;
      })
      .render();

  }, [chartData]);

  // Reset plant when organization changes
  useEffect(() => {
    setSelectedPlant('');
  }, [selectedOrg]);

  const handleZoomIn = () => {
    if (orgChartInstance.current) {
      orgChartInstance.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (orgChartInstance.current) {
      orgChartInstance.current.zoomOut();
    }
  };

  const handleFit = () => {
    if (orgChartInstance.current) {
      orgChartInstance.current.fit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organigrama</h2>
            <p className="mt-1 text-sm text-gray-600">
              Visualiza la estructura jerárquica de la organización
            </p>
          </div>

          {selectedOrg && chartData && chartData.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleZoomIn} variant="outline" className="gap-2">
                <ZoomIn className="h-4 w-4" />
                Acercar
              </Button>
              <Button onClick={handleZoomOut} variant="outline" className="gap-2">
                <ZoomOut className="h-4 w-4" />
                Alejar
              </Button>
              <Button onClick={handleFit} variant="outline" className="gap-2">
                <Maximize2 className="h-4 w-4" />
                Ajustar
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-4">
          {/* Organization selector */}
          <div className="w-64">
            <label htmlFor="org-select" className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Organización
            </label>
            <select
              id="org-select"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccionar organización</option>
              {organizationsData?.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plant selector */}
          {selectedOrg && (
            <div className="w-64">
              <label htmlFor="plant-select" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Planta (opcional)
              </label>
              <select
                id="plant-select"
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={!plantsData?.plants || plantsData.plants.length === 0}
              >
                <option value="">Todas las plantas</option>
                {plantsData?.plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedOrg ? (
        <div className="flex-1 bg-white rounded-lg shadow p-8 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona una organización</h3>
            <p className="mt-1 text-sm text-gray-500">
              Elige una organización para ver su organigrama
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 bg-white rounded-lg shadow p-8 flex items-center justify-center">
          <p className="text-gray-600">Cargando organigrama...</p>
        </div>
      ) : !chartData || chartData.length === 0 ? (
        <div className="flex-1 bg-white rounded-lg shadow p-8 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados</h3>
            <p className="mt-1 text-sm text-gray-500">
              Agrega empleados para visualizar el organigrama
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
          <div
            ref={chartRef}
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />
        </div>
      )}
    </div>
  );
};

export default OrgChartPage;
