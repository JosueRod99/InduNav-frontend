import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Users,
  BarChart3,
  Shield,
  Globe,
  Play,
  ChevronRight,
  CheckCircle,
  Mail
} from 'lucide-react';
import { CONTACT_EMAIL } from '../constants/contact';
import ContactModal from '../components/ContactModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/inau_logo_cropped.png" alt="INAU" className="h-10 w-auto" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
              >
                Contacto
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Tu Información Industrial
              <span className="block text-blue-600">Organizada, Accesible y Presentable</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Centraliza layouts de planta, organigramas, procesos, métricas y documentación en una plataforma profesional.
              Lista para auditorías, capacitaciones, visitas de clientes y presentaciones ejecutivas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/tour')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Ver Demo Interactivo
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-slate-700 rounded-lg font-semibold text-lg border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
              >
                Comenzar Ahora
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Stats/Features Pills */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <div className="bg-white rounded-full px-6 py-3 shadow-md border border-slate-200">
                <span className="text-sm font-semibold text-slate-700">📍 Layouts Interactivos</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md border border-slate-200">
                <span className="text-sm font-semibold text-slate-700">🎙️ Narración en Audio</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md border border-slate-200">
                <span className="text-sm font-semibold text-slate-700">📊 Métricas en Tiempo Real</span>
              </div>
              <div className="bg-white rounded-full px-6 py-3 shadow-md border border-slate-200">
                <span className="text-sm font-semibold text-slate-700">🌐 Soporte Multiidioma</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Gestiona, presenta y comparte la información de tu planta de forma profesional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Layouts de Planta
              </h3>
              <p className="text-slate-600">
                Digitaliza y organiza los planos de tu planta con áreas interactivas, información detallada y ubicaciones precisas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Presentaciones Narradas
              </h3>
              <p className="text-slate-600">
                Genera audio profesional con IA en español e inglés para presentar tu información de forma atractiva.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Estructura Organizacional
              </h3>
              <p className="text-slate-600">
                Mantén actualizado tu organigrama con responsables por área, roles y jerarquías claras.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Indicadores y KPIs
              </h3>
              <p className="text-slate-600">
                Centraliza métricas de producción, calidad, seguridad y eficiencia en dashboards visuales.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Protocolos de Seguridad
              </h3>
              <p className="text-slate-600">
                Documenta requisitos de EPP, procedimientos de emergencia y normativas por área.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-blue-300 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Acceso Multiidioma
              </h3>
              <p className="text-slate-600">
                Presenta tu información en múltiples idiomas, ideal para operaciones internacionales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Una plataforma, múltiples aplicaciones
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-lg">Visitas y Presentaciones</p>
                    <p className="text-blue-100">Impresiona a clientes, inversores y autoridades con información organizada</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-lg">Onboarding y Capacitación</p>
                    <p className="text-blue-100">Acelera la curva de aprendizaje de nuevos colaboradores</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-lg">Auditorías y Compliance</p>
                    <p className="text-blue-100">Documentación siempre lista para inspecciones y certificaciones</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-lg">Gestión Diaria</p>
                    <p className="text-blue-100">Consulta organigramas, responsables, métricas y procedimientos al instante</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-4">¿Listo para comenzar?</h3>
              <p className="text-blue-100 mb-6">
                Explora nuestro demo interactivo y descubre cómo InduNav centraliza toda tu información industrial.
              </p>
              <button
                onClick={() => navigate('/tour')}
                className="w-full px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Ver Demo Interactivo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Centraliza tu información industrial hoy
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Organiza, presenta y comparte. Todo en una plataforma profesional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/tour')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all"
            >
              Explorar Demo
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-slate-800 text-white rounded-lg font-semibold text-lg border-2 border-slate-700 hover:border-slate-600 transition-all"
            >
              Comenzar Ahora
            </button>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="px-8 py-4 bg-slate-800 text-white rounded-lg font-semibold text-lg border-2 border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contáctanos
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-lg px-3 py-1.5">
                <img src="/inau_logo_cropped.png" alt="INAU" className="h-7 w-auto" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="text-sm hover:text-white transition-colors flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </button>
            <p className="text-sm">
              © 2026 INAU. Información industrial organizada y accesible.
            </p>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

export default LandingPage;
