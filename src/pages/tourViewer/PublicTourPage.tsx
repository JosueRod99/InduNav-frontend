import { useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Lock, MapPinOff } from 'lucide-react';
import { getPublicTour, getPublicTourBySlug, resolveStopQr } from '../../api/tourView';
import { TourExperience } from './TourViewerRealPage';
import type { VisitSource } from './useVisitTracking';

// Public pages of real tours (no login): /t/:code, /t/:orgSlug/:tourSlug and stop QR codes /s/:qrCode.
// Separate from the demo at /tour/:slug.

const Centered = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">{children}</div>
);

const PublicTourPage = () => {
  const { code, orgSlug, tourSlug } = useParams<{ code?: string; orgSlug?: string; tourSlug?: string }>();
  const [searchParams] = useSearchParams();
  const stopParam = Number(searchParams.get('stop'));
  const initialStopIndex = Number.isInteger(stopParam) && stopParam > 0 ? stopParam - 1 : null;
  const source: VisitSource = searchParams.get('src') === 'qr' ? 'qr' : code ? 'link' : 'slug';

  const { data: view, isLoading, error } = useQuery({
    queryKey: ['public-tour', code, orgSlug, tourSlug],
    queryFn: () => (code ? getPublicTour(code) : getPublicTourBySlug(orgSlug!, tourSlug!)),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const title = view?.tour.title.es;
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  if (isLoading) {
    return (
      <Centered>
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm text-slate-600">Cargando recorrido…</p>
      </Centered>
    );
  }

  const status = (error as any)?.response?.status;
  if (status === 403) {
    return (
      <Centered>
        <Lock className="h-10 w-10 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-900">Este tour es privado</h1>
        <p className="max-w-sm text-sm text-slate-600">
          Solo pueden verlo las personas de la empresa con una cuenta activa.
        </p>
        <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Iniciar sesión
        </Link>
      </Centered>
    );
  }

  if (error || !view) {
    return (
      <Centered>
        <MapPinOff className="h-10 w-10 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-900">Tour no disponible</h1>
        <p className="max-w-sm text-sm text-slate-600">
          Es posible que el enlace sea incorrecto o que el tour ya no esté publicado.
        </p>
      </Centered>
    );
  }

  return <TourExperience view={view} initialStopIndex={initialStopIndex} source={source} />;
};

/** /s/:qrCode → opens the tour at that stop */
export const StopQrRedirect = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();

  const { data, error } = useQuery({
    queryKey: ['stop-qr', qrCode],
    queryFn: () => resolveStopQr(qrCode!),
    retry: false,
  });

  useEffect(() => {
    if (data) {
      const stop = data.stop_index !== null ? `?stop=${data.stop_index + 1}&src=qr` : '?src=qr';
      navigate(`/t/${data.tour_code}${stop}`, { replace: true });
    }
  }, [data, navigate]);

  if (error) {
    return (
      <Centered>
        <MapPinOff className="h-10 w-10 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-900">Código no disponible</h1>
        <p className="max-w-sm text-sm text-slate-600">Este código QR no corresponde a un tour publicado.</p>
      </Centered>
    );
  }

  return (
    <Centered>
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </Centered>
  );
};

export default PublicTourPage;
