import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  ChevronDown,
  ExternalLink,
  FileText,
  HardHat,
  MapPin,
  Package,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react';
import { EQUIPMENT_STATUS_COLORS, EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS, type EquipmentStatus } from '../../../api/equipment';
import { getSectionBlocks, type TourLanguage, type TourSection } from '../../../api/tourBuilder';
import SimpleChart from '../../../components/tours/SimpleChart';
import { tr, type TourViewStop } from '../../../api/tourView';
import { avatarUrl } from '../../../utils/avatarUrl';

// Section renderers of the real tour viewer (independent from the demo tabs)

type Lang = TourLanguage;
const t = (lang: Lang, es: string, en: string) => (lang === 'es' ? es : en);

const STATUS_EN: Record<EquipmentStatus, string> = {
  active: 'Active',
  maintenance: 'Under maintenance',
  out_of_service: 'Out of service',
  retired: 'Retired',
};

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const Paragraphs = ({ text }: { text: string }) => (
  <div className="space-y-3">
    {text
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((p, i) => (
        <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {p}
        </p>
      ))}
  </div>
);

const Empty = ({ text }: { text: string }) => <p className="text-sm text-slate-500">{text}</p>;

export const SummarySection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => {
  const narrative = tr(stop.content.narrative, language);
  const keypoints = (stop.content.keypoints || []).map((k) => tr(k, language)).filter(Boolean);

  return (
    <div className="space-y-5">
      {narrative && <Paragraphs text={narrative} />}

      {keypoints.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {keypoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * FAQ of the stop, shown in the stop header (under the person in charge). Works like the demo: it
 * expands in place and the stop header's info column (max-h-96) scrolls when it gets long.
 */
export const StopFaq = ({ stop, language }: { stop: TourViewStop; language: Lang }) => {
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);
  const faq = (stop.content.faq || []).filter((f) => tr(f.q, language));

  // New area: start closed
  useEffect(() => {
    setOpen(false);
    setOpenItem(null);
  }, [stop.id]);

  if (faq.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <ChevronDown className={`h-4 w-4 flex-shrink-0 text-blue-600 transition-transform ${open ? 'rotate-180' : ''}`} />
          {t(language, 'Preguntas frecuentes', 'FAQ')}
        </span>
        <span className="flex-shrink-0 whitespace-nowrap text-xs font-normal text-slate-500">
          {faq.length} {t(language, faq.length === 1 ? 'pregunta' : 'preguntas', faq.length === 1 ? 'question' : 'questions')}
        </span>
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {faq.map((item, i) => (
            <div key={i} className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setOpenItem(openItem === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50"
                aria-expanded={openItem === i}
              >
                {tr(item.q, language)}
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${openItem === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openItem === i && (
                <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
                  <Paragraphs text={tr(item.a, language)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const HighlightsSection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {(stop.content.highlights || []).map((h, i) => (
      <div key={i} className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
        <p className="text-xl font-bold text-blue-700">{h.value}</p>
        <p className="mt-1 text-xs font-medium text-slate-600">{tr(h.label, language)}</p>
      </div>
    ))}
  </div>
);

export const CustomSection = ({ section, language }: { section: TourSection; language: Lang }) => (
  <div className="space-y-6">
    {getSectionBlocks(section).map((block) =>
      block.type === 'text'
        ? tr(block.body, language) && <Paragraphs key={block.id} text={tr(block.body, language)} />
        : block.chart.points.length > 0 && (
            <figure key={block.id} className="space-y-2">
              {tr(block.title, language) && (
                <figcaption className="text-sm font-semibold text-slate-900">{tr(block.title, language)}</figcaption>
              )}
              <SimpleChart chart={block.chart} language={language} title={tr(block.title, language)} />
            </figure>
          ),
    )}
    {(section.images?.length ?? 0) > 0 && (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {section.images!.map((url) => (
          <img key={url} src={url} alt="" className="aspect-video w-full rounded-lg object-cover" />
        ))}
      </div>
    )}
  </div>
);

export const PersonnelSection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => (
  <div className="space-y-3">
    {(stop.live.people_total ?? 0) > 0 && (
      <p className="text-sm text-slate-700">
        {t(language, 'Aquí trabajan', 'People working here:')} <strong className="text-slate-900">{stop.live.people_total}</strong>{' '}
        {t(language, stop.live.people_total === 1 ? 'persona' : 'personas', '')}
      </p>
    )}
    {(stop.live.headcount?.length ?? 0) > 0 && (
      <ul className="flex flex-wrap gap-2">
        {stop.live.headcount!.map((h) => (
          <li key={`${h.position}-${h.shift}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            <strong className="text-slate-900">{h.quantity}</strong> {h.position}
            {h.shift && <span className="text-slate-500"> · {h.shift}</span>}
          </li>
        ))}
      </ul>
    )}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stop.live.personnel.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          {p.avatar_url ? (
            <img src={avatarUrl(p.avatar_url, 44)!} alt={p.name} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
            {p.position && <p className="truncate text-xs text-slate-600">{p.position}</p>}
            {p.is_primary && <p className="text-[11px] text-blue-600">{t(language, 'Asignación principal', 'Primary assignment')}</p>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Steps of the plant processes done in this area ("what happens here")
export const ProcessesSection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => (
  <ol className="space-y-3">
    {(stop.live.processes || []).map((step) => (
      <li key={`${step.process_name}-${step.step_number}`} className="rounded-lg border border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {step.process_name} · {t(language, `Paso ${step.step_number} de ${step.total_steps}`, `Step ${step.step_number} of ${step.total_steps}`)}
        </p>
        <p className="mt-1 font-semibold text-slate-900">{step.name}</p>
        {step.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{step.description}</p>}
        {step.activities.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
            {step.activities.map((activity, i) => (
              <li key={i}>{activity}</li>
            ))}
          </ul>
        )}
        {(step.documents.length > 0 || step.equipment.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {step.documents.map((d) => (
              <span key={`${d.code}-${d.title}`} className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-800">
                {d.code ? `${d.code} · ` : ''}
                {d.title}
              </span>
            ))}
            {step.equipment.map((name) => (
              <span key={name} className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                {name}
              </span>
            ))}
          </div>
        )}
      </li>
    ))}
  </ol>
);

export const SafetySection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => {
  const s = stop.live.safety!;
  return (
    <div className="space-y-5">
      {s.days_without_accident !== null && s.days_without_accident !== undefined && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <ShieldCheck className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-green-700">{s.days_without_accident}</p>
            <p className="text-xs font-medium text-green-800">{t(language, 'días sin accidentes', 'days without accidents')}</p>
          </div>
        </div>
      )}
      {s.required_ppe.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            {t(language, 'Equipo de protección requerido', 'Required protective equipment')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {s.required_ppe.map((ppe) => (
              <span
                key={ppe}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
              >
                <HardHat className="h-3.5 w-3.5" />
                {ppe}
              </span>
            ))}
          </div>
        </div>
      )}
      {s.hazards.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">{t(language, 'Riesgos del área', 'Area hazards')}</h4>
          <ul className="space-y-1.5">
            {s.hazards.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-slate-800">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  {h.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_STYLES[h.severity] || 'bg-slate-100 text-slate-700'}`}
                >
                  {h.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.emergency_assembly_point && (
        <p className="flex items-start gap-2 text-sm text-slate-700">
          <MapPin className="mt-0.5 h-4 w-4 text-red-500" />
          <span>
            <strong>{t(language, 'Punto de reunión', 'Assembly point')}:</strong> {s.emergency_assembly_point}
          </span>
        </p>
      )}
      {(s.restricted_access || s.access_requirements) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <strong>{t(language, 'Acceso restringido', 'Restricted access')}</strong>
          {s.access_requirements && <p className="mt-1">{s.access_requirements}</p>}
        </div>
      )}
      {s.special_instructions && <Paragraphs text={s.special_instructions} />}
    </div>
  );
};

export const EquipmentSection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {stop.live.equipment.map((e) => (
      <div key={e.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
        {e.primary_image_url ? (
          <img src={e.primary_image_url} alt={e.name} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Wrench className="h-7 w-7 text-slate-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{e.name}</p>
          <p className="text-xs text-slate-500">
            <span className="font-mono">{e.code}</span>
            {language === 'es' && ` · ${EQUIPMENT_TYPE_LABELS[e.equipment_type]}`}
            {[e.manufacturer, e.model].filter(Boolean).length > 0 && ` · ${[e.manufacturer, e.model].filter(Boolean).join(' ')}`}
          </p>
          <span
            className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${EQUIPMENT_STATUS_COLORS[e.status]}1A`, color: EQUIPMENT_STATUS_COLORS[e.status] }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[e.status] }} />
            {language === 'es' ? EQUIPMENT_STATUS_LABELS[e.status] : STATUS_EN[e.status]}
          </span>
          {e.used_in.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {e.used_in.map((u, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Package className="h-3 w-3 text-slate-400" />
                  {u.product} · {t(language, 'Paso', 'Step')} {u.step_number} · {u.step_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    ))}
  </div>
);

export const ProductsSection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {stop.live.products.map((p) => (
      <div key={p.id} className="overflow-hidden rounded-lg border border-slate-200">
        {p.primary_image_url ? (
          <img src={p.primary_image_url} alt={p.name} className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-slate-100">
            <Package className="h-10 w-10 text-slate-300" />
          </div>
        )}
        <div className="p-3">
          <p className="text-sm font-semibold text-slate-900">{p.name}</p>
          <p className="font-mono text-xs text-slate-500">{p.sku}</p>
          {p.description && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{p.description}</p>}
          <p className="mt-2 text-[11px] font-medium text-blue-700">
            {t(language, 'En esta área', 'In this area')}:{' '}
            {p.steps.map((s) => `${t(language, 'Paso', 'Step')} ${s.step_number} · ${s.step_name}`).join(', ')}
          </p>
        </div>
      </div>
    ))}
  </div>
);

export const GallerySection = ({ stop }: { stop: TourViewStop }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {stop.live.gallery.map((photo) => (
      <a
        key={photo.id}
        href={photo.photo_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-lg"
      >
        <img
          src={photo.thumbnail_url || photo.photo_url}
          alt={photo.caption || ''}
          className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
        />
        {photo.caption && (
          <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-[11px] text-white">
            {photo.caption}
          </span>
        )}
      </a>
    ))}
  </div>
);

export const DocumentsSection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => (
  <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
    {stop.live.documents.map((d) => (
      <li key={d.id}>
        <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
          <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">{d.title}</span>
            {d.description && <span className="block truncate text-xs text-slate-500">{d.description}</span>}
          </span>
          <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-400" aria-label={t(language, 'Abrir', 'Open')} />
        </a>
      </li>
    ))}
  </ul>
);

export const CertificationsSection = ({ stop, language }: { stop: TourViewStop; language: Lang }) => (
  <div className="space-y-4">
    {stop.live.certifications.length > 0 && (
      <div className="grid gap-3 sm:grid-cols-2">
        {stop.live.certifications.map((c) => (
          <div key={c.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <Award className="h-6 w-6 flex-shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{c.certification_name}</p>
              {c.certification_body && <p className="text-xs text-slate-600">{c.certification_body}</p>}
              {c.status === 'in_progress' ? (
                <p className="mt-1 text-[11px] font-medium text-blue-700">{t(language, 'En proceso de certificación', 'Certification in progress')}</p>
              ) : (
                c.expiry_date && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {t(language, 'Vigente hasta', 'Valid until')}{' '}
                    {new Date(c.expiry_date).toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    })}
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    )}
    {(stop.live.certified_people?.length ?? 0) > 0 && (
      <ul className="flex flex-wrap gap-2">
        {stop.live.certified_people!.map((p) => (
          <li key={p.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            <strong className="text-slate-900">{p.count}</strong> {t(language, p.count === 1 ? 'persona certificada en' : 'personas certificadas en', p.count === 1 ? 'person certified in' : 'people certified in')}{' '}
            {p.name}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export { Empty };
