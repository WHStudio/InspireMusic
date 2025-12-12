import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Play, Pause } from 'lucide-react';
import { clsx } from 'clsx';
import type { Song, Platform } from '../types';
import { CoverImage } from './ui/CoverImage';

interface SongListProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  showHeader?: boolean;
}

const PlatformBadge = memo<{ platform: Platform }>(({ platform }) => {
  const colors = {
    netease: 'bg-red-500/20 text-red-400 border-red-500/30',
    kuwo: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    qq: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const names = {
    netease: '网易云',
    kuwo: '酷我',
    qq: 'QQ',
  };

  return (
    <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border", colors[platform])}>
      {names[platform]}
    </span>
  );
});

PlatformBadge.displayName = 'PlatformBadge';

interface SongRowProps {
  song: Song;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
}

const SongRow = memo<SongRowProps>(({ song, index, isCurrent, isPlaying, onPlay }) => {
  const handleDoubleClick = useCallback(() => onPlay(song), [onPlay, song]);
  const handleClick = useCallback(() => {
    if (window.innerWidth < 768) {
      onPlay(song);
    }
  }, [onPlay, song]);
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(song);
  }, [onPlay, song]);

  return (
    <div
      className={clsx(
        "group grid grid-cols-[auto_1fr] md:grid-cols-[auto_4fr_3fr_2fr_1fr] gap-4 px-4 py-3 rounded-md cursor-pointer transition-colors items-center text-sm hover:bg-white/5",
        isCurrent ? "text-primary" : "text-gray-300"
      )}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
    >
      <div className="w-8 flex items-center justify-center relative">
        <span className={clsx("md:group-hover:hidden", isCurrent && "text-primary")}>
          {isCurrent && isPlaying ? (
            <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" alt="playing" className="h-3" />
          ) : (
            index + 1
          )}
        </span>
        <button
          onClick={handleButtonClick}
          className="hidden md:group-hover:flex absolute inset-0 items-center justify-center text-white"
        >
          {isCurrent && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>
      <div className="flex items-center gap-3 overflow-hidden">
        <CoverImage
          src={song.pic}
          alt=""
          className="w-10 h-10 rounded object-cover bg-gray-800 shrink-0"
        />
        <div className="flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx("truncate font-medium", isCurrent ? "text-primary" : "text-white")}>
              {song.name}
            </span>
            <div className="md:hidden flex-shrink-0">
              <PlatformBadge platform={song.platform} />
            </div>
          </div>
          <div className="md:hidden text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
            <span>{song.artist}</span>
            {song.album && (
              <>
                <span>·</span>
                <span>{song.album}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="hidden md:block truncate hover:text-white hover:underline">{song.artist}</div>
      <div className="hidden md:block truncate hover:text-white hover:underline">{song.album || '-'}</div>
      <div className="hidden md:flex justify-end">
        <PlatformBadge platform={song.platform} />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.song.platform === nextProps.song.platform &&
    prevProps.index === nextProps.index &&
    prevProps.isCurrent === nextProps.isCurrent &&
    prevProps.isPlaying === nextProps.isPlaying
  );
});

SongRow.displayName = 'SongRow';

// Row height constant for virtualization
const ROW_HEIGHT = 64; // px - matches py-3 (12px*2) + content (~40px)
// Increase threshold to avoid issues with containers that don't have fixed height
const VIRTUALIZATION_THRESHOLD = 200;

export const SongList: React.FC<SongListProps> = memo(({
  songs,
  currentSong,
  isPlaying,
  onPlay,
  showHeader = true,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Measure container height for virtualization
  useEffect(() => {
    if (!parentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  // Determine if we should use virtualization
  // Only virtualize if we have many items AND the container has a measured height
  const shouldVirtualize = songs.length > VIRTUALIZATION_THRESHOLD && containerHeight > 0;

  const virtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10, // Render 10 extra items above/below viewport for smooth scrolling
    enabled: shouldVirtualize,
  });

  // For most lists, render normally (no virtualization overhead)
  // This ensures compatibility with all container types
  if (!shouldVirtualize) {
    return (
      <div className="w-full flex flex-col">
        {showHeader && (
          <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_4fr_3fr_2fr_1fr] gap-4 px-4 py-2 border-b border-gray-800 text-gray-400 text-sm font-medium sticky top-0 bg-background z-10">
            <div className="w-8 text-center">#</div>
            <div>标题</div>
            <div className="hidden md:block">歌手</div>
            <div className="hidden md:block">专辑</div>
            <div className="hidden md:block text-right">来源</div>
          </div>
        )}
        <div className="flex flex-col pb-4">
          {songs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id && currentSong?.platform === song.platform;
            return (
              <SongRow
                key={`${song.platform}-${song.id}`}
                song={song}
                index={index}
                isCurrent={isCurrent}
                isPlaying={isPlaying && isCurrent}
                onPlay={onPlay}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Virtualized list for very large datasets (200+ items)
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="w-full flex flex-col" style={{ height: '70vh', minHeight: '400px' }}>
      {showHeader && (
        <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_4fr_3fr_2fr_1fr] gap-4 px-4 py-2 border-b border-gray-800 text-gray-400 text-sm font-medium sticky top-0 bg-background z-10">
          <div className="w-8 text-center">#</div>
          <div>标题</div>
          <div className="hidden md:block">歌手</div>
          <div className="hidden md:block">专辑</div>
          <div className="hidden md:block text-right">来源</div>
        </div>
      )}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const song = songs[virtualRow.index];
            const isCurrent = currentSong?.id === song.id && currentSong?.platform === song.platform;

            return (
              <div
                key={`${song.platform}-${song.id}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <SongRow
                  song={song}
                  index={virtualRow.index}
                  isCurrent={isCurrent}
                  isPlaying={isPlaying && isCurrent}
                  onPlay={onPlay}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

SongList.displayName = 'SongList';
