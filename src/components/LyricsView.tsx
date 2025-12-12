import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { ParsedLyricLine, Song } from '../types';
import { ChevronDown, AudioLines } from 'lucide-react';
import { clsx } from 'clsx';
import { CoverImage } from './ui/CoverImage';

interface LyricsViewProps {
  lyrics: ParsedLyricLine[];
  activeLyricIndex: number;
  currentSong: Song | null;
  coverUrl?: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSeek?: (time: number) => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyrics,
  activeLyricIndex,
  currentSong,
  coverUrl,
  loading,
  error,
  onClose,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [userScrolling, setUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollingRef = useRef(false);
  const lastActiveLyricIndexRef = useRef(activeLyricIndex);
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Check if lyrics contain translations
  const hasTranslations = useMemo(() => {
    return lyrics.some(line => line.translation);
  }, [lyrics]);

  // Clear lyric refs when lyrics change (fix memory leak)
  useEffect(() => {
    lyricRefs.current.clear();
  }, [lyrics]);

  // Cleanup on unmount (fix memory leak)
  useEffect(() => {
    return () => {
      lyricRefs.current.clear();
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // Entry animation
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Register lyric element ref
  const setLyricRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      lyricRefs.current.set(index, el);
    } else {
      lyricRefs.current.delete(index);
    }
  }, []);

  // Scroll to center the active lyric
  const scrollToActiveLyric = useCallback((index: number, smooth = true) => {
    const container = containerRef.current;
    const activeElement = lyricRefs.current.get(index);
    
    if (!container || !activeElement) return;

    const containerHeight = container.clientHeight;
    const elementTop = activeElement.offsetTop;
    const elementHeight = activeElement.offsetHeight;
    
    // Calculate target scroll position to center the element
    const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
    
    // Mark as auto-scrolling to prevent triggering user scroll detection
    isAutoScrollingRef.current = true;
    
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: smooth ? 'smooth' : 'auto',
    });
    
    // Reset auto-scrolling flag after animation completes
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, smooth ? 500 : 50);
  }, []);

  // Handle wheel event to detect user scrolling (more reliable than scroll event)
  const handleWheel = useCallback(() => {
    // User is actively scrolling with mouse wheel
    setUserScrolling(true);
    setShowScrollButton(true);
    
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    
    userScrollTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
      setShowScrollButton(false);
    }, 4000);
  }, []);

  // Handle touch interaction to detect user scrolling
  const handleTouchStart = useCallback(() => {
    setUserScrolling(true);
    setShowScrollButton(true);
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
      setShowScrollButton(false);
    }, 4000);
  }, []);

  // Scroll to active lyric when it changes (only if user is not scrolling)
  useEffect(() => {
    if (activeLyricIndex >= 0 && activeLyricIndex !== lastActiveLyricIndexRef.current) {
      lastActiveLyricIndexRef.current = activeLyricIndex;
      
      if (!userScrolling) {
        scrollToActiveLyric(activeLyricIndex, true);
      }
    }
  }, [activeLyricIndex, userScrolling, scrollToActiveLyric]);

  // Initial scroll on mount (without smooth behavior for instant positioning)
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyrics.length > 0) {
      // Small delay to ensure refs are set
      const timer = setTimeout(() => {
        scrollToActiveLyric(activeLyricIndex, false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lyrics]); // Re-run when lyrics change (new song)

  // Handle lyric click to seek
  const handleLyricClick = useCallback((time: number) => {
    if (onSeek) {
      onSeek(time);
      setUserScrolling(false);
      setShowScrollButton(false);
    }
  }, [onSeek]);

  // Handle close with exit animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div 
      className={clsx(
        "fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-40 flex flex-col transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <button 
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronDown size={32} />
        </button>
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Now Playing</div>
          <div className="font-bold text-white">{currentSong?.name}</div>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden pb-24">
        {/* Left: Cover Art (Desktop) */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-12">
          <div 
            key={currentSong?.id}
            className={clsx(
              "w-full max-w-md aspect-square transition-all duration-500 ease-out",
              isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
            )}
          >
            <CoverImage 
              src={coverUrl || currentSong?.pic} 
              alt={currentSong?.name} 
              className="w-full h-full object-cover rounded-lg shadow-2xl"
            />
          </div>
        </div>

        {/* Right: Lyrics */}
        <div className="w-full md:w-1/2 relative">
          {/* User scrolling indicator */}
          <button
            onClick={() => {
              setUserScrolling(false);
              setShowScrollButton(false);
              scrollToActiveLyric(activeLyricIndex, true);
            }}
            className={clsx(
              "absolute bottom-24 right-6 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl hover:bg-white/20 transition-all duration-200",
              showScrollButton && activeLyricIndex >= 0 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-80 pointer-events-none"
            )}
          >
            <AudioLines size={24} fill="currentColor" />
          </button>
          
          <div 
            ref={containerRef}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="absolute inset-0 overflow-y-auto custom-scrollbar px-8 flex flex-col items-center md:items-start"
            style={{ paddingTop: '40vh', paddingBottom: '50vh' }}
          >
            {loading ? (
              <div className="text-gray-500 text-xl mt-20">歌词加载中...</div>
            ) : error ? (
              <div className="text-red-500 text-xl mt-20">{error}</div>
            ) : lyrics.length > 0 ? (
              lyrics.map((line, index) => {
                const isActive = index === activeLyricIndex;
                const isPast = index < activeLyricIndex;
                
                return (
                  <div
                    key={index}
                    ref={(el) => setLyricRef(index, el)}
                    className={clsx(
                      "text-center md:text-left cursor-pointer select-none transition-all duration-300 ease-out",
                      hasTranslations ? "mb-6" : "mb-5",
                      isActive ? "scale-105 opacity-100" : isPast ? "scale-100 opacity-50" : "scale-100 opacity-70"
                    )}
                    style={{
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      opacity: isActive ? 1 : isPast ? 0.5 : 0.7,
                    }}
                    onClick={() => handleLyricClick(line.time)}
                  >
                    {/* Main lyric text */}
                    <div 
                      className={clsx(
                        "leading-relaxed transition-colors duration-200",
                        isActive 
                          ? "text-2xl md:text-3xl lg:text-4xl font-bold text-primary" 
                          : "text-xl md:text-2xl lg:text-3xl font-medium text-white",
                        !isActive && "hover:text-primary/70"
                      )}
                    >
                      {line.text}
                    </div>
                    
                    {/* Translation text */}
                    {line.translation && (
                      <div 
                        className={clsx(
                          "mt-2 leading-relaxed transition-colors duration-200",
                          isActive 
                            ? "text-base md:text-lg lg:text-xl text-primary/80 font-medium"
                            : "text-sm md:text-base lg:text-lg text-white/60 font-normal",
                        )}
                      >
                        {line.translation}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 text-xl mt-20">暂无歌词</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
