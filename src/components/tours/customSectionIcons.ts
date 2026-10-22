import {
  Award,
  Clock,
  Factory,
  FileText,
  Globe,
  Heart,
  Leaf,
  Lightbulb,
  Shield,
  Star,
  Target,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// Icons a custom tour section can use. Keys must match CUSTOM_SECTION_ICONS in the backend
// validator (tourBuilderValidators.ts).

export type CustomSectionIcon =
  | 'text'
  | 'star'
  | 'award'
  | 'idea'
  | 'leaf'
  | 'team'
  | 'factory'
  | 'target'
  | 'growth'
  | 'heart'
  | 'history'
  | 'globe'
  | 'safety'
  | 'tools'
  | 'truck'
  | 'energy';

export const CUSTOM_SECTION_ICONS: Record<CustomSectionIcon, { Icon: LucideIcon; label: string }> = {
  text: { Icon: FileText, label: 'Texto' },
  star: { Icon: Star, label: 'Destacado' },
  award: { Icon: Award, label: 'Reconocimiento' },
  idea: { Icon: Lightbulb, label: 'Innovación' },
  leaf: { Icon: Leaf, label: 'Sustentabilidad' },
  team: { Icon: Users, label: 'Equipo' },
  factory: { Icon: Factory, label: 'Planta' },
  target: { Icon: Target, label: 'Objetivo' },
  growth: { Icon: TrendingUp, label: 'Crecimiento' },
  heart: { Icon: Heart, label: 'Cultura' },
  history: { Icon: Clock, label: 'Historia' },
  globe: { Icon: Globe, label: 'Internacional' },
  safety: { Icon: Shield, label: 'Seguridad' },
  tools: { Icon: Wrench, label: 'Herramientas' },
  truck: { Icon: Truck, label: 'Logística' },
  energy: { Icon: Zap, label: 'Energía' },
};

export const DEFAULT_CUSTOM_SECTION_ICON: CustomSectionIcon = 'text';
