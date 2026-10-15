import type { Modpack, FilterState } from '../types/modpack'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-modpacks`
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const PAGE_SIZE = 50

interface SearchResponse {
  results: Modpack[]
  total: number
  totals?: {
    modrinth: number
    curseforge: number
  }
}

export interface ExternalSearchResult {
  modpacks: Modpack[]
  hasMore: boolean
  totals: {
    modrinth: number
    curseforge: number
  }
}

export function searchExternalModpacks(filters: FilterState, page: number = 0): Promise<ExternalSearchResult> {
  return searchExternalModpacksRaw(filters, page * PAGE_SIZE)
}

async function searchExternalModpacksRaw(filters: FilterState, offset: number): Promise<ExternalSearchResult> {
  const params = new URLSearchParams()

  if (filters.search) params.set('query', filters.search)
  if (filters.versions.length > 0) filters.versions.forEach(v => params.append('versions', v))
  if (filters.genres.length > 0) filters.genres.forEach(g => params.append('genres', g))
  if (filters.loaders.length > 0) filters.loaders.forEach(l => params.append('loaders', l))
  if (filters.platform === 'modrinth' || filters.platform === 'curseforge') {
    params.set('platform', filters.platform)
  }
  params.set('limit', String(PAGE_SIZE))
  params.set('offset', String(offset))

  const emptyTotals = { modrinth: 0, curseforge: 0 }

  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Edge function error:', response.status)
      return { modpacks: [], hasMore: false, totals: emptyTotals }
    }

    const data: SearchResponse = await response.json()
    if (!data.results || !Array.isArray(data.results)) {
      return { modpacks: [], hasMore: false, totals: emptyTotals }
    }

    const modpacks = data.results.map(mp => ({
      ...mp,
      created_at: mp.created_at || new Date().toISOString(),
      updated_at: mp.updated_at || new Date().toISOString(),
    }))

    const hasMore = modpacks.length >= PAGE_SIZE

    return { modpacks, hasMore, totals: data.totals || emptyTotals }
  } catch (err) {
    console.error('Failed to fetch external modpacks:', err)
    return { modpacks: [], hasMore: false, totals: emptyTotals }
  }
}
