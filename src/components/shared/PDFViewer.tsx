import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
    let isMounted = true;

    async function renderPDF() {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        pdfDoc = await pdfjsLib.getDocument({ url, disableWorker: true } as any).promise;
        
        if (!isMounted) return;
        
        const page = await pdfDoc.getPage(1);
        
        // Calculate responsive scale based on container width
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = canvasRef.current;
        
        if (!canvas || !isMounted) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Calculate scale to fit within container
        const containerWidth = canvas.parentElement?.clientWidth || 300;
        const scale = containerWidth / viewport.width;
        
        // Create new viewport with adjusted scale
        const scaledViewport = page.getViewport({ scale });
        
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error rendering PDF:', error);
        if (isMounted) {
          setError('Failed to load PDF. Please try again later.');
          setLoading(false);
        }
      }
    }

    renderPDF();

    // Handle window resize for responsive scaling
    const handleResize = () => {
      if (pdfDoc) renderPDF();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      pdfDoc?.destroy();
    };
  }, [url]);

  return (
    <div className="w-full max-h-[300px] sm:max-h-[400px] md:max-h-[500px] overflow-auto rounded-lg bg-gray-100">
      {loading && (
        <div className="flex justify-center items-center h-[200px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center h-[200px] text-center p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className={`w-full h-auto mx-auto block ${loading || error ? 'hidden' : ''}`} 
      />
    </div>
  );
}
