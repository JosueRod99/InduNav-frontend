import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, MapPin, Lock } from 'lucide-react';
import { DEMO_TOURS, getText } from '../../demo/tourData';

const TourCatalogPage = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const handleStartTour = (slug: string, isActive: boolean) => {
    if (!isActive) {
      alert(language === 'es' ? 'Este tour no está disponible actualmente' : 'This tour is not currently available');
      return;
    }
    navigate(`/tour/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'es' ? '🏭 Tours Virtuales Disponibles' : '🏭 Available Virtual Tours'}
              </h1>
              <p className="mt-2 text-gray-600">
                {language === 'es'
                  ? 'Explora nuestras instalaciones desde cualquier lugar del mundo'
                  : 'Explore our facilities from anywhere in the world'
                }
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('es')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  language === 'es'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🇲🇽 Español
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🇺🇸 English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DEMO_TOURS.map((tour) => (
            <div
              key={tour.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                tour.isActive ? 'hover:scale-105 cursor-pointer' : 'opacity-75'
              }`}
              onClick={() => handleStartTour(tour.slug, tour.isActive)}
            >
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={tour.coverImage}
                  alt={getText(tour.title, language)}
                  className="w-full h-full object-cover"
                />

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {tour.isActive ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      {language === 'es' ? 'DISPONIBLE' : 'AVAILABLE'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      <Lock className="w-3 h-3" />
                      {language === 'es' ? 'PRÓXIMAMENTE' : 'COMING SOON'}
                    </span>
                  )}
                </div>

                {/* Play Button Overlay (only for active tours) */}
                {tour.isActive && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white rounded-full p-4 shadow-xl">
                        <Play className="w-8 h-8 text-blue-600 fill-blue-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {getText(tour.title, language)}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {getText(tour.description, language)}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{tour.plant}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{getText(tour.duration, language)}</span>
                  </div>
                </div>

                {/* Areas Count */}
                {tour.isActive && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      {language === 'es'
                        ? `${tour.areas.length} áreas a visitar`
                        : `${tour.areas.length} areas to visit`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {language === 'es' ? 'ℹ️ Sobre los Tours Virtuales' : 'ℹ️ About Virtual Tours'}
          </h3>
          <p className="text-blue-800">
            {language === 'es'
              ? 'Nuestros tours virtuales te permiten conocer nuestras instalaciones de manera interactiva. Cada tour incluye información detallada sobre nuestros procesos, estándares de calidad y medidas de seguridad. Los tours están optimizados para visualización en computadoras, tablets y smartphones.'
              : 'Our virtual tours allow you to explore our facilities interactively. Each tour includes detailed information about our processes, quality standards, and safety measures. Tours are optimized for viewing on computers, tablets, and smartphones.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourCatalogPage;
