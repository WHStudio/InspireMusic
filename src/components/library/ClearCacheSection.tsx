import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { getClearableDataStats, clearUserData } from '../../utils/cache';

interface ClearCacheSectionProps {
    onCacheCleared?: () => void;
}

export const ClearCacheSection: React.FC<ClearCacheSectionProps> = ({ onCacheCleared }) => {
    const [stats, setStats] = useState({ count: 0, size: 0 });
    const [showConfirm, setShowConfirm] = useState(false);
    const [clearing, setClearing] = useState(false);

    const refreshStats = () => {
        setStats(getClearableDataStats());
    };

    useEffect(() => {
        refreshStats();
    }, []);

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    const handleClear = () => {
        setClearing(true);
        // 使用 setTimeout 让 UI 有机会更新
        setTimeout(() => {
            clearUserData();
            onCacheCleared?.();
            // 清理完成后刷新页面，确保 React 状态与 localStorage 同步
            window.location.reload();
        }, 100);
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trash2 size={20} />
                清理缓存
            </h3>

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">
                        {stats.count > 0 ? (
                            <>可清理 <span className="text-white font-medium">{stats.count}</span> 项，约 <span className="text-white font-medium">{formatSize(stats.size)}</span></>
                        ) : (
                            '暂无可清理数据'
                        )}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                        保留音质设置、歌单和收藏
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshStats}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        title="刷新统计"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={stats.count === 0 || clearing}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        {clearing ? '清理中...' : '清理'}
                    </button>
                </div>
            </div>

            {/* 确认对话框 */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1">确认清理缓存？</h4>
                                <p className="text-sm text-white/60">
                                    将清除播放队列、播放进度、搜索历史和 API 缓存。
                                </p>
                                <p className="text-sm text-white/60 mt-2">
                                    <span className="text-green-400">✓</span> 音质设置、歌单和收藏会保留
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleClear}
                                disabled={clearing}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors text-sm font-medium"
                            >
                                {clearing ? '清理中...' : '确认清理'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
