import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Eye,
  History,
  Layers,
  Loader2,
  Map,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import type { Plant } from "../../types";
import { getPlantSummary, type PlantSummary } from "../../api/plants";
import { MANAGERS, PLANT_TABS, type PlantTab } from "./plantTabs";
import { useAuthStore } from "../../store/authStore";
import { useBackState } from "../../hooks/useBackNavigation";

// "Resumen" tab of the plant workspace: key numbers (each one opens its tab), what needs
// attention, tour visits and recent changes. One request; sections the role cannot open are hidden.

type Activity = NonNullable<PlantSummary["activity"]>[number];

const KIND_LABELS: Record<Activity["kind"], string> = {
  plant: "Planta",
  area: "Área",
  equipment: "Equipo",
  product: "Producto",
  tour: "Tour",
  stop: "Parada de tour",
  employee: "Empleado",
  layout: "Layout",
};

// "<resource>:<sub-action>" from the audit log → what the person did
const SUB_ACTIONS: Record<string, string> = {
  create: "creó",
  update: "editó",
  delete: "eliminó",
  publish: "publicó",
  unpublish: "despublicó",
  share: "cambió cómo se comparte",
  settings: "cambió la configuración",
  representations: "editó su forma en el layout",
  footprints: "lo ubicó en el layout",
  "area-assignments": "cambió su asignación de área",
  safety: "actualizó la información de seguridad",
  photos: "actualizó las fotos",
  images: "actualizó las imágenes",
  documents: "actualizó los documentos",
  certifications: "actualizó las certificaciones",
  narration: "actualizó la narración",
  reorder: "reordenó las paradas",
};
const describeAction = (item: Activity) =>
  SUB_ACTIONS[item.action.split(":")[1]] ||
  (item.method === "DELETE" ? "eliminó algo" : "actualizó");

const activityLink = (item: Activity, plantId: string) => {
  switch (item.kind) {
    case "area":
      return `/areas/${item.entity_id}`;
    case "equipment":
      return `/equipment/${item.entity_id}`;
    case "product":
      return `/products/${item.entity_id}`;
    case "tour":
    case "stop":
      return item.tour_id ? `/tours/${item.tour_id}/edit` : null;
    case "employee":
      return `/plants/${plantId}/personal`;
    case "layout":
      return `/plants/${plantId}/layout`;
    case "plant":
      return `/plants/${plantId}/configuracion`;
  }
};

const relativeTime = (iso: string) => {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size)
      return rtf.format(Math.round(seconds / size), unit);
  }
  return "hace un momento";
};

