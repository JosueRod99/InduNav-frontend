import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getTourBySlug, getText, type DemoArea } from '../../demo/tourData';

type TabType = 'resumen' | 'ubicacion' | 'organigrama' | 'costos' | 'predicciones';

const TourViewerPage = () => {
  const { tourSlug } = useParams<{ tourSlug: string }>();
  const navigate = useNavigate();

  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [expandedKeypoint, setExpandedKeypoint] = useState<number | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const tour = tourSlug ? getTourBySlug(tourSlug) : null;

  useEffect(() => {
    if (!tour) {
      navigate('/tour');
    }
  }, [tour, navigate]);

  if (!tour) {
    return null;
  }

  const currentArea = tour.areas[currentAreaIndex];
  const progress = ((currentAreaIndex + 1) / tour.areas.length) * 100;

  const goToNextArea = () => {
    if (currentAreaIndex < tour.areas.length - 1) {
      setCurrentAreaIndex(currentAreaIndex + 1);
      setActiveTab('resumen');
      setExpandedKeypoint(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousArea = () => {
    if (currentAreaIndex > 0) {
      setCurrentAreaIndex(currentAreaIndex - 1);
      setActiveTab('resumen');
      setExpandedKeypoint(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs: Array<{ id: TabType; label: { es: string; en: string }; icon: string }> = [
    { id: 'resumen', label: { es: '📋 Resumen', en: '📋 Summary' }, icon: '📋' },
    { id: 'ubicacion', label: { es: '📍 Ubicación', en: '📍 Location' }, icon: '📍' },
    { id: 'organigrama', label: { es: '👥 Organigrama', en: '👥 Organization' }, icon: '👥' },
    { id: 'costos', label: { es: '💰 Métricas', en: '💰 Metrics' }, icon: '💰' },
    { id: 'predicciones', label: { es: '📊 Predicciones', en: '📊 Predictions' }, icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/tour')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {language === 'es' ? 'Volver al catálogo' : 'Back to catalog'}
              </span>
            </button>

            <div className="flex items-center gap-4">
              {/* Audio Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={language === 'es' ? 'Narración automática' : 'Auto narration'}
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-blue-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    language === 'es'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🇲🇽 ES
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🇺🇸 EN
                </button>
              </div>
            </div>
          </div>

          {/* Tour Title */}
          <h1 className="text-xl font-bold text-gray-900 mb-3">
            {getText(tour.title, language)}
          </h1>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {language === 'es' ? 'Progreso del tour' : 'Tour progress'}
              </span>
              <span className="font-semibold text-blue-600">
                {currentAreaIndex + 1} / {tour.areas.length} {language === 'es' ? 'áreas' : 'areas'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Area Header Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left: Image */}
            <div className="relative">
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg">
                  {language === 'es' ? 'Área' : 'Area'} {currentArea.order} {language === 'es' ? 'de' : 'of'} {tour.areas.length}
                </span>
              </div>
              <img
                src={currentArea.image}
                alt={getText(currentArea.name, language)}
                className="w-full h-64 md:h-full object-cover rounded-lg"
              />
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {getText(currentArea.name, language)}
                </h2>

                <p className="text-gray-600 mb-4">
                  {getText(currentArea.shortDescription, language)}
                </p>

                {/* Responsible */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 mb-4">
                  <img
                    src={currentArea.responsible.photo}
                    alt={currentArea.responsible.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <User className="w-4 h-4" />
                      <span>{language === 'es' ? 'Responsable' : 'Manager'}</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {currentArea.responsible.name}
                    </p>
                    {currentArea.responsible.position && (
                      <p className="text-sm text-gray-600">
                        {getText(currentArea.responsible.position, language)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Safety Notice */}
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      {language === 'es' ? 'Normas de Seguridad' : 'Safety Rules'}
                    </p>
                    <p className="text-sm text-yellow-800">
                      {getText(currentArea.safety, language)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {getText(tab.label, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid md:grid-cols-3 gap-6 p-6">
            {/* Left Column: Tab Content */}
            <div className="md:col-span-2">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {getText(currentArea.tabs[activeTab], language)}
                </p>
              </div>
            </div>

            {/* Right Column: Keypoints */}
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {language === 'es' ? '❓ Preguntas Frecuentes' : '❓ Frequently Asked Questions'}
                </h3>

                <div className="space-y-3">
                  {currentArea.keypoints.map((keypoint, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedKeypoint(expandedKeypoint === index ? null : index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 text-sm">
                          {getText(keypoint.question, language)}
                        </span>
                        {expandedKeypoint === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>

                      {expandedKeypoint === index && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <p className="text-sm text-gray-700">
                            {getText(keypoint.answer, language)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={goToPreviousArea}
            disabled={currentAreaIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentAreaIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            {language === 'es' ? 'Área Anterior' : 'Previous Area'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">
              {language === 'es' ? 'Área actual' : 'Current area'}
            </p>
            <p className="font-semibold text-gray-900">
              {getText(currentArea.name, language)}
            </p>
          </div>

          <button
            onClick={goToNextArea}
            disabled={currentAreaIndex === tour.areas.length - 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentAreaIndex === tour.areas.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            {language === 'es' ? 'Siguiente Área' : 'Next Area'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Completion Message */}
        {currentAreaIndex === tour.areas.length - 1 && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              {language === 'es' ? '¡Felicidades!' : 'Congratulations!'}
            </h3>
            <p className="text-green-800 mb-4">
              {language === 'es'
                ? 'Has completado el tour completo de nuestras instalaciones.'
                : 'You have completed the full tour of our facilities.'}
            </p>
            <button
              onClick={() => navigate('/tour')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              {language === 'es' ? 'Explorar más tours' : 'Explore more tours'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourViewerPage;
