import { useState, useEffect, useRef } from 'react';
import { useDebugStore } from '../../stores/debugStore';

interface VideoPlayerProps {
  url: string;
  title: string;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const { addLog } = useDebugStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const retryTimeoutRef = useRef<number>();

  // Extract video ID from various YouTube URL formats
  const getYouTubeId = (url: string) => {
    try {
      addLog(`Parsing YouTube URL: ${url}`, 'info');
      
      // Handle youtube.com/shorts URLs
      if (url.includes('youtube.com/shorts/')) {
        const id = url.split('shorts/')[1]?.split(/[#?]/)[0];
        addLog(`Extracted Shorts ID: ${id}`, 'info');
        return id;
      }
      
      // Handle youtu.be URLs
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split(/[#?]/)[0];
        addLog(`Extracted youtu.be ID: ${id}`, 'info');
        return id;
      }
      
      // Handle standard youtube.com URLs
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        const id = urlObj.searchParams.get('v');
        addLog(`Extracted standard YouTube ID: ${id}`, 'info');
        return id;
      }
      
      addLog('No valid YouTube ID found', 'error');
      return null;
    } catch (err) {
      addLog(`Error parsing YouTube URL: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      return null;
    }
  };

  const videoId = getYouTubeId(url);

  // Cleanup function to clear any pending timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when URL changes
  useEffect(() => {
    retryCount.current = 0;
    setError(null);
    setIsLoading(true);

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
    }
  }, [url]);

  const handleRetry = () => {
    if (retryCount.current >= maxRetries) {
      return;
    }

    retryCount.current++;
    setIsLoading(true);
    setError(null);
    
    // Force iframe reload
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = '';
      
      // Use requestAnimationFrame for smoother reload
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = src;
        }
      });
    }
  };

  if (!videoId) {
    return (
      <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
        Invalid YouTube URL
      </div>
    );
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
    addLog('Video loaded successfully', 'success');
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load video');
    addLog('Video failed to load', 'error');
    
    // Automatically retry on error
    if (retryCount.current < maxRetries) {
      retryTimeoutRef.current = window.setTimeout(handleRetry, 2000);
    }
  };

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" role="status" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 p-4 text-sm">
          <div className="text-center">
            <p>{error}</p>
            {retryCount.current < maxRetries && (
              <button 
                onClick={handleRetry}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="absolute inset-0 w-full h-full"
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        loading="lazy"
      />
    </div>
  );
}