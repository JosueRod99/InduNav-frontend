import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react';

// Narration player of the real tour viewer, shown in the header like the demo tour: play/pause,
// time, a seek bar to jump to any part of the audio, ±10 s and playback speed (these two from sm up).
// Keyboard: the seek bar is a native range (arrows move 5 s); pointer/touch seeking is computed on
// the drawn track so the audio jumps exactly where it is tapped. On phones the bar takes the free width.

interface NarrationPlayerProps {
  src: string;
  language: 'es' | 'en';
  isFallback?: boolean; // no narration in the selected language: the Spanish one plays
}

const SPEEDS = [1, 1.25, 1.5];

// Elapsed time rounds down and the total rounds up (a 0.8 s clip reads 0:01, not 0:00)
const format = (seconds: number, round: (n: number) => number = Math.floor) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const NarrationPlayer = ({ src, language, isFallback = false }: NarrationPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const tr = (es: string, en: string) => (language === 'es' ? es : en);

  // New area or language: stop and start over
  useEffect(() => {
    setIsPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed, src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else audio.pause();
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(Math.max(time, 0), audio.duration);
    setCurrent(audio.currentTime);
  };

  const seekToPointer = (e: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current?.getBoundingClientRect();
    if (!track || !duration) return;
    seek(((e.clientX - track.left) / track.width) * duration);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const iconButton = 'hidden flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 sm:block';

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1 rounded-lg sm:flex-none border border-slate-200 bg-slate-50 px-1.5 py-1 sm:gap-1.5 sm:px-2"
      title={isFallback ? 'Narration available in Spanish only' : undefined}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <button
        onClick={toggle}
        className="flex-shrink-0 rounded-full p-1 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
        aria-label={isPlaying ? tr('Pausar narración', 'Pause narration') : tr('Reproducir narración', 'Play narration')}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      <button
        onClick={() => seek(current - 10)}
        className={iconButton}
        aria-label={tr('Retroceder 10 segundos', 'Back 10 seconds')}
        title={tr('Retroceder 10 s', 'Back 10 s')}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>

      <span className="flex-shrink-0 font-mono text-[10px] text-slate-600 sm:text-xs">
        {/* Phones show the elapsed time only; the total is in the bar's accessible value */}
        {format(current)}
        <span className="hidden sm:inline">
          <span className="mx-0.5 text-slate-400">/</span>
          {format(duration, Math.ceil)}
        </span>
      </span>

      {/* Seek bar: a tall touch area over a thin drawn track; a transparent native range keeps keyboard access */}
      <div
        className="relative flex h-7 min-w-[2.5rem] flex-1 cursor-pointer touch-none items-center sm:w-20 sm:flex-none md:w-28"
        onPointerDown={(e) => {
          if (!duration) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          seekToPointer(e);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && seekToPointer(e)}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!duration}
          aria-label={tr('Posición de la narración', 'Narration position')}
          aria-valuetext={`${format(current)} / ${format(duration, Math.ceil)}`}
          className="peer pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
        <div ref={trackRef} className="relative h-1 w-full rounded-full bg-slate-200 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-focus-visible:ring-offset-1">
          <div className="absolute inset-y-0 left-0 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      <button
        onClick={() => seek(current + 10)}
        className={iconButton}
        aria-label={tr('Adelantar 10 segundos', 'Forward 10 seconds')}
        title={tr('Adelantar 10 s', 'Forward 10 s')}
      >
        <RotateCw className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
        className="hidden flex-shrink-0 rounded px-1 font-mono text-[11px] font-semibold text-slate-600 hover:bg-slate-200 sm:block"
        aria-label={tr(`Velocidad ${speed}x, cambiar`, `Speed ${speed}x, change`)}
        title={tr('Velocidad de reproducción', 'Playback speed')}
      >
        {speed}x
      </button>

      {isFallback && (
        <span className="flex-shrink-0 rounded bg-slate-200 px-1 text-[9px] font-semibold text-slate-600" aria-label="Narration in Spanish">
          ES
        </span>
      )}
    </div>
  );
};

export default NarrationPlayer;
