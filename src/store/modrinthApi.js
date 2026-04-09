/**
 * Modrinth API v2 客户端
 * https://docs.modrinth.com/api/
 */

const MODRINTH_API = 'https://api.modrinth.com/v2';
const USER_AGENT = 'MCStudio-macOS/1.0.0 (github.com/mcstudio)';

// 简易缓存
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`${MODRINTH_API}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const cacheKey = url.toString();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Modrinth API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  setCache(cacheKey, data);
  return data;
}

/**
 * 搜索模组
 * @param {string} query - 搜索关键词
 * @param {object} options - 搜索选项
 */
export async function searchMods(query, options = {}) {
  const {
    limit = 20,
    offset = 0,
    index = 'relevance', // relevance, downloads, follows, newest, updated
    facets = null,
    projectType = 'mod',
  } = options;

  // 构建 facets 过滤器
  let facetStr = null;
  if (facets) {
    facetStr = JSON.stringify(facets);
  } else {
    // 默认过滤：支持 Bedrock 的模组
    facetStr = JSON.stringify([
      [`project_type:${projectType}`],
    ]);
  }

  const result = await fetchAPI('/search', {
    query,
    limit,
    offset,
    index,
    facets: facetStr,
  });

  return {
    hits: result.hits || [],
    total: result.total_hits || 0,
    limit: result.limit,
    offset: result.offset,
  };
}

/**
 * 获取项目详情
 */
export async function getProject(idOrSlug) {
  return fetchAPI(`/project/${idOrSlug}`);
}

/**
 * 获取项目的所有版本
 */
export async function getVersions(idOrSlug, options = {}) {
  const { loaders, gameVersions } = options;
  const params = {};
  if (loaders) params.loaders = JSON.stringify(loaders);
  if (gameVersions) params.game_versions = JSON.stringify(gameVersions);
  return fetchAPI(`/project/${idOrSlug}/version`, params);
}

/**
 * 获取单个版本详情
 */
export async function getVersion(versionId) {
  return fetchAPI(`/version/${versionId}`);
}

/**
 * 获取项目成员
 */
export async function getProjectMembers(idOrSlug) {
  return fetchAPI(`/project/${idOrSlug}/members`);
}

/**
 * 获取多个项目
 */
export async function getProjects(ids) {
  return fetchAPI('/projects', { ids: JSON.stringify(ids) });
}

/**
 * 获取分类列表
 */
export async function getCategories() {
  return fetchAPI('/tag/category');
}

/**
 * 获取加载器列表
 */
export async function getLoaders() {
  return fetchAPI('/tag/loader');
}

/**
 * 获取 MC 版本列表
 */
export async function getGameVersions() {
  return fetchAPI('/tag/game_version');
}

/**
 * 下载文件到本地（通过 Electron IPC）
 */
export async function downloadModFile(fileUrl, destPath) {
  if (window.electronAPI) {
    return window.electronAPI.mod.download(fileUrl, destPath);
  }
  throw new Error('需要在 Electron 环境下运行');
}

/**
 * 安装模组到 Wine MC 数据目录
 */
export async function installModToMC(filePath) {
  if (window.electronAPI) {
    return window.electronAPI.mod.install(filePath);
  }
  throw new Error('需要在 Electron 环境下运行');
}

/**
 * 格式化下载数
 */
export function formatDownloads(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * 格式化日期
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 30) return `${diffDays} 天前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}
