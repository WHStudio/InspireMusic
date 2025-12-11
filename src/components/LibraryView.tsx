import React from 'react';
import type { Song, LocalPlaylist, Platform, Quality } from '../types';
import { QualitySettingsSection } from './library/QualitySettingsSection';
import { SleepTimerSection } from './library/SleepTimerSection';
import { ImportPlaylistSection } from './library/ImportPlaylistSection';
import { PlaylistGrid } from './library/PlaylistGrid';

interface LibraryViewProps {
    playlists: LocalPlaylist[];
    favorites: Song[];
    playlistSource: Platform;
    onPlaylistSourceChange: (source: Platform) => void;
    onImportPlaylist: (id: string) => void;
    loadingPlaylist: boolean;
    onCreatePlaylist: () => void;
    onSelectPlaylist: (playlist: LocalPlaylist) => void;
    onPlayFavorites: () => void;
    onPlayPlaylist: (playlist: LocalPlaylist) => void;
    quality: Quality;
    onQualityChange: (q: Quality) => void;
    sleepEndTime: number | null;
    onSetSleepTimer: (minutes: number) => void;
    onCancelSleepTimer: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
    playlists,
    favorites,
    playlistSource,
    onPlaylistSourceChange,
    onImportPlaylist,
    loadingPlaylist,
    onCreatePlaylist,
    onSelectPlaylist,
    onPlayFavorites,
    onPlayPlaylist,
    quality,
    onQualityChange,
    sleepEndTime,
    onSetSleepTimer,
    onCancelSleepTimer
}) => {
    return (
        <div className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">音乐库</h2>
            </div>

            {/* Settings Section */}
            <div className="bg-surface p-4 md:p-6 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <QualitySettingsSection
                    quality={quality}
                    onQualityChange={onQualityChange}
                />
                <SleepTimerSection
                    sleepEndTime={sleepEndTime}
                    onSetSleepTimer={onSetSleepTimer}
                    onCancelSleepTimer={onCancelSleepTimer}
                />
            </div>

            {/* Import Section */}
            <ImportPlaylistSection
                playlistSource={playlistSource}
                onPlaylistSourceChange={onPlaylistSourceChange}
                onImportPlaylist={onImportPlaylist}
                loadingPlaylist={loadingPlaylist}
            />

            {/* Playlist Grid */}
            <PlaylistGrid
                playlists={playlists}
                favorites={favorites}
                onSelectPlaylist={onSelectPlaylist}
                onPlayFavorites={onPlayFavorites}
                onPlayPlaylist={onPlayPlaylist}
                onCreatePlaylist={onCreatePlaylist}
            />

            {/* Version & Copyright Info */}
            <div className="mt-12 mb-8 text-center">
                <div className="text-white/40 text-xs space-y-1.5 font-medium">
                    <p>
                        感谢 <a
                            href="https://api.tunefree.fun/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors underline decoration-white/20 underline-offset-2"
                        >
                            TuneHub API
                        </a>
                    </p>
                    <p>Version 1.0.8</p>
                </div>
            </div>
        </div>
    );
};
