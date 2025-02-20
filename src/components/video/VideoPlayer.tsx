interface VideoPlayerProps {
  url: string;
  title: string;
}



export function VideoPlayer({ url, title }: VideoPlayerProps) {
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

      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

      return(
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )
}