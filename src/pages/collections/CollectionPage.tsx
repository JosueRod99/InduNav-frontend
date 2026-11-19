import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, MapPin, MapPinOff, Play } from 'lucide-react';
import { collectionText, getPublicCollection, type CollectionTour } from '../../api/collections';
import LanguageFlag from '../../components/ui/LanguageFlag';

// Public page of a collection (no login): tours of several demo companies, for sales. Each tour opens
// in the real viewer with ?c=<slug>, which offers the way back and marks the visit as a collection one.
// Separate from the demo at /tour.

type PageLanguage = 'es' | 'en';

const TEXTS = {
  es: { tours: (n: number) => `${n} ${n === 1 ? 'recorrido' : 'recorridos'}`, areas: (n: number) => `${n} ${n === 1 ? 'área' : 'áreas'}`, open: 'Ver recorrido', empty: 'Esta colección todavía no tiene recorridos.', notFound: 'Colección no disponible', notFoundHint: 'Es posible que el enlace sea incorrecto o que la colección ya no esté activa.', loading: 'Cargando…', language: 'Idioma' },
  en: { tours: (n: number) => `${n} ${n === 1 ? 'tour' : 'tours'}`, areas: (n: number) => `${n} ${n === 1 ? 'area' : 'areas'}`, open: 'View tour', empty: 'This collection has no tours yet.', notFound: 'Collection not available', notFoundHint: 'The link may be wrong or the collection may no longer be active.', loading: 'Loading…', language: 'Language' },
};

const startingLanguage = (param: string | null): PageLanguage => {
  if (param === 'es' || param === 'en') return param;
  if (param) return param.startsWith('es') ? 'es' : 'en';
  return (navigator.languages ?? [navigator.language]).some((l) => l?.toLowerCase().startsWith('es')) ? 'es' : 'en';
};

/** A tour's own text in the page language, else in its source language */
const tourText = (texts: Record<string, string>, tour: CollectionTour, language: PageLanguage) =>
  texts[language]?.trim() || texts[tour.source_language]?.trim() || Object.values(texts).find((t) => t?.trim()) || '';

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState<PageLanguage>(() => startingLanguage(searchParams.get('lang')));
  const t = TEXTS[language];
  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['public-collection', slug],
    queryFn: () => getPublicCollection(slug!),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const title = collection ? collectionText(collection.title_translations, language) : '';
  useEffect(() => {
    document.documentElement.lang = language;
    if (title) document.title = title;
  }, [language, title]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-slate-50 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> {t.loading}
      </div>
    );
  }
  if (error || !collection) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <MapPinOff className="h-10 w-10 text-slate-400" />
        <h1 className="text-xl font-semibold text-slate-900">{t.notFound}</h1>
        <p className="max-w-sm text-sm text-slate-600">{t.notFoundHint}</p>
      </div>
    );
  }

  const description = collectionText(collection.description_translations, language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4 px-4 py-6 sm:px-6">
          <div className="min-w-0 flex-1 basis-72">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">INAU · {t.tours(collection.tours.length)}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            {description && <p className="mt-2 max-w-3xl whitespace-pre-line text-sm text-slate-600 sm:text-base">{description}</p>}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5" role="group" aria-label={t.language}>
            {(['es', 'en'] as const).map((code) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                aria-pressed={language === code}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${language === code ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <LanguageFlag code={code} className="h-3.5 w-3.5" />
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {collection.tours.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">{t.empty}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collection.tours.map((tour) => {
              const tourTitle = tourText(tour.title_translations, tour, language);
              const tourDescription = tourText(tour.description_translations, tour, language);
              return (
                <li key={tour.public_code} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  {/* Same size for every card: the photo fills a 3:2 box and never stretches it */}
                  <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-blue-600 to-slate-800">
                    {tour.cover_image_url ? (
                      <img src={tour.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Building2 className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/40" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="flex h-5 items-center gap-2 text-xs font-medium text-slate-500">
                      {tour.organization_logo_url && <img src={tour.organization_logo_url} alt="" className="h-5 w-5 rounded object-contain" />}
                      <span className="truncate">{tour.organization_name}</span>
                    </p>
                    <h2 className="mt-1 truncate text-lg font-bold text-slate-900" title={tourTitle}>
                      {tourTitle}
                    </h2>
                    {/* Always three lines tall, with or without text, so the rows line up */}
                    <p className="mt-1 line-clamp-3 h-[3.75rem] text-sm leading-5 text-slate-600">{tourDescription}</p>
                    <p className="mt-3 flex items-center gap-x-3 truncate text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {t.areas(tour.stops_count)}
                      </span>
                      <span>{tour.languages.map((l) => l.toUpperCase()).join(' · ')}</span>
                    </p>
                    <Link
                      to={`/t/${tour.public_code}?c=${collection.slug}`}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4" /> {t.open}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default CollectionPage;
