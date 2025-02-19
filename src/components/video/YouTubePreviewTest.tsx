import { useState, useEffect, useRef } from 'react';
import { useDebugStore } from '../../stores/debugStore';

interface YouTubePreviewTestProps {
  url: string;
}

export function YouTubePreviewTest({ url }: YouTubePreviewTestProps) {
  const { addLog } = useDebugStore();
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Extract video ID when URL changes
  useEffect(() => {
    const id = getYouTubeId(url);
    setVideoId(id);
    if (!id) {
      setError('Invalid YouTube URL');
    } else {
      addLog(`Setting video ID: ${id}`, 'info');
    }
  }, [url, addLog]);

  const handleIframeLoad = () => {
    addLog('YouTube iframe loaded successfully', 'success');
  };

  const handleIframeError = () => {
    addLog('YouTube iframe failed to load', 'error');
    setError('Failed to load video');
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
        Invalid YouTube URL
      </div>
    );
  }

  // Use privacy-enhanced mode and force HTTPS
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
  addLog(`Generated embed URL: ${embedUrl}`, 'info');

  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}