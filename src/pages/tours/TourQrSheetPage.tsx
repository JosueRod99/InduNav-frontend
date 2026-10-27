import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTourBuilder, getTourShareInfo, tourLinks } from '../../api/tourBuilder';

// Printable / downloadable QR codes: one per area of the tour (to stick at each station) plus the
// tour QR. Each card can be printed or downloaded alone, or all of them at once.
// Uses the published version: areas added after the last publication are not included.

interface QrCard {
  id: string;
  value: string;
  title: string;
  subtitle: string;
  number: number | null; // null = whole tour
}

const CARD_W = 600;
const CARD_H = 780;
const QR_RENDER_SIZE = 512; // rendered large so printed and downloaded codes stay sharp

const slugify = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'qr';

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
};

/** Draws a printable card (number, QR, title, code) on a canvas */
const drawCard = (qr: HTMLCanvasElement, card: QrCard, target?: { ctx: CanvasRenderingContext2D; x: number; y: number }) => {
  const canvas = target ? null : document.createElement('canvas');
  if (canvas) {
    canvas.width = CARD_W;
    canvas.height = CARD_H;
  }
  const ctx = target?.ctx ?? canvas!.getContext('2d')!;
  const ox = target?.x ?? 0;
  const oy = target?.y ?? 0;
  const isTour = card.number === null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(ox, oy, CARD_W, CARD_H);
  ctx.strokeStyle = isTour ? '#2563EB' : '#CBD5E1';
  ctx.lineWidth = isTour ? 6 : 3;
  ctx.strokeRect(ox + 3, oy + 3, CARD_W - 6, CARD_H - 6);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (isTour) {
    ctx.fillStyle = '#1D4ED8';
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillText('RECORRIDO COMPLETO', ox + CARD_W / 2, oy + 52);
  } else {
    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.arc(ox + CARD_W / 2, oy + 54, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillText(String(card.number), ox + CARD_W / 2, oy + 55);
  }

  const qrSize = 420;
  ctx.drawImage(qr, ox + (CARD_W - qrSize) / 2, oy + 100, qrSize, qrSize);

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 32px system-ui, sans-serif';
  const lines = wrapText(ctx, card.title, CARD_W - 60, 2);
  lines.forEach((l, i) => ctx.fillText(l, ox + CARD_W / 2, oy + 570 + i * 40));

  ctx.fillStyle = '#64748B';
  ctx.font = '24px ui-monospace, monospace';
  ctx.fillText(card.subtitle, ox + CARD_W / 2, oy + 570 + lines.length * 40 + 20);

  return canvas;
};

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
};

const TourQrSheetPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const qrRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [printOnly, setPrintOnly] = useState<string | null>(null);

  const { data: share, isLoading } = useQuery({
    queryKey: ['tour-share', tourId],
    queryFn: () => getTourShareInfo(tourId!),
  });
  const { data: builder } = useQuery({
    queryKey: ['tour-builder', tourId],
    queryFn: () => getTourBuilder(tourId!),
    staleTime: Infinity,
  });

  // Printing a single card: print once React rendered the filtered view, then restore
  useEffect(() => {
    if (!printOnly) return;
    const reset = () => setPrintOnly(null);
    window.addEventListener('afterprint', reset);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', reset);
    };
  }, [printOnly]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando…
      </div>
    );
  }

  const links = share ? tourLinks(share) : null;
  const tourTitle = builder?.tour.title_translations.es || builder?.tour.title || 'Tour';

  if (!share || share.status !== 'published' || !links?.short) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-gray-700">Publica el tour para generar sus códigos QR.</p>
        <button onClick={() => navigate(`/tours/${tourId}/edit`)} className="text-sm font-medium text-blue-600 hover:underline">
          Volver al editor
        </button>
      </div>
    );
  }

  const cards: QrCard[] = [
    { id: 'tour', value: links.short, title: tourTitle, subtitle: links.short.replace(/^https?:\/\//, ''), number: null },
    ...share.stops
      .filter((s) => s.qr_short_code)
      .map((s) => ({
        id: s.id,
        value: links.stop(s.qr_short_code!),
        title: s.title.es || `Área ${s.number}`,
        subtitle: s.qr_short_code!,
        number: s.number,
      })),
  ];

  const qrOf = (card: QrCard) => qrRefs.current.get(card.id);

  const downloadOne = (card: QrCard) => {
    const qr = qrOf(card);
    if (!qr) return;
    const name = card.number === null ? `qr-recorrido-${slugify(card.title)}` : `qr-${card.number}-${slugify(card.title)}`;
    downloadCanvas(drawCard(qr, card)!, `${name}.png`);
  };

  /** All cards in one image, 3 per row (same layout as the printed sheet) */
  const downloadAll = () => {
    const cols = 3;
    const gap = 40;
    const margin = 60;
    const header = 110;
    const rows = Math.ceil(cards.length / cols);
    const canvas = document.createElement('canvas');
    canvas.width = margin * 2 + cols * CARD_W + (cols - 1) * gap;
    canvas.height = margin * 2 + header + rows * CARD_H + (rows - 1) * gap;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '700 48px system-ui, sans-serif';
    ctx.fillText(tourTitle, margin, margin + 30);
    ctx.fillStyle = '#64748B';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText('Escanea el código de cada área para abrir el recorrido ahí.', margin, margin + 80);

    for (const [i, card] of cards.entries()) {
      const qr = qrOf(card);
      if (!qr) {
        toast.error('No se pudieron generar todos los códigos, intenta de nuevo');
        return;
      }
      const x = margin + (i % cols) * (CARD_W + gap);
      const y = margin + header + Math.floor(i / cols) * (CARD_H + gap);
      drawCard(qr, card, { ctx, x, y });
    }
    downloadCanvas(canvas, `qrs-${slugify(tourTitle)}.png`);
  };

  const cardButton =
    'inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50';

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3 print:hidden">
        <button onClick={() => navigate(`/tours/${tourId}/edit`)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Volver al editor
        </button>
        <p className="hidden text-sm text-gray-500 md:block">
          Versión publicada {share.version} · {share.stops.length} {share.stops.length === 1 ? 'área' : 'áreas'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={downloadAll}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Descargar todos
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            Imprimir todos
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-6 print:max-w-none print:p-0">
        <div className={printOnly ? 'print:hidden' : ''}>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">{tourTitle}</h1>
          <p className="mb-6 text-sm text-gray-600 print:mb-4">
            Recorta cada tarjeta y pégala en su estación. Al escanearla, el tour abre directo en esa área.
          </p>
        </div>

        <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 print:gap-3 ${printOnly ? 'print:grid-cols-1 print:justify-items-center' : 'print:grid-cols-3'}`}>
          {cards.map((card) => (
            <div
              key={card.id}
              className={`flex break-inside-avoid flex-col items-center rounded-xl bg-white p-4 text-center ${
                card.number === null ? 'border-2 border-blue-600' : 'border border-gray-300'
              } ${printOnly && printOnly !== card.id ? 'print:hidden' : ''} ${printOnly === card.id ? 'print:w-[9cm]' : ''}`}
            >
              {card.number === null ? (
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Recorrido completo</p>
              ) : (
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {card.number}
                </span>
              )}
              <span
                className="block"
                ref={(el) => {
                  const canvas = el?.querySelector('canvas');
                  if (canvas) qrRefs.current.set(card.id, canvas);
                  else qrRefs.current.delete(card.id);
                }}
              >
                <QRCodeCanvas value={card.value} size={QR_RENDER_SIZE} level="M" includeMargin style={{ width: 150, height: 150 }} />
              </span>
              <p className="mt-2 text-sm font-semibold text-gray-900">{card.title}</p>
              <p className="font-mono text-xs text-gray-500">{card.subtitle}</p>
              <div className="mt-3 flex gap-2 print:hidden">
                <button onClick={() => downloadOne(card)} className={cardButton} aria-label={`Descargar QR de ${card.title}`}>
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </button>
                <button onClick={() => setPrintOnly(card.id)} className={cardButton} aria-label={`Imprimir QR de ${card.title}`}>
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TourQrSheetPage;
