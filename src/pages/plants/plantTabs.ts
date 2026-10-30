import { Award, FileText, GitBranch, LayoutDashboard, LayoutGrid, Layers, Map, Package, Settings, Users, Wrench } from 'lucide-react';

// Tabs of the plant workspace (/plants/:plantId/:tab)

// Same role limits the old pages had (undefined = every signed-in user)
export const MANAGERS = ['platform_admin', 'org_owner'];
export const PLANT_TABS = [
  { id: 'resumen', label: 'Resumen', Icon: LayoutDashboard, roles: undefined },
  { id: 'layout', label: 'Layout', Icon: LayoutGrid, roles: undefined },
  { id: 'areas', label: 'Áreas', Icon: Layers, roles: [...MANAGERS, 'plant_manager'] },
  { id: 'equipos', label: 'Equipos', Icon: Wrench, roles: MANAGERS },
  { id: 'productos', label: 'Productos', Icon: Package, roles: MANAGERS },
  { id: 'procesos', label: 'Procesos', Icon: GitBranch, roles: [...MANAGERS, 'plant_manager'] }, // across areas
  { id: 'certificaciones', label: 'Certificaciones', Icon: Award, roles: [...MANAGERS, 'plant_manager'] },
  { id: 'documentos', label: 'Documentos', Icon: FileText, roles: [...MANAGERS, 'plant_manager'] }, // areas, plant and company
  { id: 'personal', label: 'Personal', Icon: Users, roles: undefined }, // the employee list: managers only
  { id: 'tours', label: 'Tours', Icon: Map, roles: undefined },
  { id: 'configuracion', label: 'Configuración', Icon: Settings, roles: undefined }, // read-only for non-managers
] as const;

export type PlantTab = (typeof PLANT_TABS)[number]['id'];
