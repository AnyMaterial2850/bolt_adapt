import { useState } from 'react';

interface VideoPlayerProps {
  url: string;
  title: string;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getYouTubeId = (url: string) => {
    try {
      if (url.includes('youtube.com/shorts/')) {
        const id = url.split('shorts/')[1]?.split(/[#?]/)[0];
        return id;
      }
      
      // Handle youtu.be URLs
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split(/[#?]/)[0];
        return id;
      }
      
      // Handle standard youtube.com URLs
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        const id = urlObj.searchParams.get('v');
        return id;
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const videoId = getYouTubeId(url);
  const embedUrl = videoId 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1` 
    : '';

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load video. Please try again later.');
    setLoading(false);
  };

  if (!videoId) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center p-4">
          Invalid video URL. Please check the URL and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black w-full max-w-full sm:max-w-[90%] md:max-w-[80%] mx-auto">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <p className="text-white text-sm text-center p-4">{error}</p>
        </div>
      )}
      
      <iframe
        className="absolute inset-0 w-full h-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}
