/**
 * Audio Preloader - Manages predictive preloading based on user behavior
 */

import { audioService } from '../services/audio.service';

interface PreloadItem {
  trackId: string;
  streamUrl: string;
  metadata: {
    trackId: string;
    title: string;
    artist: string;
    duration: number;
    streamUrl: string;
  };
}

class AudioPreloader {
  private scrollDirection: 'up' | 'down' | null = null;
  private lastScrollY = 0;
  private scrollVelocity = 0;

  /**
   * Track scroll behavior to predict next content
   */
  trackScrollBehavior() {
    let lastTime = Date.now();

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTime;
      const scrollDiff = currentScrollY - this.lastScrollY;

      // Calculate velocity
      this.scrollVelocity = Math.abs(scrollDiff / timeDiff);

      // Determine direction
      if (scrollDiff > 0) {
        this.scrollDirection = 'down';
      } else if (scrollDiff < 0) {
        this.scrollDirection = 'up';
      }

      this.lastScrollY = currentScrollY;
      lastTime = currentTime;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }

  /**
   * Preload next items based on current index
   */
  preloadNextItems(
    currentIndex: number,
    items: PreloadItem[],
    preloadCount: number = 3
  ) {
    const nextItems: PreloadItem[] = [];

    // Preload next items
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < items.length) {
        nextItems.push(items[nextIndex]);
      }
    }

    // Also preload previous item if scrolling up
    if (this.scrollDirection === 'up' && currentIndex > 0) {
      nextItems.unshift(items[currentIndex - 1]);
    }

    // Add to preload queue
    const tracks = nextItems.map(item => ({
      trackId: item.trackId,
      streamUrl: item.streamUrl,
      metadata: item.metadata,
    }));

    audioService.addToPreloadQueue(tracks);
  }

  /**
   * Preload items in viewport
   */
  preloadVisibleItems(items: PreloadItem[]) {
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;

    items.forEach((item, index) => {
      const element = document.querySelector(`[data-audio-index="${index}"]`);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollTop;
      const elementBottom = elementTop + rect.height;

      // Check if element is in or near viewport
      const isVisible =
        (elementTop >= scrollTop && elementTop <= scrollTop + viewportHeight) ||
        (elementBottom >= scrollTop && elementBottom <= scrollTop + viewportHeight);

      const isNearViewport =
        elementTop <= scrollTop + viewportHeight * 1.5 &&
        elementBottom >= scrollTop - viewportHeight * 0.5;

      if (isVisible || isNearViewport) {
        audioService.preloadAudio(item.trackId, item.streamUrl, item.metadata);
      }
    });
  }

  /**
   * Get scroll direction
   */
  getScrollDirection(): 'up' | 'down' | null {
    return this.scrollDirection;
  }

  /**
   * Get scroll velocity
   */
  getScrollVelocity(): number {
    return this.scrollVelocity;
  }
}

export const audioPreloader = new AudioPreloader();
