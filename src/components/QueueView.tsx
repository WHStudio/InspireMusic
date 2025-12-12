import React, { useState, useEffect, useCallback } from 'react';
import type { Song } from '../types';
import { X, Play, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface QueueViewProps {
  queue: Song[];
  currentIndex: number;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
  onClose: () => void;
  onClear: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  currentIndex,
  onPlay,
  onRemove,
  onClose,
  onClear,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Entry animation
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Handle close with exit animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Confirm clear timer
  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsVisible(false);
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 z-[59] transition-opacity duration-300",
          isVisible && !isClosing ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={clsx(
          "fixed inset-y-0 right-0 w-full md:w-80 bg-surface shadow-2xl z-[60] border-l border-gray-800 flex flex-col transition-transform duration-300 ease-out",
          isVisible && !isClosing ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-white">播放队列 ({queue.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirmClear) {
                  onClear();
                  setConfirmClear(false);
                  handleClose();
                } else {
                  setConfirmClear(true);
                }
              }}
              className={clsx(
                "p-2 rounded transition-colors",
                confirmClear ? "text-red-500 hover:bg-red-500/10" : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              title={confirmClear ? "点击确认清空" : "清空列表"}
            >
              <Trash2 size={18} />
            </button>
            <button onClick={handleClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 pb-32 md:pb-24">
          {queue.map((song, index) => (
            <div
              key={`${song.platform}-${song.id}-${index}`}
              className={clsx(
                "group flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-white/5 transition-colors",
                index === currentIndex ? "text-primary" : "text-gray-300"
              )}
              onDoubleClick={() => onPlay(index)}
              onClick={() => {
                if (window.innerWidth < 768) {
                  onPlay(index);
                }
              }}
            >
              <div className="w-4 text-xs text-center opacity-50 group-hover:hidden">
                {index + 1}
              </div>
              <button
                onClick={() => onPlay(index)}
                className="hidden group-hover:block w-4 text-center"
              >
                <Play size={12} fill="currentColor" />
              </button>

              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium">{song.name}</div>
                <div className="truncate text-xs opacity-70">{song.artist}</div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
