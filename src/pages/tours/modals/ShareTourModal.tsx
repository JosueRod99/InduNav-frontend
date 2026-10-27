import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, Copy, Download, ExternalLink, EyeOff, Globe, Lock, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { getTourShareInfo, tourLinks, unpublishTour } from '../../../api/tourBuilder';

interface ShareTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourTitle: string;
  onUnpublished?: () => void;
}

const CopyField = ({ label, value, hint }: { label: string; value: string; hint?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar; selecciona el texto y cópialo manualmente');
    }
  };
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800"
        />
        <button
          onClick={copy}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-shrink-0 items-center rounded-md border border-gray-300 px-2.5 text-gray-600 hover:bg-gray-50"
          aria-label={`Abrir ${label}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

const ShareTourModal = ({ isOpen, onClose, tourId, tourTitle, onUnpublished }: ShareTourModalProps) => {
  const queryClient = useQueryClient();
  const qrWrapper = useRef<HTMLDivElement>(null);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const { data: share, isLoading } = useQuery({
    queryKey: ['tour-share', tourId],
    queryFn: () => getTourShareInfo(tourId),
    enabled: isOpen,
    staleTime: 0,
  });

  const links = share ? tourLinks(share) : null;
  const isPublished = share?.status === 'published' && !!links?.short;

  const downloadQr = () => {
    const canvas = qrWrapper.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `qr-${share?.public_code || 'tour'}.png`;
    a.click();
  };

  const handleUnpublish = async () => {
    if (!window.confirm('¿Despublicar el tour? El link y los QR dejarán de funcionar hasta que lo publiques de nuevo (se conservarán los mismos).')) return;
    setIsUnpublishing(true);
    try {
      await unpublishTour(tourId);
      toast.success('Tour despublicado');
      queryClient.invalidateQueries({ queryKey: ['tour-share', tourId] });
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      onUnpublished?.();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo despublicar');
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Compartir "${tourTitle}"`} size="lg">
      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500">Cargando…</p>
      ) : !isPublished ? (
        <p className="py-6 text-center text-sm text-gray-600">
          Este tour no está publicado. Publícalo desde el editor para obtener su link y sus códigos QR.
        </p>
      ) : (
        <div className="space-y-5">
          <p className="flex items-center gap-2 text-sm text-gray-700">
            {share!.visibility === 'private' ? (
              <>
                <Lock className="h-4 w-4 text-gray-500" /> Privado: solo usuarios con sesión en tu organización.
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 text-gray-500" /> Con link: cualquiera con el link o el QR puede verlo.
              </>
            )}
            <span className="ml-auto text-xs text-gray-500">Versión publicada {share!.version}</span>
          </p>

          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <CopyField label="Link corto" value={links!.short!} hint="Es el que usan los códigos QR." />
              {links!.readable && <CopyField label="Link legible" value={links!.readable} />}
            </div>
            <div className="flex flex-col items-center gap-2">
              <div ref={qrWrapper} className="rounded-lg border border-gray-200 bg-white p-2">
                <QRCodeCanvas value={links!.short!} size={168} level="M" includeMargin />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadQr}>
                <Download className="h-4 w-4" />
                Descargar QR
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">QR por área</p>
              <p className="text-xs text-gray-600">
                Hoja imprimible con un QR para cada una de las {share!.stops.length} áreas: al escanearlo, el tour abre en esa área.
              </p>
            </div>
            <a
              href={`/tours/${tourId}/qr-sheet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Abrir hoja de QRs
            </a>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={handleUnpublish}
              disabled={isUnpublishing}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              <EyeOff className="h-4 w-4" />
              Despublicar tour
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ShareTourModal;
