import React from 'react';
import { Heart, ListMusic, Plus, Play } from 'lucide-react';
import type { Song, LocalPlaylist } from '../../types';
import { getGradientFromId } from '../../utils/colors';

interface PlaylistGridProps {
    playlists: LocalPlaylist[];
    favorites: Song[];
    onSelectPlaylist: (playlist: LocalPlaylist) => void;
    onPlayFavorites: () => void;
    onPlayPlaylist: (playlist: LocalPlaylist) => void;
    onCreatePlaylist: () => void;
}

export const PlaylistGrid: React.FC<PlaylistGridProps> = ({
    playlists,
    favorites,
    onSelectPlaylist,
    onPlayFavorites,
    onPlayPlaylist,
    onCreatePlaylist,
}) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Favorites Card */}
            <div
                onClick={() => {
                    const favPlaylist: LocalPlaylist = {
                        id: 'favorites',
                        name: '我喜欢的音乐',
                        songs: favorites,
                        source: 'netease'
                    };
                    onSelectPlaylist(favPlaylist);
                }}
                className="group bg-surface hover:bg-surface/80 rounded-lg p-4 cursor-pointer transition-colors"
            >
                <div className="aspect-square rounded-md mb-4 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg">
                    <Heart size={48} fill="white" className="text-white" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayFavorites();
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                            <Play fill="black" className="text-black ml-1" />
                        </div>
                    </button>
                </div>
                <h3 className="text-white font-bold truncate">我喜欢的音乐</h3>
                <p className="text-gray-400 text-sm">{favorites.length} 首歌曲</p>
            </div>

            {/* User Playlists */}
            {playlists.map((pl) => (
                <div
                    key={pl.id}
                    onClick={() => onSelectPlaylist(pl)}
                    className="group bg-surface hover:bg-surface/80 rounded-lg p-4 cursor-pointer transition-colors"
                >
                    <div className={`aspect-square rounded-md mb-4 flex items-center justify-center relative overflow-hidden ${getGradientFromId(pl.id)}`}>
                        <ListMusic size={48} className="text-white/50" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlayPlaylist(pl);
                            }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <Play fill="black" className="text-black ml-1" />
                            </div>
                        </button>
                    </div>
                    <h3 className="text-white font-bold truncate">{pl.name}</h3>
                    <p className="text-gray-400 text-sm">{pl.songs.length} 首歌曲</p>
                </div>
            ))}

            {/* New Playlist Card */}
            <div
                onClick={onCreatePlaylist}
                className="border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg p-4 cursor-pointer transition-colors flex flex-col items-center justify-center gap-4 min-h-[200px]"
            >
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    <Plus size={32} />
                </div>
                <span className="text-gray-400 font-medium">新建歌单</span>
            </div>
        </div>
    );
};
