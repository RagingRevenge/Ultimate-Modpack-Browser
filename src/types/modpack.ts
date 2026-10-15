export type Platform = 'curated' | 'modrinth' | 'curseforge'

export interface Modpack {
  id: string
  name: string
  slug: string
  description: string
  long_description: string
  author: string
  loader: string
  minecraft_versions: string[]
  genres: string[]
  tags: string[]
  performance_impact: string
  difficulty: string
  mod_count: number
  downloads: number
  rating: number
  image_url: string | null
  download_url: string | null
  wiki_url: string | null
  featured: boolean
  created_at: string
  updated_at: string
  platform?: Platform
  external_url?: string | null
}

export type SortOption = 'downloads' | 'rating' | 'name' | 'mod_count' | 'newest'
export type PlatformFilter = 'all' | 'curated' | 'modrinth' | 'curseforge'

export interface FilterState {
  search: string
  versions: string[]
  genres: string[]
  loaders: string[]
  performanceImpacts: string[]
  difficulties: string[]
  favoritesOnly: boolean
  platform: PlatformFilter
  sortBy: SortOption
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  versions: [],
  genres: [],
  loaders: [],
  performanceImpacts: [],
  difficulties: [],
  favoritesOnly: false,
  platform: 'all',
  sortBy: 'downloads',
}

export const PERFORMANCE_IMPACTS = ['Light', 'Medium', 'Heavy', 'Very Heavy'] as const
export const DIFFICULTIES = ['Easy', 'Normal', 'Hard', 'Expert'] as const
export const LOADERS = ['Forge', 'Fabric', 'Quilt', 'NeoForge'] as const
export const GENRES = [
  'kitchen-sink',
  'tech',
  'magic',
  'adventure',
  'rpg',
  'vanilla-plus',
  'skyblock',
  'hardcore',
  'quests',
  'optimization',
  'lightweight',
  'multiplayer',
  'combat',
  'exploration',
  'challenging',
  'sci-fi',
  'horror',
  'mini-game',
  'map-based',
  'expert',
] as const

export const GENRE_LABELS: Record<string, string> = {
  'kitchen-sink': 'Kitchen Sink',
  'tech': 'Technology',
  'magic': 'Magic',
  'adventure': 'Adventure',
  'rpg': 'Adventure & RPG',
  'vanilla-plus': 'Vanilla+',
  'skyblock': 'Skyblock',
  'hardcore': 'Hardcore',
  'quests': 'Quests',
  'optimization': 'Optimization',
  'lightweight': 'Lightweight',
  'multiplayer': 'Multiplayer',
  'combat': 'Combat / PvP',
  'exploration': 'Exploration',
  'challenging': 'Challenging',
  'sci-fi': 'Sci-Fi',
  'horror': 'Horror',
  'mini-game': 'Mini Game',
  'map-based': 'Map Based',
  'expert': 'Expert',
}

export const PERFORMANCE_COLORS: Record<string, string> = {
  'Light': 'bg-green-900/40 text-green-300 border-green-700/50',
  'Medium': 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  'Heavy': 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  'Very Heavy': 'bg-red-900/40 text-red-300 border-red-700/50',
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  'Easy': 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  'Normal': 'bg-green-900/40 text-green-300 border-green-700/50',
  'Hard': 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  'Expert': 'bg-red-900/40 text-red-300 border-red-700/50',
}

export const LOADER_COLORS: Record<string, string> = {
  'Forge': 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  'Fabric': 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
  'Quilt': 'bg-purple-900/40 text-purple-300 border-purple-700/50',
  'NeoForge': 'bg-rose-900/40 text-rose-300 border-rose-700/50',
}

export function formatDownloads(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
  return count.toString()
}

export function genreLabel(genre: string): string {
  return GENRE_LABELS[genre] || genre.charAt(0).toUpperCase() + genre.slice(1)
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  'curated': 'Curated',
  'modrinth': 'Modrinth',
  'curseforge': 'CurseForge',
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  'curated': 'bg-green-900/40 text-green-300 border-green-700/50',
  'modrinth': 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  'curseforge': 'bg-orange-900/40 text-orange-300 border-orange-700/50',
}

export function getPlatform(mp: Modpack): Platform {
  return mp.platform || 'curated'
}
