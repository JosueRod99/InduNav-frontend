import { Link } from 'react-router-dom';
import { ExternalLink, FileText, HardHat } from 'lucide-react';
import { EQUIPMENT_STATUS_COLORS, EQUIPMENT_STATUS_LABELS } from '../../../api/equipment';
import type { TourSectionKey } from '../../../api/tourBuilder';
import type { TourViewStop } from '../../../api/tourView';

// Quick look at what a live section will show, inside the tour editor

const MAX_ROWS = 8;

/** Area detail tab where each live section's data is edited */
const AREA_TAB: Partial<Record<TourSectionKey, string>> = {
  location: 'layout',
  personnel: 'personal',
  safety: 'safety',
  equipment: 'equipment',
  products: 'products',
  processes: 'processes',
  gallery: 'gallery',
  documents: 'documents',
  certifications: 'certifications',
};

const more = (total: number) =>
  total > MAX_ROWS ? <li className="text-xs text-gray-500">+{total - MAX_ROWS} más</li> : null;

interface LiveSectionPreviewProps {
  sectionKey: TourSectionKey;
  stop: TourViewStop | undefined;
  areaId: string | null;
}

const LiveSectionPreview = ({ sectionKey, stop, areaId }: LiveSectionPreviewProps) => {
  const live = stop?.live;

  const body = (() => {
    if (!live) return <p className="text-xs text-gray-500">Cargando datos del área…</p>;
    switch (sectionKey) {
      case 'location': {
        const interior = live.interior;
        return (
          <ul className="space-y-1 text-xs text-gray-700">
            <li>{live.location_available ? '✓ El área está dibujada en el plano de la planta' : '✗ El área no está dibujada en el plano de la planta'}</li>
            <li>
              {interior
                ? `✓ Layout interno con ${interior.sub_areas.length} subáreas y ${interior.footprints.length} equipos dibujados`
                : '✗ Sin layout interno (el visitante solo verá la ubicación en la planta)'}
            </li>
          </ul>
        );
      }
      case 'processes':
        return (
          <ul className="space-y-1">
            {(live.processes || []).slice(0, MAX_ROWS).map((p) => (
              <li key={`${p.process_name}-${p.step_number}`} className="text-xs text-gray-700">
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-500">
                  {' '}
                  · {p.process_name}, paso {p.step_number} de {p.total_steps}
                </span>
              </li>
            ))}
            {more(live.processes?.length || 0)}
          </ul>
        );
      case 'personnel':
        return (
          <ul className="space-y-1">
            {live.personnel.slice(0, MAX_ROWS).map((p) => (
              <li key={p.id} className="text-xs text-gray-700">
                <span className="font-medium">{p.name}</span>
                {p.position && <span className="text-gray-500"> · {p.position}</span>}
              </li>
            ))}
            {more(live.personnel.length)}
            {(live.headcount || []).map((h) => (
              <li key={`${h.position}-${h.shift}`} className="text-xs text-gray-700">
                <span className="font-medium">{h.position}</span> <span className="text-gray-500">· {h.quantity} personas (plantilla)</span>
              </li>
            ))}
          </ul>
        );
      case 'safety': {
        const s = live.safety;
        if (!s) return null;
        return (
          <div className="space-y-1.5 text-xs text-gray-700">
            {s.days_without_accident !== null && <p>{s.days_without_accident} días sin accidentes</p>}
            {s.required_ppe.length > 0 && (
              <p className="flex flex-wrap items-center gap-1">
                <HardHat className="h-3.5 w-3.5 text-amber-600" />
                {s.required_ppe.join(' · ')}
              </p>
            )}
            {s.hazards.length > 0 && <p>{s.hazards.length} riesgos identificados</p>}
            {s.emergency_assembly_point && <p>Punto de reunión: {s.emergency_assembly_point}</p>}
          </div>
        );
      }
      case 'equipment':
        return (
          <ul className="space-y-1">
            {live.equipment.slice(0, MAX_ROWS).map((e) => (
              <li key={e.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[e.status] }} />
                <span className="font-mono text-gray-500">{e.code}</span>
                <span className="truncate">{e.name}</span>
                {e.status !== 'active' && <span className="text-gray-500">· {EQUIPMENT_STATUS_LABELS[e.status]}</span>}
              </li>
            ))}
            {more(live.equipment.length)}
          </ul>
        );
      case 'products':
        return (
          <ul className="space-y-1">
            {live.products.slice(0, MAX_ROWS).map((p) => (
              <li key={p.id} className="text-xs text-gray-700">
                <span className="font-medium">{p.name}</span> <span className="font-mono text-gray-500">{p.sku}</span>
              </li>
            ))}
            {more(live.products.length)}
          </ul>
        );
      case 'gallery':
        return (
          <div className="flex flex-wrap gap-1.5">
            {live.gallery.slice(0, MAX_ROWS).map((photo) => (
              <img
                key={photo.id}
                src={photo.thumbnail_url || photo.photo_url}
                alt={photo.caption || ''}
                className="h-12 w-12 rounded object-cover"
              />
            ))}
            {live.gallery.length > MAX_ROWS && (
              <span className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                +{live.gallery.length - MAX_ROWS}
              </span>
            )}
          </div>
        );
      case 'documents':
        return (
          <ul className="space-y-1">
            {live.documents.slice(0, MAX_ROWS).map((d) => (
              <li key={d.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                <FileText className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                <span className="truncate">{d.title}</span>
              </li>
            ))}
            {more(live.documents.length)}
          </ul>
        );
      case 'certifications':
        return (
          <ul className="space-y-1">
            {live.certifications.slice(0, MAX_ROWS).map((c) => (
              <li key={c.id} className="text-xs text-gray-700">
                <span className="font-medium">{c.certification_name}</span>
                {c.certification_body && <span className="text-gray-500"> · {c.certification_body}</span>}
              </li>
            ))}
            {more(live.certifications.length)}
          </ul>
        );
      default:
        return null;
    }
  })();

  const listLengths: Partial<Record<TourSectionKey, number>> = live
    ? {
        personnel: live.personnel.length + (live.headcount?.length || 0),
        equipment: live.equipment.length,
        products: live.products.length,
        processes: live.processes?.length || 0,
        gallery: live.gallery.length,
        documents: live.documents.length,
        certifications: live.certifications.length + (live.certified_people?.length || 0),
      }
    : {};
  const isEmpty = !!live && (sectionKey === 'safety' ? !live.safety : listLengths[sectionKey] === 0);

  return (
    <div className="space-y-2">
      {isEmpty ? <p className="text-xs text-gray-500">El área todavía no tiene datos para esta sección.</p> : body}
      <p className="text-[11px] text-gray-500">Estos datos se leen en vivo del área: si cambian, el tour se actualiza solo.</p>
      {areaId && AREA_TAB[sectionKey] && (
        <Link
          to={`/areas/${areaId}?tab=${AREA_TAB[sectionKey]}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          Editar en el área
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
};

export default LiveSectionPreview;
