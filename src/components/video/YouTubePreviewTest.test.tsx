import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YouTubePreviewTest } from './YouTubePreviewTest';

// Mock the useDebugStore hook
vi.mock('../../stores/debugStore', () => ({
  useDebugStore: () => ({
    addLog: vi.fn(),
  }),
}));

describe('YouTubePreviewTest', () => {
  // Test URL parsing
  describe('URL parsing', () => {
    it('handles standard YouTube URLs correctly', () => {
      render(
        <YouTubePreviewTest 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
        />
      );
      
      const iframe = screen.getByTitle('YouTube video player');
      expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1');
    });

    it('handles YouTube Shorts URLs correctly', () => {
      render(
        <YouTubePreviewTest 
          url="https://youtube.com/shorts/dQw4w9WgXcQ" 
        />
      );
      
      const iframe = screen.getByTitle('YouTube video player');
      expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1');
    });

    it('handles youtu.be URLs correctly', () => {
      render(
        <YouTubePreviewTest 
          url="https://youtu.be/dQw4w9WgXcQ" 
        />
      );
      
      const iframe = screen.getByTitle('YouTube video player');
      expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1');
    });

    it('shows error message for invalid URLs', () => {
      render(
        <YouTubePreviewTest 
          url="https://invalid-url.com" 
        />
      );
      
      expect(screen.getByText('Invalid YouTube URL')).toBeInTheDocument();
    });
  });

  // Test loading states
  describe('Loading states', () => {
    it('shows loading spinner initially', () => {
      render(
        <YouTubePreviewTest 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
        />
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});