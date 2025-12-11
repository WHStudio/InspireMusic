/**
 * 缓存管理工具
 * 
 * 缓存策略：
 * - 排行榜列表 (toplists): 缓存 6 小时
 * - 排行榜歌曲 (toplist songs): 缓存 1 小时
 * - 歌词 (lyrics): 缓存 7 天（歌词几乎不变）
 * - 歌曲信息 (song info): 缓存 24 小时
 * - 歌单 (playlist): 缓存 1 小时
 * - 搜索结果: 缓存 10 分钟（可能有新歌）
 */

// 缓存过期时间配置（毫秒）
export const CACHE_TTL = {
  TOPLISTS: 6 * 60 * 60 * 1000,        // 6 小时
  TOPLIST_SONGS: 1 * 60 * 60 * 1000,   // 1 小时
  LYRICS: 7 * 24 * 60 * 60 * 1000,     // 7 天
  SONG_INFO: 24 * 60 * 60 * 1000,      // 24 小时
  PLAYLIST: 1 * 60 * 60 * 1000,        // 1 小时
  SEARCH: 10 * 60 * 1000,              // 10 分钟
} as const;

// 缓存键前缀
const CACHE_PREFIX = 'inspire_cache_';
const CACHE_INDEX_KEY = 'inspire_cache_index';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheIndex {
  keys: string[];
  totalSize: number;
  lastCleanup: number;
}

// 最大缓存大小 (5MB)
const MAX_CACHE_SIZE = 5 * 1024 * 1024;
// 清理阈值
const CLEANUP_THRESHOLD = 4 * 1024 * 1024;

/**
 * 获取缓存索引
 */
const getCacheIndex = (): CacheIndex => {
  try {
    const indexStr = localStorage.getItem(CACHE_INDEX_KEY);
    if (indexStr) {
      return JSON.parse(indexStr);
    }
  } catch (e) {
    console.warn('Failed to read cache index:', e);
  }
  return { keys: [], totalSize: 0, lastCleanup: Date.now() };
};

/**
 * 保存缓存索引
 */
const saveCacheIndex = (index: CacheIndex): void => {
  try {
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.warn('Failed to save cache index:', e);
  }
};

/**
 * 估算字符串大小（字节）
 */
const estimateSize = (str: string): number => {
  return new Blob([str]).size;
};

/**
 * 清理过期缓存
 */
export const cleanupExpiredCache = (): void => {
  const index = getCacheIndex();
  const now = Date.now();
  const validKeys: string[] = [];
  let totalSize = 0;

  for (const key of index.keys) {
    try {
      const item = localStorage.getItem(key);
      if (!item) continue;

      const entry: CacheEntry<unknown> = JSON.parse(item);
      const isExpired = now - entry.timestamp > entry.ttl;

      if (isExpired) {
        localStorage.removeItem(key);
      } else {
        validKeys.push(key);
        totalSize += estimateSize(item);
      }
    } catch (e) {
      // 损坏的缓存项，移除
      localStorage.removeItem(key);
    }
  }

  saveCacheIndex({ keys: validKeys, totalSize, lastCleanup: now });
};

/**
 * 强制清理缓存（当空间不足时）
 * 优先删除最旧的缓存
 */
const forceCleanup = (): void => {
  const index = getCacheIndex();
  const entries: { key: string; timestamp: number; size: number }[] = [];

  // 收集所有缓存条目信息
  for (const key of index.keys) {
    try {
      const item = localStorage.getItem(key);
      if (!item) continue;

      const entry: CacheEntry<unknown> = JSON.parse(item);
      entries.push({
        key,
        timestamp: entry.timestamp,
        size: estimateSize(item),
      });
    } catch (e) {
      localStorage.removeItem(key);
    }
  }

  // 按时间戳排序（最旧的在前）
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // 删除直到低于阈值
  let currentSize = entries.reduce((sum, e) => sum + e.size, 0);
  const remainingKeys: string[] = [];

  for (const entry of entries) {
    if (currentSize > CLEANUP_THRESHOLD) {
      localStorage.removeItem(entry.key);
      currentSize -= entry.size;
    } else {
      remainingKeys.push(entry.key);
    }
  }

  saveCacheIndex({ keys: remainingKeys, totalSize: currentSize, lastCleanup: Date.now() });
};

/**
 * 生成缓存键
 */
export const generateCacheKey = (type: string, ...args: (string | number)[]): string => {
  return `${CACHE_PREFIX}${type}_${args.join('_')}`;
};

/**
 * 从缓存获取数据
 */
export const getFromCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();

    // 检查是否过期
    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key);
      // 更新索引
      const index = getCacheIndex();
      index.keys = index.keys.filter(k => k !== key);
      saveCacheIndex(index);
      return null;
    }

    return entry.data;
  } catch (e) {
    console.warn('Cache read error:', e);
    return null;
  }
};

/**
 * 保存数据到缓存
 */
export const saveToCache = <T>(key: string, data: T, ttl: number): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    const serialized = JSON.stringify(entry);
    const size = estimateSize(serialized);

    // 检查是否需要清理
    const index = getCacheIndex();
    if (index.totalSize + size > MAX_CACHE_SIZE) {
      forceCleanup();
    }

    localStorage.setItem(key, serialized);

    // 更新索引
    const newIndex = getCacheIndex();
    if (!newIndex.keys.includes(key)) {
      newIndex.keys.push(key);
    }
    newIndex.totalSize += size;
    saveCacheIndex(newIndex);
  } catch (e) {
    // localStorage 可能已满，尝试清理后重试
    console.warn('Cache write error, attempting cleanup:', e);
    forceCleanup();
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (retryError) {
      console.warn('Cache write failed after cleanup:', retryError);
    }
  }
};

/**
 * 删除特定缓存
 */
export const removeFromCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
    const index = getCacheIndex();
    index.keys = index.keys.filter(k => k !== key);
    saveCacheIndex(index);
  } catch (e) {
    console.warn('Cache remove error:', e);
  }
};

/**
 * 清除所有缓存
 */
export const clearAllCache = (): void => {
  const index = getCacheIndex();
  for (const key of index.keys) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }
  localStorage.removeItem(CACHE_INDEX_KEY);
};

/**
 * 获取缓存统计信息
 */
export const getCacheStats = (): { count: number; size: number; items: { key: string; size: number; age: number; ttl: number }[] } => {
  const index = getCacheIndex();
  const now = Date.now();
  const items: { key: string; size: number; age: number; ttl: number }[] = [];

  for (const key of index.keys) {
    try {
      const item = localStorage.getItem(key);
      if (!item) continue;

      const entry: CacheEntry<unknown> = JSON.parse(item);
      items.push({
        key: key.replace(CACHE_PREFIX, ''),
        size: estimateSize(item),
        age: Math.round((now - entry.timestamp) / 1000 / 60), // 分钟
        ttl: Math.round(entry.ttl / 1000 / 60), // 分钟
      });
    } catch (e) {
      // Ignore
    }
  }

  return {
    count: items.length,
    size: items.reduce((sum, item) => sum + item.size, 0),
    items,
  };
};

// 应用启动时清理过期缓存
if (typeof window !== 'undefined') {
  // 延迟执行，避免阻塞页面加载
  setTimeout(() => {
    cleanupExpiredCache();
  }, 5000);
}
