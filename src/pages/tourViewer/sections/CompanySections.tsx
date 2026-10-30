import { useEffect, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Compass, Factory, Globe, Heart, Mail, MapPin, Phone, Target, X } from 'lucide-react';
import type { TourLanguage } from '../../../api/tourBuilder';
import { tr, type TourView } from '../../../api/tourView';
import { formatPhone, phoneHref } from '../../../utils/phone';

// Tour cover blocks about the company (profile from the organization's "Perfil" tab) and the
// plant (description and photos from its "Configuración" tab). Blocks switched off or empty are not shown.

type Photo = { image_url: string; caption: string | null };

/** Horizontal photo strip; a photo opens full screen */
const PhotoStrip = ({ photos, language }: { photos: Photo[]; language: TourLanguage }) => {
  const [open, setOpen] = useState<number | null>(null);
  const lang = (es: string, en: string) => (language === 'es' ? es : en);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, photos.length]);

  if (!photos.length) return null;
  const current = open !== null ? photos[open] : null;

  return (
    <>
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {photos.map((photo, index) => (
          <li key={photo.image_url} className="w-56 flex-shrink-0 snap-start sm:w-64">
            <button
              onClick={() => setOpen(index)}
              className="group block w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left"
              aria-label={photo.caption || lang(`Ver foto ${index + 1}`, `View photo ${index + 1}`)}
            >
              <img src={photo.image_url} alt={photo.caption || ''} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.03]" />
            </button>
            {photo.caption && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{photo.caption}</p>}
          </li>
        ))}
      </ul>
      {current && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <button className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label={lang('Cerrar', 'Close')}>
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open! - 1 + photos.length) % photos.length);
                }}
                className="absolute left-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
                aria-label={lang('Foto anterior', 'Previous photo')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open! + 1) % photos.length);
                }}
                className="absolute right-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
                aria-label={lang('Foto siguiente', 'Next photo')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={current.image_url} alt={current.caption || ''} className="max-h-[80vh] w-auto rounded-lg object-contain" />
            <figcaption className="mt-2 text-center text-sm text-white/80">
              {current.caption} {photos.length > 1 && <span className="text-white/50">· {open! + 1}/{photos.length}</span>}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
};

const websiteLabel = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

export const CompanySection = ({ view, language }: { view: TourView; language: TourLanguage }) => {
  const company = view.tour.organization.profile;
  if (!company) return null;
  const lang = (es: string, en: string) => (language === 'es' ? es : en);
  const about = tr(company.about, language);
  const mission = tr(company.mission, language);
  const vision = tr(company.vision, language);
  const values = company.values.filter((v) => tr(v.title, language));
  const contact = company.contact && Object.values(company.contact).some(Boolean) ? company.contact : null;
  if (!about && !mission && !vision && !values.length && !contact && !company.photos.length) return null;

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="company-heading">
      <div className="flex items-center gap-3">
        {view.tour.organization.logo_url ? (
          <img src={view.tour.organization.logo_url} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg border border-slate-200 object-contain p-1" />
        ) : (
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{lang('Conoce a la empresa', 'About the company')}</p>
          <h2 id="company-heading" className="text-xl font-bold text-slate-900">
            {view.tour.organization.name}
          </h2>
          {company.industry && <p className="text-sm text-slate-600">{company.industry}</p>}
        </div>
      </div>

      {about && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 sm:text-base">{about}</p>}

      {(mission || vision) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { text: mission, title: lang('Misión', 'Mission'), Icon: Target },
            { text: vision, title: lang('Visión', 'Vision'), Icon: Compass },
          ]
            .filter((b) => b.text)
            .map(({ text, title, Icon }) => (
              <div key={title} className="rounded-lg bg-slate-50 p-4">
                <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <Icon className="h-4 w-4" />
                  {title}
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{text}</p>
              </div>
            ))}
        </div>
      )}

      {values.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Heart className="h-4 w-4 text-blue-600" />
            {lang('Nuestros valores', 'Our values')}
          </h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <li key={index} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{tr(value.title, language)}</p>
                {tr(value.description, language) && <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{tr(value.description, language)}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <PhotoStrip photos={company.photos} language={language} />

      {contact && (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
          {contact.website && (
            <li>
              <a href={contact.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-700 hover:underline">
                <Globe className="h-4 w-4" />
                {websiteLabel(contact.website)}
              </a>
            </li>
          )}
          {contact.phone && (
            <li>
              <a href={phoneHref(contact.phone)} className="inline-flex items-center gap-1.5 hover:text-blue-700">
                <Phone className="h-4 w-4" />
                {formatPhone(contact.phone)}
              </a>
            </li>
          )}
          {contact.email && (
            <li>
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 hover:text-blue-700">
                <Mail className="h-4 w-4" />
                {contact.email}
              </a>
            </li>
          )}
          {contact.address && (
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              {contact.address}
            </li>
          )}
        </ul>
      )}
    </section>
  );
};

export const PlantSection = ({ view, language }: { view: TourView; language: TourLanguage }) => {
  const plant = view.tour.organization.profile?.plant;
  if (!plant || (!plant.description && !plant.photos.length)) return null;
  const lang = (es: string, en: string) => (language === 'es' ? es : en);
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{lang('La planta', 'The plant')}</p>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Factory className="h-5 w-5 text-blue-600" />
          {view.tour.plant_name}
        </h2>
      </div>
      {plant.description && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 sm:text-base">{plant.description}</p>}
      <PhotoStrip photos={plant.photos} language={language} />
    </section>
  );
};
