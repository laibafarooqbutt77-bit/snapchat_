import React, { useEffect, useState } from 'react';
import { getMediaObjectUrl } from '../../utils/idb';
import { ImageOff } from 'lucide-react';

interface MediaPreviewProps {
  mediaId?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaId,
  mediaUrl,
  mediaType = 'photo',
  alt = 'Lumo media',
  className = '',
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(mediaUrl || null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (mediaId) {
      getMediaObjectUrl(mediaId).then((url) => {
        if (mounted && url) {
          setResolvedUrl(url);
          setErrored(false);
        }
      });
    } else if (mediaUrl) {
      setResolvedUrl(mediaUrl);
      setErrored(false);
    }
    return () => {
      mounted = false;
    };
  }, [mediaId, mediaUrl]);

  if (!resolvedUrl || errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#181818] text-[#A1A1A1] ${className}`}
      >
        <ImageOff className="w-7 h-7 mb-1.5 opacity-60" />
        <span className="text-xs font-medium">Media unavailable</span>
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <video
        src={resolvedUrl}
        className={className}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setErrored(true)}
    />
  );
};
