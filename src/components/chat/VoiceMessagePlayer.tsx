import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { getMediaObjectUrl } from '../../utils/idb';

interface VoiceMessagePlayerProps {
  mediaId?: string;
  mediaUrl?: string;
  duration?: number;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  mediaId,
  mediaUrl,
  duration = 5,
}) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(mediaUrl || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    if (mediaId) {
      getMediaObjectUrl(mediaId).then((url) => {
        if (active && url) setAudioUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [mediaId]);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onTime = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const bars = [35, 65, 90, 50, 78, 95, 42, 70, 88, 55, 68, 40, 80, 60, 45];

  return (
    <div className="flex items-center gap-3 min-w-[190px] py-1">
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-[#FFFC00] text-black flex items-center justify-center shrink-0 hover:brightness-95"
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
      >
        {playing ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
      </button>

      <div className="flex items-center gap-0.5 flex-1 h-7">
        {bars.map((h, i) => {
          const filled = (i / bars.length) * 100 <= progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors ${
                filled ? 'bg-[#FFFC00]' : 'bg-[#3F3F46]'
              }`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      <span className="text-[11px] font-mono tabular-nums text-[#A1A1A1] shrink-0">
        0:{String(Math.round(duration)).padStart(2, '0')}
      </span>
    </div>
  );
};
