import type { PermissionName } from '../../utils/permissions';
import { Award, FileText, GitBranch, LayoutDashboard, LayoutGrid, Layers, Map, Package, Settings, Users, Wrench } from 'lucide-react';

// Tabs of the plant workspace (/plants/:plantId/:tab)

// Permissions that open each tab, any of them is enough (undefined = every signed-in user)
export const PLANT_TABS = [
  { id: 'resumen', label: 'Resumen', Icon: LayoutDashboard, anyOf: undefined },
  { id: 'layout', label: 'Layout', Icon: LayoutGrid, anyOf: ['layouts.read'] },
  { id: 'areas', label: 'Áreas', Icon: Layers, anyOf: ['areas.read'] },
  { id: 'equipos', label: 'Equipos', Icon: Wrench, anyOf: ['equipment.read'] },
  { id: 'productos', label: 'Productos', Icon: Package, anyOf: ['products.read'] },
  { id: 'procesos', label: 'Procesos', Icon: GitBranch, anyOf: ['processes.read'] }, // across areas
  { id: 'certificaciones', label: 'Certificaciones', Icon: Award, anyOf: ['certifications.read'] },
  { id: 'documentos', label: 'Documentos', Icon: FileText, anyOf: ['documents.read', 'documents.read_public'] }, // areas, plant and company
  { id: 'personal', label: 'Personal', Icon: Users, anyOf: ['employees.read'] }, // the employee list: managers only
  { id: 'tours', label: 'Tours', Icon: Map, anyOf: ['tours.read', 'tours.read_published'] },
  // Not in the tab bar: a button in the plant header (it is the plant's settings, not a section)
  { id: 'configuracion', label: 'Configuración', Icon: Settings, anyOf: ['plants.read'] }, // read-only for non-managers
] satisfies { id: string; label: string; Icon: unknown; anyOf: PermissionName[] | undefined }[];

export type PlantTab = (typeof PLANT_TABS)[number]['id'];

/** Tabs shown in the bar (everything except the settings, which live in the header) */
export const IN_HEADER: readonly PlantTab[] = ['configuracion'];
