import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Package,
  TrendingUp,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import { getTourBySlug, getText } from '../../demo/tourData';
import { getEnhancedAreaData } from '../../demo/enhancedTourData';
import ResumenTab from './components/ResumenTab';
import UbicacionTab from './components/UbicacionTab';
import OrganigramaTab from './components/OrganigramaTab';
import MetricasTab from './components/MetricasTab';
import EspecificacionesTab from './components/EspecificacionesTab';
import ProductosTab from './components/ProductosTab';
import DocumentacionTab from './components/DocumentacionTab';
import PredicionesTab from './components/PredicionesTab';

type TabType = 'resumen' | 'ubicacion' | 'organigrama' | 'metricas' | 'especificaciones' | 'productos' | 'documentacion' | 'predicciones';

const TourViewerPage = () => {
  const { tourSlug } = useParams<{ tourSlug: string }>();
  const navigate = useNavigate();

  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [expandedKeypoint, setExpandedKeypoint] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [isFaqExpanded, setIsFaqExpanded] = useState(false);
  const [narrationText, setNarrationText] = useState('');
  const [textCopied, setTextCopied] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timeoutId: number | null = null;

    const handleScroll = () => {
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce the state update
      timeoutId = setTimeout(() => {
        const currentScrollY = window.scrollY;
        const shouldBeCompact = currentScrollY > 150;

        setIsHeaderCompact(shouldBeCompact);
      }, 50); // 50ms debounce
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Sin dependencias para evitar re-creación del listener

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
  const enhancedData = getEnhancedAreaData(currentArea.id);

  // Función para generar el texto de narración
  const generateNarrationText = () => {
    const areaName = getText(currentArea.name, language);
    const shortDesc = getText(currentArea.shortDescription, language);
    const responsibleName = currentArea.responsible.name;
    const responsiblePosition = getText(currentArea.responsible.position, language);
    const safetyNotice = getText(currentArea.safety, language);
    const resumenContent = getText(currentArea.tabs.resumen, language);

    const welcomeText = language === 'es' ? 'Bienvenido a' : 'Welcome to';
    const responsibleText = language === 'es'
      ? `Esta área está bajo la responsabilidad de ${responsibleName}, ${responsiblePosition}.`
      : `This area is managed by ${responsibleName}, ${responsiblePosition}.`;
    const safetyText = language === 'es' ? 'Importante:' : 'Important:';

    return `${welcomeText} ${areaName}. ${shortDesc} ${responsibleText} ${safetyText} ${safetyNotice} ${resumenContent}`;
  };

  // Actualizar texto de narración cuando cambie el área o idioma
  useEffect(() => {
    // Detener audio anterior si existe
    if (audioElement) {
      console.log('⏹️ Deteniendo audio anterior');
      audioElement.pause();
      audioElement.src = '';
    }

    const text = generateNarrationText();
    setNarrationText(text);

    // Buscar audio pre-generado en los datos del área
    const savedAudioUrl = currentArea.audioFiles?.[language];

    console.log('🔍 DEBUG - Área:', getText(currentArea.name, language));
    console.log('🔍 DEBUG - Idioma:', language);
    console.log('🔍 DEBUG - Audio URL:', savedAudioUrl);
    console.log('🔍 DEBUG - audioFiles completo:', currentArea.audioFiles);

    if (savedAudioUrl) {
      // Modo: Audio real pre-generado
      console.log('✅ Audio encontrado, cargando:', savedAudioUrl);
      const audio = new Audio(savedAudioUrl);

      audio.addEventListener('loadedmetadata', () => {
        console.log('✅ Metadata cargada - Duración:', Math.floor(audio.duration), 'segundos');
        setTotalDuration(Math.floor(audio.duration));
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(Math.floor(audio.currentTime));
      });

      audio.addEventListener('ended', () => {
        console.log('⏹️ Audio terminado');
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', (e) => {
        console.error('❌ Error cargando audio:', e);
        console.error('URL del audio:', savedAudioUrl);
      });

      audio.addEventListener('canplay', () => {
        console.log('✅ Audio listo para reproducir');
      });

      setAudioElement(audio);
    } else {
      // Modo: Simulación
      console.log('⚠️ No hay audio disponible, usando simulación');
      setAudioElement(null);

      // Estimar duración basada en palabras (promedio 150 palabras por minuto)
      const wordCount = text.split(' ').length;
      const estimatedSeconds = Math.ceil((wordCount / 150) * 60);
      setTotalDuration(estimatedSeconds);
    }

    // Resetear estado del reproductor
    setCurrentTime(0);
    setIsPlaying(false);

    // Log para facilitar acceso al texto
    console.log('📝 Texto completo para enviar a OpenAI TTS:');
    console.log(text);

    // Cleanup
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [currentAreaIndex, language]);

  // Simulador de progreso de audio (solo cuando NO hay audio real)
  useEffect(() => {
    // Si hay audio real, el progreso se maneja con eventos del audio
    if (audioElement) return;

    let interval: number | null = null;

    if (isPlaying && currentTime < totalDuration) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration - 1) {
            setIsPlaying(false);
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTime, totalDuration, audioElement]);

  const togglePlayPause = () => {
    console.log('🎵 togglePlayPause llamado');
    console.log('🎵 audioElement existe:', !!audioElement);
    console.log('🎵 isPlaying actual:', isPlaying);

    if (audioElement) {
      // Modo: Audio real
      console.log('🎵 Usando audio real');
      if (isPlaying) {
        console.log('⏸️ Pausando audio');
        audioElement.pause();
      } else {
        if (currentTime >= totalDuration) {
          console.log('🔄 Reiniciando audio desde el inicio');
          audioElement.currentTime = 0;
        }
        console.log('▶️ Reproduciendo audio desde:', audioElement.currentTime);
        audioElement.play()
          .then(() => {
            console.log('✅ Audio reproduciendo exitosamente');
          })
          .catch((error) => {
            console.error('❌ Error al reproducir audio:', error);
          });
      }
      setIsPlaying(!isPlaying);
    } else {
      // Modo: Simulación
      console.log('⚠️ Usando simulación (no hay audio real)');
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyNarrationText = async () => {
    try {
      await navigator.clipboard.writeText(narrationText);
      setTextCopied(true);
      console.log('📋 Texto de narración copiado al portapapeles:');
      console.log(narrationText);
      setTimeout(() => setTextCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar texto:', err);
      // Fallback: mostrar el texto en consola
      console.log('📋 Texto de narración para copiar manualmente:');
      console.log(narrationText);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <ResumenTab content={currentArea.tabs.resumen} language={language} />;
      case 'ubicacion':
        return <UbicacionTab content={currentArea.tabs.ubicacion} layout={enhancedData.layout} language={language} />;
      case 'organigrama':
        return <OrganigramaTab content={currentArea.tabs.organigrama} employees={enhancedData.employees} language={language} />;
      case 'metricas':
        return <MetricasTab content={currentArea.tabs.costos} metrics={enhancedData.metrics} chartData={enhancedData.chartData.production} language={language} />;
      case 'especificaciones':
        return <EspecificacionesTab specifications={enhancedData.specifications} language={language} />;
      case 'productos':
        return <ProductosTab products={enhancedData.products} language={language} />;
      case 'documentacion':
        return <DocumentacionTab language={language} />;
      case 'predicciones':
        return <PredicionesTab content={currentArea.tabs.predicciones} language={language} />;
      default:
        return null;
    }
  };

  const goToNextArea = () => {
    if (currentAreaIndex < tour.areas.length - 1) {
      setCurrentAreaIndex(currentAreaIndex + 1);
      setActiveTab('resumen');
      setExpandedKeypoint(null);
      setIsFaqExpanded(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousArea = () => {
    if (currentAreaIndex > 0) {
      setCurrentAreaIndex(currentAreaIndex - 1);
      setActiveTab('resumen');
      setExpandedKeypoint(null);
      setIsFaqExpanded(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabs: Array<{ id: TabType; label: { es: string; en: string }; Icon: any }> = [
    { id: 'resumen', label: { es: 'Resumen', en: 'Summary' }, Icon: FileText },
    { id: 'ubicacion', label: { es: 'Ubicación', en: 'Location' }, Icon: MapPin },
    { id: 'organigrama', label: { es: 'Equipo', en: 'Team' }, Icon: Users },
    { id: 'metricas', label: { es: 'Métricas', en: 'Metrics' }, Icon: BarChart3 },
    { id: 'especificaciones', label: { es: 'Especificaciones', en: 'Specifications' }, Icon: Settings },
    { id: 'productos', label: { es: 'Productos', en: 'Products' }, Icon: Package },
    { id: 'documentacion', label: { es: 'Documentos', en: 'Documents' }, Icon: BookOpen },
    { id: 'predicciones', label: { es: 'Proyecciones', en: 'Projections' }, Icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact on scroll */}
      <div className={`bg-white border-b border-slate-200 sticky top-0 z-50 transition-all duration-300 overflow-hidden ${
        isHeaderCompact ? 'shadow-sm' : 'shadow-md'
      }`}>
        <div className={`max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 transition-all duration-300 ${
          isHeaderCompact ? 'py-2' : 'py-4'
        }`}>
          {/* Main Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <button
                onClick={() => navigate('/tour')}
                className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className={`text-sm font-medium transition-all duration-300 hidden sm:inline ${
                !isHeaderCompact ? 'opacity-100' : 'opacity-0 max-w-0 overflow-hidden'
              }`}>
                {language === 'es' ? 'Volver' : 'Back'}
              </span>
              </button>

              <div className={`flex items-center gap-1.5 sm:gap-2 transition-all duration-300 ${
                isHeaderCompact ? 'opacity-100 max-w-[150px] sm:max-w-md' : 'opacity-0 max-w-0 overflow-hidden'
              }`}>
                <div className="h-4 sm:h-6 w-px bg-slate-300"></div>
                <span className="text-xs sm:text-sm font-semibold text-blue-700 whitespace-nowrap truncate">
                  {getText(currentArea.name, language)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Progress indicator when compact - Hidden on mobile */}
              <span className={`hidden sm:inline text-xs font-medium text-slate-600 transition-all duration-300 ${
                isHeaderCompact ? 'opacity-100 max-w-20' : 'opacity-0 max-w-0 overflow-hidden'
              }`}>
                {currentAreaIndex + 1}/{tour.areas.length}
              </span>

              {/* Audio Player */}
              <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 rounded-lg px-1.5 sm:px-3 py-1.5 border border-slate-200">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayPause}
                  className="p-1 rounded-full hover:bg-blue-100 transition-colors group flex-shrink-0"
                  title={
                    audioElement
                      ? language === 'es' ? 'Reproducir narración' : 'Play narration'
                      : language === 'es' ? 'Vista previa (simulación)' : 'Preview (simulation)'
                  }
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 group-hover:text-blue-700" />
                  )}
                </button>

                {/* Time Display */}
                <div className="flex items-center gap-0.5 sm:gap-1 text-xs font-mono text-slate-600">
                  <span className="text-[9px] sm:text-xs">{formatTime(currentTime)}</span>
                  <span className="text-slate-400 text-[9px] sm:text-xs">/</span>
                  <span className="text-[9px] sm:text-xs">{formatTime(totalDuration)}</span>
                </div>

                {/* Progress Bar */}
                <div className="relative w-12 sm:w-16 md:w-24 h-1 bg-slate-200 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="absolute h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                  />
                </div>

                {/* Copy Text Button */}
                <button
                  onClick={copyNarrationText}
                  className="p-1 rounded-full hover:bg-green-100 transition-colors group flex-shrink-0"
                  title={language === 'es' ? 'Copiar texto de narración' : 'Copy narration text'}
                >
                  {textCopied ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-hover:text-green-600" />
                  )}
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5 flex-shrink-0">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                    language === 'es'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Header Content */}
          <div className={`transition-all duration-300 overflow-hidden ${
            !isHeaderCompact ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}>
            {/* Tour Title */}
            <h1 className="text-base sm:text-lg font-bold text-blue-700 mb-2">
              {getText(tour.title, language)}
            </h1>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {language === 'es' ? 'Progreso' : 'Progress'}
                </span>
                <span className="font-semibold text-slate-900">
                  {currentAreaIndex + 1} / {tour.areas.length}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Area Header Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 border border-slate-200">
          <div className="grid md:grid-cols-2 gap-4 p-4">
            {/* Left: Image - Fixed height */}
            <div className="relative h-48 md:h-auto md:max-h-96">
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow">
                  {currentArea.order}/{tour.areas.length}
                </span>
              </div>
              <img
                src={currentArea.image}
                alt={getText(currentArea.name, language)}
                className="w-full h-full object-cover rounded"
              />
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-start overflow-y-auto max-h-96">
              <div>
                <h2 className="text-2xl font-bold text-blue-700 mb-2">
                  {getText(currentArea.name, language)}
                </h2>

                <p className="text-sm text-slate-600 mb-3">
                  {getText(currentArea.shortDescription, language)}
                </p>

                {/* Responsible */}
                <div className="flex items-center gap-3 bg-slate-50 rounded p-3 mb-3 border border-slate-200">
                  <img
                    src={currentArea.responsible.photo}
                    alt={currentArea.responsible.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
                      <User className="w-3 h-3" />
                      <span>{language === 'es' ? 'Responsable' : 'Manager'}</span>
                    </div>
                    <p className="font-semibold text-sm text-slate-900">
                      {currentArea.responsible.name}
                    </p>
                    {currentArea.responsible.position && (
                      <p className="text-xs text-slate-600">
                        {getText(currentArea.responsible.position, language)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Safety Notice */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded p-3 mb-3">
                  <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-900 mb-0.5">
                      {language === 'es' ? 'Seguridad' : 'Safety'}
                    </p>
                    <p className="text-xs text-amber-800">
                      {getText(currentArea.safety, language)}
                    </p>
                  </div>
                </div>

                {/* FAQs - Collapsible Panel */}
                <div className="bg-slate-50 rounded border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setIsFaqExpanded(!isFaqExpanded)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      {isFaqExpanded ? (
                        <ChevronUp className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-blue-600" />
                      )}
                      {language === 'es' ? 'Preguntas Frecuentes' : 'FAQ'}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {currentArea.keypoints.length} {language === 'es' ? 'preguntas' : 'questions'}
                    </span>
                  </button>

                  {isFaqExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {currentArea.keypoints.map((keypoint, index) => (
                        <div
                          key={index}
                          className="bg-white rounded shadow-sm overflow-hidden border border-slate-200"
                        >
                          <button
                            onClick={() => setExpandedKeypoint(expandedKeypoint === index ? null : index)}
                            className="w-full px-2 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                          >
                            <span className="font-medium text-slate-900 text-xs">
                              {getText(keypoint.question, language)}
                            </span>
                            {expandedKeypoint === index ? (
                              <ChevronUp className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            )}
                          </button>

                          {expandedKeypoint === index && (
                            <div className="px-2 py-2 bg-slate-50 border-t border-slate-200">
                              <p className="text-xs text-slate-700">
                                {getText(keypoint.answer, language)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 border border-slate-200">
          {/* Tab Headers */}
          <div className="border-b border-slate-200 overflow-x-auto">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.Icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-700 bg-blue-50'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {getText(tab.label, language)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {renderTabContent()}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <button
            onClick={goToPreviousArea}
            disabled={currentAreaIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
              currentAreaIndex === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'es' ? 'Anterior' : 'Previous'}
          </button>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              {language === 'es' ? 'Área actual' : 'Current area'}
            </p>
            <p className="text-sm font-semibold text-blue-700">
              {getText(currentArea.name, language)}
            </p>
          </div>

          <button
            onClick={goToNextArea}
            disabled={currentAreaIndex === tour.areas.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
              currentAreaIndex === tour.areas.length - 1
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {language === 'es' ? 'Siguiente' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Completion Message */}
        {currentAreaIndex === tour.areas.length - 1 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              {language === 'es' ? '¡Tour Completado!' : 'Tour Completed!'}
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              {language === 'es'
                ? 'Has completado el recorrido de todas las áreas.'
                : 'You have completed the tour of all areas.'}
            </p>
            <button
              onClick={() => navigate('/tour')}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {language === 'es' ? 'Ver más tours' : 'View more tours'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourViewerPage;
