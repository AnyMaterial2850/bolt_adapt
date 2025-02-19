import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPlayer } from '../VideoPlayer';

// Mock the useAuthStore hook
vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    addDebugLog: vi.fn(),
  }),
}));

describe('VideoPlayer', () => {
  // Mock requestAnimationFrame
  beforeEach(() => {
    vi.useFakeTimers();
    global.requestAnimationFrame = vi.fn(cb => {
      cb();
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // Test URL parsing
  describe('URL parsing', () => {
    it('handles standard YouTube URLs correctly', () => {
      render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1');
    });

    it('handles YouTube Shorts URLs correctly', () => {
      render(
        <VideoPlayer 
          url="https://youtube.com/shorts/dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1');
    });

    it('handles youtu.be URLs correctly', () => {
      render(
        <VideoPlayer 
          url="https://youtu.be/dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1');
    });

    it('shows error message for invalid URLs', () => {
      render(
        <VideoPlayer 
          url="https://invalid-url.com" 
          title="Test Video" 
        />
      );
      
      expect(screen.getByText('Invalid YouTube URL')).toBeInTheDocument();
    });
  });

  // Test loading states
  describe('Loading states', () => {
    it('shows loading spinner initially', () => {
      render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('hides loading spinner after iframe loads', async () => {
      render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      act(() => {
        iframe.dispatchEvent(new Event('load'));
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  // Test error handling
  describe('Error handling', () => {
    it('shows error message when iframe fails to load', async () => {
      render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      act(() => {
        iframe.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load video')).toBeInTheDocument();
      });
    });

    it('shows retry button when error occurs', async () => {
      render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      act(() => {
        iframe.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('attempts to reload video when retry is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      act(() => {
        iframe.dispatchEvent(new Event('error'));
      });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Retry'));
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('stops retrying after maximum attempts', async () => {
      render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      
      // Simulate 4 errors (exceeding the 3 retry limit)
      for (let i = 0; i < 4; i++) {
        act(() => {
          iframe.dispatchEvent(new Event('error'));
          vi.advanceTimersByTime(2000);
        });
      }

      await waitFor(() => {
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
      });
    });
  });

  // Test cleanup
  describe('Cleanup', () => {
    it('cleans up timeouts when unmounting', () => {
      const { unmount } = render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      act(() => {
        iframe.dispatchEvent(new Event('error'));
      });

      unmount();
      
      // Advance timers to ensure no errors occur
      act(() => {
        vi.runAllTimers();
      });
    });

    it('resets state when URL changes', () => {
      const { rerender } = render(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
          title="Test Video" 
        />
      );
      
      const iframe = screen.getByTitle('Test Video');
      act(() => {
        iframe.dispatchEvent(new Event('error'));
      });

      rerender(
        <VideoPlayer 
          url="https://www.youtube.com/watch?v=different" 
          title="Test Video" 
        />
      );

      expect(screen.queryByText('Failed to load video')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});