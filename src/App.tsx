import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Boxes, Search, Loader2, AlertCircle, Heart, GitCompare, Sparkles, Globe, ChevronDown } from 'lucide-react'
import { supabase } from './lib/supabase'
import type { Modpack, FilterState } from './types/modpack'
import { DEFAULT_FILTERS, getPlatform } from './types/modpack'
import { searchExternalModpacks } from './lib/api'
import { ModpackCard } from './components/ModpackCard'
import { ModpackDetail } from './components/ModpackDetail'
import { FilterBar } from './components/FilterBar'
import { StatsBar } from './components/StatsBar'
import { CompareBar } from './components/CompareBar'
import { CompareModal } from './components/CompareModal'
import { getFavorites, getCompareList, toggleCompare, clearCompare, addRecent, getRecents } from './lib/storage'

const MAX_VISIBLE = 60

function getCompareIds(): string[] {
  try {
    const raw = localStorage.getItem('modforge_compare')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const [curatedModpacks, setCuratedModpacks] = useState<Modpack[]>([])
  const [externalModpacks, setExternalModpacks] = useState<Modpack[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExternal, setLoadingExternal] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreExternal, setHasMoreExternal] = useState(false)
  const [externalPage, setExternalPage] = useState(0)
  const [externalTotals, setExternalTotals] = useState({ modrinth: 0, curseforge: 0 })
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<Modpack | null>(null)
  const [favorites, setFavorites] = useState<string[]>(getFavorites())
  const [compareIds, setCompareIds] = useState<string[]>(getCompareIds())
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>(getRecents())
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchCuratedModpacks()
  }, [])

  async function fetchCuratedModpacks() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('modpacks')
      .select('*')
      .order('downloads', { ascending: false })

    if (err) {
      setError('Failed to load modpacks. Please try again.')
      console.error(err)
    } else if (data) {
      const tagged = (data as Modpack[]).map(mp => ({ ...mp, platform: 'curated' as const }))
      setCuratedModpacks(tagged)
    }
    setLoading(false)
  }

  const allModpacks = useMemo(() => {
    return [...curatedModpacks, ...externalModpacks]
  }, [curatedModpacks, externalModpacks])

  // Fetch external modpacks (first page) when filters change
  useEffect(() => {
    if (loading) return
    if (filters.platform === 'curated') {
      setExternalModpacks([])
      setHasMoreExternal(false)
      setExternalTotals({ modrinth: 0, curseforge: 0 })
      return
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    setLoadingExternal(true)
    setExternalPage(0)
    debounceTimer.current = setTimeout(async () => {
      const result = await searchExternalModpacks(filters, 0)
      setExternalModpacks(result.modpacks)
      setHasMoreExternal(result.hasMore)
      setExternalTotals(result.totals)
      setLoadingExternal(false)
    }, 400)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [filters.search, filters.versions, filters.genres, filters.loaders, filters.platform, loading])

  // Load more external modpacks (next page)
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreExternal) return
    setLoadingMore(true)
    const nextPage = externalPage + 1
    const result = await searchExternalModpacks(filters, nextPage)
    // Deduplicate by id — some results may overlap
    setExternalModpacks(prev => {
      const existing = new Set(prev.map(mp => mp.id))
      const fresh = result.modpacks.filter(mp => !existing.has(mp.id))
      return [...prev, ...fresh]
    })
    setExternalPage(nextPage)
    setHasMoreExternal(result.hasMore)
    setLoadingMore(false)
  }, [loadingMore, hasMoreExternal, externalPage, filters])

  const availableVersions = useMemo(() => {
    const versions = new Set<string>()
    curatedModpacks.forEach(mp => mp.minecraft_versions.forEach(v => versions.add(v)))
    externalModpacks.forEach(mp => mp.minecraft_versions.forEach(v => versions.add(v)))
    return Array.from(versions).sort((a, b) => b.localeCompare(a))
  }, [curatedModpacks, externalModpacks])

  const debouncedSearch = useMemo(() => {
    if (filters.platform === 'curated') return filters.search
    return filters.search
  }, [filters.search, filters.platform])

  const filtered = useMemo(() => {
    let result: Modpack[] = []

    if (filters.platform === 'curated') {
      result = [...curatedModpacks]
    } else if (filters.platform === 'modrinth') {
      result = externalModpacks.filter(mp => getPlatform(mp) === 'modrinth')
    } else if (filters.platform === 'curseforge') {
      result = externalModpacks.filter(mp => getPlatform(mp) === 'curseforge')
    } else {
      result = allModpacks
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(mp =>
        mp.name.toLowerCase().includes(q) ||
        mp.description.toLowerCase().includes(q) ||
        mp.author.toLowerCase().includes(q) ||
        mp.tags.some(t => t.toLowerCase().includes(q)) ||
        mp.genres.some(g => g.toLowerCase().includes(q))
      )
    }

    if (filters.versions.length > 0) {
      result = result.filter(mp =>
        mp.minecraft_versions.some(v => filters.versions.includes(v))
      )
    }

    // Only apply client-side genre filter to curated modpacks.
    // External results are already filtered by genre server-side by the edge function,
    // and their genre names may not perfectly match our internal list after normalization.
    if (filters.genres.length > 0) {
      result = result.filter(mp =>
        getPlatform(mp) === 'curated'
          ? mp.genres.some(g => filters.genres.includes(g))
          : true
      )
    }

    if (filters.loaders.length > 0) {
      result = result.filter(mp => filters.loaders.includes(mp.loader))
    }

    if (filters.performanceImpacts.length > 0) {
      result = result.filter(mp => filters.performanceImpacts.includes(mp.performance_impact))
    }

    if (filters.difficulties.length > 0) {
      result = result.filter(mp => filters.difficulties.includes(mp.difficulty))
    }

    if (filters.favoritesOnly) {
      result = result.filter(mp => favorites.includes(mp.id))
    }

    const seen = new Set<string>()
    result = result.filter(mp => {
      if (seen.has(mp.id)) return false
      seen.add(mp.id)
      return true
    })

    switch (filters.sortBy) {
      case 'downloads': result.sort((a, b) => b.downloads - a.downloads); break
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'mod_count': result.sort((a, b) => b.mod_count - a.mod_count); break
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
    }

    return result
  }, [allModpacks, curatedModpacks, externalModpacks, filters, favorites, debouncedSearch])

  const visibleModpacks = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(MAX_VISIBLE)
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    count += filters.versions.length
    count += filters.genres.length
    count += filters.loaders.length
    count += filters.performanceImpacts.length
    count += filters.difficulties.length
    if (filters.favoritesOnly) count++
    if (filters.search) count++
    if (filters.platform !== 'all') count++
    return count
  }, [filters])

  const compareModpacks = useMemo(() => {
    return compareIds.map(id => allModpacks.find(mp => mp.id === id)).filter(Boolean) as Modpack[]
  }, [compareIds, allModpacks])

  const recentModpacks = useMemo(() => {
    return recentIds.map(id => allModpacks.find(mp => mp.id === id)).filter(Boolean) as Modpack[]
  }, [recentIds, allModpacks])

  const handleFavoritesChange = useCallback(() => {
    setFavorites(getFavorites())
  }, [])

  const handleCompareChange = useCallback(() => {
    setCompareIds(getCompareIds())
  }, [])

  const handleSelect = useCallback((mp: Modpack) => {
    setSelected(mp)
    addRecent(mp.id)
    setRecentIds(getRecents())
  }, [])

  const handleRemoveCompare = useCallback((id: string) => {
    toggleCompare(id)
    setCompareIds(getCompareIds())
  }, [])

  const handleClearCompare = useCallback(() => {
    clearCompare()
    setCompareIds([])
  }, [])

  const curatedCount = curatedModpacks.length
  const modrinthCount = useMemo(() => externalModpacks.filter(mp => getPlatform(mp) === 'modrinth').length, [externalModpacks])
  const curseforgeCount = useMemo(() => externalModpacks.filter(mp => getPlatform(mp) === 'curseforge').length, [externalModpacks])

  // Whether to show the Load More button (only when viewing external sources)
  const showLoadMore = filters.platform !== 'curated' && hasMoreExternal && !loadingExternal

  return (
    <div className="min-h-screen grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-900/30">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Ultimate Modpack Browser</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
              className={`btn-ghost flex items-center gap-1.5 ${filters.favoritesOnly ? 'text-red-400' : ''}`}
              title="Show favorites only"
            >
              <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{favorites.length}</span>
            </button>
            <button
              onClick={() => setCompareModalOpen(true)}
              className={`btn-ghost flex items-center gap-1.5 ${compareIds.length > 0 ? 'text-green-400' : ''}`}
              disabled={compareIds.length === 0}
              title="Open compare"
            >
              <GitCompare className="w-4 h-4" />
              <span className="hidden sm:inline">{compareIds.length}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Hero */}
        <div className="text-center py-6 sm:py-10">
          <h2 className="text-3xl sm:text-5xl font-bold mb-3">
            Find Your Perfect <span className="gradient-text">Modpack</span>
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Browse curated modpacks plus live results from Modrinth and CurseForge.
            Filter by version, genre, performance, and more to discover the pack that matches your playstyle.
          </p>
          {curatedCount > 0 && (
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-stone-500">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {curatedCount} Curated</span>
              {modrinthCount > 0 && <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-emerald-400" /> {modrinthCount} Modrinth</span>}
              {curseforgeCount > 0 && <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-orange-400" /> {curseforgeCount} CurseForge</span>}
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && !error && (
          <StatsBar modpacks={curatedModpacks} externalTotals={externalTotals} onSelect={handleSelect} />
        )}

        {/* Filters */}
        {!loading && !error && (
          <FilterBar
            filters={filters}
            onChange={setFilters}
            availableVersions={availableVersions}
            activeFilterCount={activeFilterCount}
            favoritesCount={favorites.length}
          />
        )}

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-3" />
            <p className="text-stone-400">Loading modpacks...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={fetchCuratedModpacks} className="btn-primary text-sm">Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-stone-500">
                Showing <span className="text-stone-300 font-medium">{filtered.length}</span> modpacks
                {loadingExternal && <span className="text-green-400 ml-2">· searching external sources...</span>}
              </p>
              {loadingExternal && <Loader2 className="w-4 h-4 text-green-500 animate-spin" />}
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleModpacks.map((mp, i) => (
                    <ModpackCard
                      key={mp.id}
                      modpack={mp}
                      onClick={() => handleSelect(mp)}
                      onFavoritesChange={handleFavoritesChange}
                      onCompareChange={handleCompareChange}
                      index={i}
                    />
                  ))}
                </div>

                {/* Show more button */}
                {visibleCount < filtered.length && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setVisibleCount(c => c + MAX_VISIBLE)}
                      className="btn-ghost flex items-center gap-2 px-6 py-3 text-sm border border-stone-700"
                    >
                      Show {Math.min(MAX_VISIBLE, filtered.length - visibleCount)} more
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Load More button */}
                {showLoadMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="btn-primary flex items-center gap-2 px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading more...
                        </>
                      ) : (
                        <>
                          Load More Modpacks
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : !loadingExternal ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="w-12 h-12 text-stone-700 mb-4" />
                <h3 className="text-lg font-medium text-stone-300 mb-2">No modpacks found</h3>
                <p className="text-stone-500 text-sm mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="btn-primary text-sm"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-3" />
                <p className="text-stone-400">Searching Modrinth and CurseForge...</p>
              </div>
            )}

            {/* Recently viewed */}
            {recentModpacks.length > 0 && !selected && (
              <div className="pt-4">
                <h3 className="flex items-center gap-2 text-sm font-medium text-stone-400 mb-3">
                  <Sparkles className="w-4 h-4 text-green-400" /> Recently Viewed
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {recentModpacks.map(mp => (
                    <button
                      key={mp.id}
                      onClick={() => handleSelect(mp)}
                      className="flex items-center gap-3 bg-stone-800/50 hover:bg-stone-800 rounded-xl p-2.5 pr-4 transition-colors shrink-0 group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-700 shrink-0">
                        {mp.image_url && <img src={mp.image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-stone-200 group-hover:text-green-400 transition-colors whitespace-nowrap">{mp.name}</p>
                        <p className="text-xs text-stone-500">{mp.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modpack detail modal */}
      {selected && (
        <ModpackDetail
          modpack={selected}
          onClose={() => setSelected(null)}
          onFavoritesChange={handleFavoritesChange}
          onCompareChange={handleCompareChange}
        />
      )}

      {/* Compare bar */}
      <CompareBar
        modpacks={compareModpacks}
        onOpen={() => setCompareModalOpen(true)}
        onRemove={handleRemoveCompare}
        onClear={handleClearCompare}
      />

      {/* Compare modal */}
      {compareModalOpen && compareModpacks.length > 0 && (
        <CompareModal
          modpacks={compareModpacks}
          onClose={() => setCompareModalOpen(false)}
          onSelect={(mp) => { setCompareModalOpen(false); handleSelect(mp) }}
          onClear={handleClearCompare}
        />
      )}
    </div>
  )
}
