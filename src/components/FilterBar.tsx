import { useState, useRef, useEffect } from 'react'
import { Search, X, Heart, ChevronDown, Globe, Check } from 'lucide-react'
import type { FilterState, SortOption, PlatformFilter } from '../types/modpack'
import { GENRES, GENRE_LABELS, LOADERS, PERFORMANCE_IMPACTS, DIFFICULTIES, PLATFORM_LABELS } from '../types/modpack'

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableVersions: string[]
  activeFilterCount: number
  favoritesCount: number
}

export function FilterBar({ filters, onChange, availableVersions, activeFilterCount, favoritesCount }: Props) {
  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial })

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      update({ search: value })
    }, 250)
  }

  const toggleArray = (key: keyof FilterState, value: string) => {
    const arr = filters[key] as string[]
    const updated = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    update({ [key]: updated } as Partial<FilterState>)
  }

  const clearAll = () => {
    onChange({
      search: '',
      versions: [],
      genres: [],
      loaders: [],
      performanceImpacts: [],
      difficulties: [],
      favoritesOnly: false,
      platform: 'all',
      sortBy: 'downloads',
    })
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 space-y-4 relative z-30">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
          <input
            type="text"
            placeholder="Search modpacks by name, description, or tag..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-11 pr-4 py-2.5 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/50 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={e => update({ sortBy: e.target.value as SortOption })}
              className="appearance-none bg-stone-800 border border-stone-700 rounded-lg pl-4 pr-10 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-green-600 transition-colors cursor-pointer"
            >
              <option value="downloads">Most Downloads</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name (A-Z)</option>
              <option value="mod_count">Most Mods</option>
              <option value="newest">Newest</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick toggle chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 mr-2">
          <Globe className="w-4 h-4 text-stone-500" />
          {(Object.keys(PLATFORM_LABELS) as PlatformFilter[]).concat('all').map(p => (
            <button
              key={p}
              onClick={() => update({ platform: p as PlatformFilter })}
              className={`filter-chip ${filters.platform === p ? 'filter-chip-active' : 'filter-chip-inactive'}`}
            >
              {p === 'all' ? 'All Sources' : PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS]}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-stone-700" />

        <button
          onClick={() => update({ favoritesOnly: !filters.favoritesOnly })}
          className={`filter-chip ${filters.favoritesOnly ? 'filter-chip-active' : 'filter-chip-inactive'}`}
        >
          <Heart className="w-3.5 h-3.5 inline mr-1" /> Favorites{favoritesCount > 0 && ` (${favoritesCount})`}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="filter-chip filter-chip-inactive flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Dropdown filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-800">
        <MultiSelectDropdown
          label="Minecraft Version"
          options={availableVersions}
          selected={filters.versions}
          onToggle={(v) => toggleArray('versions', v)}
          onClear={() => update({ versions: [] })}
          mono
        />
        <MultiSelectDropdown
          label="Genre"
          options={GENRES as unknown as string[]}
          labels={GENRE_LABELS}
          selected={filters.genres}
          onToggle={(g) => toggleArray('genres', g)}
          onClear={() => update({ genres: [] })}
        />
        <MultiSelectDropdown
          label="Mod Loader"
          options={LOADERS as unknown as string[]}
          selected={filters.loaders}
          onToggle={(l) => toggleArray('loaders', l)}
          onClear={() => update({ loaders: [] })}
        />
        <MultiSelectDropdown
          label="Performance & Difficulty"
          options={[...PERFORMANCE_IMPACTS, ...DIFFICULTIES] as unknown as string[]}
          selected={[...filters.performanceImpacts, ...filters.difficulties]}
          onToggle={(val) => {
            if ((PERFORMANCE_IMPACTS as readonly string[]).includes(val)) {
              toggleArray('performanceImpacts', val)
            } else {
              toggleArray('difficulties', val)
            }
          }}
          onClear={() => update({ performanceImpacts: [], difficulties: [] })}
        />
      </div>
    </div>
  )
}

interface MultiSelectDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  onClear: () => void
  labels?: Record<string, string>
  mono?: boolean
}

function MultiSelectDropdown({ label, options, selected, onToggle, onClear, labels, mono }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const displayValue = selected.length === 0
    ? label
    : selected.length === 1
      ? (labels?.[selected[0]] || selected[0])
      : `${selected.length} selected`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 bg-stone-800 border rounded-lg px-3 py-2.5 text-sm transition-colors ${
          open ? 'border-green-600' : selected.length > 0 ? 'border-green-700/50 text-green-300' : 'border-stone-700 text-stone-300'
        }`}
      >
        <span className={`truncate ${selected.length === 0 ? 'text-stone-500' : ''} ${mono ? 'font-mono' : ''}`}>
          {displayValue}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected.length > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="text-stone-500 hover:text-red-400 transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClear() } }}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <>
        <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
        <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-stone-900 border border-stone-700 rounded-lg shadow-xl shadow-black/50 max-h-64 overflow-y-auto py-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-stone-500">No options available</div>
          ) : (
            options.map(opt => {
              const isSelected = selected.includes(opt)
              const displayLabel = labels?.[opt] || opt
              const isPerformance = (PERFORMANCE_IMPACTS as readonly string[]).includes(opt)
              const isDifficulty = (DIFFICULTIES as readonly string[]).includes(opt)

              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors text-left ${
                    isSelected ? 'bg-green-900/30 text-green-300' : 'text-stone-300 hover:bg-stone-800'
                  } ${mono ? 'font-mono' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    {isPerformance && <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />}
                    {isDifficulty && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    {displayLabel}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                </button>
              )
            })
          )}
        </div>
        </>
      )}
    </div>
  )
}