const shortDate = (iso: string) =>
  new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const Card = ({
  title,
  Icon,
  action,
  children,
}: {
  title: string;
  Icon: typeof Eye;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-lg border border-gray-200 bg-white">
    <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Icon className="h-4 w-4 text-gray-500" />
        {title}
      </h3>
      {action}
    </div>
    {children}
  </section>
);

const PlantSummaryTab = ({ plant }: { plant: Plant }) => {
  const role = useAuthStore((state) => state.user?.role?.name) || "";
  const backState = useBackState(); // detail pages opened from here return to the summary
  const allowed = (tab: PlantTab) => {
    const roles = PLANT_TABS.find((t) => t.id === tab)?.roles as
      readonly string[] | undefined;
    return !roles || roles.includes(role);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["plant-summary", plant.id],
    queryFn: () => getPlantSummary(plant.id),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando resumen…
      </p>
    );
  }
  if (isError || !data)
    return (
      <p className="text-sm text-red-600">
        No se pudo cargar el resumen de la planta.
      </p>
    );

  const { counts, alerts, tours, activity } = data;
  const equipment = counts.equipment_by_status;
  const equipmentTotal = equipment
    ? Object.entries(equipment).reduce(
        (sum, [status, n]) => sum + (status === "retired" ? 0 : n || 0),
        0,
      )
    : 0;
  const stats = [
    {
      tab: "areas" as const,
      Icon: Layers,
      label: "Áreas",
      value: counts.areas,
      detail: null,
    },
    {
      tab: "equipos" as const,
      Icon: Wrench,
      label: "Equipos",
      value: equipmentTotal,
      detail:
        equipment && equipmentTotal > 0
          ? `${equipment.active || 0} activo${equipment.active === 1 ? "" : "s"}`
          : null,
    },
    {
      tab: "productos" as const,
      Icon: Package,
      label: "Productos",
      value: counts.products ?? 0,
      detail: null,
    },
    {
      tab: "personal" as const,
      Icon: Users,
      label: "Personal",
      value: counts.employees,
      detail: null,
    },
    {
      tab: "tours" as const,
      Icon: Map,
      label: "Tours",
      value: counts.tours,
      detail:
        counts.tours > 0
          ? `${counts.tours_published} publicado${counts.tours_published === 1 ? "" : "s"}`
          : null,
    },
  ].filter((s) => allowed(s.tab));

  const showEquipmentAlerts = allowed("equipos");
  const showCertificationAlerts = allowed("areas");
  const showAlerts = showEquipmentAlerts || showCertificationAlerts;
  const outOfService = equipment?.out_of_service || 0;
  const inMaintenance = equipment?.maintenance || 0;
  const hiddenEquipment =
    outOfService + inMaintenance - alerts.equipment.length;
  const alertCount =
    outOfService + inMaintenance + alerts.certifications.length;

  const trend =
    tours.visits_prev_30d > 0
      ? Math.round(
          ((tours.visits_30d - tours.visits_prev_30d) / tours.visits_prev_30d) *
            100,
        )
      : null;

  return (
    <div className="space-y-4">
      {plant.description ? (
        <p className="max-w-3xl whitespace-pre-line text-sm text-gray-700">
          {plant.description}
        </p>
      ) : (
        MANAGERS.includes(role) && (
          <p className="text-sm text-gray-500">
            Esta planta no tiene descripción.{" "}
            <Link
              to={`/plants/${plant.id}/configuracion`}
              className="font-medium text-blue-600 hover:underline"
            >
              Agregar una
            </Link>
          </p>
        )
      )}

      {/* Key numbers: each one opens its tab */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ tab, Icon, label, value, detail }) => (
          <Link
            key={tab}
            to={`/plants/${plant.id}/${tab}`}
            className="group rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40 sm:p-4"
          >
            <span className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-blue-700">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <span className="mt-1 block text-2xl font-bold text-gray-900">
              {value}
            </span>
            <span className="block h-4 text-xs text-gray-500">{detail}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {showAlerts && (
            <Card
              title="Requiere atención"
              Icon={AlertTriangle}
              action={
                alertCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {alertCount}
                  </span>
                )
              }
            >
              {alerts.equipment.length === 0 &&
              alerts.certifications.length === 0 ? (
                <p className="flex items-center gap-2 px-4 py-4 text-sm text-gray-600">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  Todo en orden:{" "}
                  {showEquipmentAlerts
                    ? "ningún equipo detenido ni "
                    : "ninguna "}
                  certificación vencida o por vencer en los próximos{" "}
                  {data.alert_days} días.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {alerts.equipment.map((eq) => (
                    <li key={eq.id}>
                      <Link
                        to={`/equipment/${eq.id}`}
                        state={backState}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                      >
                        <Wrench
                          className={`h-4 w-4 flex-shrink-0 ${eq.status === "out_of_service" ? "text-red-600" : "text-amber-600"}`}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium text-gray-900">
                            {eq.name}
                          </span>
                          <span className="ml-1.5 font-mono text-xs text-gray-500">
                            {eq.code}
                          </span>
                        </span>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            eq.status === "out_of_service"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {eq.status === "out_of_service"
                            ? "Fuera de servicio"
                            : "En mantenimiento"}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {hiddenEquipment > 0 && (
                    <li>
                      <Link
                        to={`/plants/${plant.id}/equipos`}
                        className="block px-4 py-2 text-xs font-medium text-blue-600 hover:bg-gray-50"
                      >
                        Y {hiddenEquipment} equipo
                        {hiddenEquipment === 1 ? "" : "s"} más detenido
                        {hiddenEquipment === 1 ? "" : "s"} · Ver Equipos
                      </Link>
                    </li>
                  )}
                  {alerts.certifications.map((cert) => {
                    const date =
                      cert.kind === "audit"
                        ? cert.next_audit_date
                        : cert.expiry_date;
                    const text =
                      cert.kind === "expired"
                        ? `Venció el ${shortDate(date!)}`
                        : cert.kind === "expiring"
                          ? `Vence el ${shortDate(date!)}`
                          : `Auditoría el ${shortDate(date!)}`;
                    return (
                      <li key={cert.id}>
                        <Link
                          to={`/areas/${cert.area_id}?tab=certifications`}
                          state={backState}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                        >
                          {cert.kind === "audit" ? (
                            <CalendarClock className="h-4 w-4 flex-shrink-0 text-blue-600" />
                          ) : (
                            <BadgeCheck
                              className={`h-4 w-4 flex-shrink-0 ${cert.kind === "expired" ? "text-red-600" : "text-amber-600"}`}
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            <span className="font-medium text-gray-900">
                              {cert.certification_name}
                            </span>
                            <span className="ml-1.5 text-xs text-gray-500">
                              · {cert.area_name}
                            </span>
                          </span>
                          <span
                            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              cert.kind === "expired"
                                ? "bg-red-100 text-red-800"
                                : cert.kind === "expiring"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {text}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          )}

          {activity && (
            <Card title="Cambios recientes" Icon={History}>
              {activity.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-500">
                  Sin cambios en los últimos 30 días.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {activity.map((item) => {
                    const to = activityLink(item, plant.id);
                    const name = item.entity_name || KIND_LABELS[item.kind];
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 px-4 py-2.5 text-sm"
                      >
                        <span className="mt-0.5 flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                          {KIND_LABELS[item.kind]}
                        </span>
                        <span className="min-w-0 flex-1">
                          {to ? (
                            <Link
                              to={to}
                              state={backState}
                              className="font-medium text-gray-900 hover:text-blue-700 hover:underline"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {name}
                            </span>
                          )}
                          <span className="block text-xs text-gray-500">
                            {item.user_name || "Alguien"} {describeAction(item)}{" "}
                            · {relativeTime(item.created_at)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          )}
        </div>

        {/* Tour visits (its own height, not stretched to the left column) */}
        <div className="self-start">
          <Card
            title="Visitas a tours"
            Icon={Eye}
            action={
              <Link
                to={`/plants/${plant.id}/tours`}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Ver tours
              </Link>
            }
          >
            <div className="px-4 py-3">
              <p className="text-3xl font-bold text-gray-900">
                {tours.visits_30d}
              </p>
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                últimos 30 días
                {trend !== null && trend !== 0 && (
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${trend > 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {trend > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {trend > 0 ? "+" : ""}
                    {trend}% vs. 30 días previos
                  </span>
                )}
              </p>
            </div>
            {tours.top.length > 0 ? (
              <ul className="divide-y divide-gray-100 border-t border-gray-100">
                {tours.top.map((tour, index) => (
                  <li key={tour.id}>
                    <Link
                      to={`/tours/${tour.id}/stats`}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                    >
                      <span className="w-4 text-xs font-semibold text-gray-400">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-gray-900">
                        {tour.title}
                      </span>
                      <span className="flex-shrink-0 text-xs font-medium text-gray-600">
                        {tour.visits_30d}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                {counts.tours_published > 0
                  ? "Aún no hay visitas este mes."
                  : "Publica un tour para empezar a recibir visitas."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlantSummaryTab;
