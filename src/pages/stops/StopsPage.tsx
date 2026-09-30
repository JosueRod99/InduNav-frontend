import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, QrCode, Image as ImageIcon, Video, Music } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StopModal from './StopModal';
import { getStops, deleteStop } from '../../api/stops';
import { getTours } from '../../api/tours';
import type { Stop } from '../../types';

const StopsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [selectedTourFilter, setSelectedTourFilter] = useState<string>('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQRStop, setSelectedQRStop] = useState<Stop | null>(null);
  const queryClient = useQueryClient();

  // Fetch tours for filter
  const { data: toursData } = useQuery({
    queryKey: ['tours'],
    queryFn: () => getTours({ limit: 100 }),
  });

  // Fetch stops with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['stops', selectedTourFilter],
    queryFn: () =>
      getStops({
        limit: 100,
        tour_id: selectedTourFilter || undefined,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStop,
    onSuccess: () => {
      toast.success('Stop eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['stops'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar stop');
    },
  });

  const handleCreate = () => {
    setSelectedStop(null);
    setIsModalOpen(true);
  };

  const handleEdit = (stop: Stop) => {
    setSelectedStop(stop);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este stop?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleShowQR = (stop: Stop) => {
    setSelectedQRStop(stop);
    setQrModalOpen(true);
  };

  const handleDownloadQR = () => {
    if (!selectedQRStop) return;

    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${selectedQRStop.qr_short_code}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Get tour name by ID
  const getTourName = (tourId: string) => {
    const tour = toursData?.tours.find((t) => t.id === tourId);
    return tour?.title || 'N/A';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stops & QR Codes</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra paradas y códigos QR
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Stop
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="w-64">
            <label htmlFor="tour-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Tour
            </label>
            <select
              id="tour-filter"
              value={selectedTourFilter}
              onChange={(e) => setSelectedTourFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos los tours</option>
              {toursData?.tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-500">Error al cargar stops</p>
        </div>
      ) : !data?.stops || data.stops.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <QrCode className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay stops</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando un nuevo stop.
          </p>
          <div className="mt-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Stop
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Multimedia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.stops.map((stop) => (
                <tr key={stop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <QrCode className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {stop.title_translations?.es || stop.title_translations?.en || 'Sin título'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {stop.description_translations?.es || stop.description_translations?.en || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTourName(stop.tour_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="default"># {stop.order_index}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {stop.image_url && (
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                      )}
                      {stop.video_url && (
                        <Video className="h-4 w-4 text-red-500" />
                      )}
                      {(stop.audio_urls?.es || stop.audio_urls?.en) && (
                        <Music className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleShowQR(stop)}
                      className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                    >
                      Ver QR
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={stop.is_active ? 'success' : 'error'}>
                      {stop.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(stop)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(stop.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stop Modal */}
      <StopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        stop={selectedStop}
      />

      {/* QR Code Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Código QR"
        footer={
          <>
            <Button variant="outline" onClick={() => setQrModalOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handleDownloadQR}>
              Descargar QR
            </Button>
          </>
        }
      >
        {selectedQRStop && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <QRCodeSVG
                id="qr-code-svg"
                value={selectedQRStop.qr_short_code}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedQRStop.title_translations?.es || selectedQRStop.title_translations?.en}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Código: {selectedQRStop.qr_short_code}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StopsPage;
