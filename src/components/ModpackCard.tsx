import { Heart, GitCompare, Star, Download, Package, Gauge, Cpu, ExternalLink, Globe } from 'lucide-react'
import type { Modpack } from '../types/modpack'
import { formatDownloads, genreLabel, PERFORMANCE_COLORS, DIFFICULTY_COLORS, LOADER_COLORS, PLATFORM_COLORS, getPlatform } from '../types/modpack'
import { isFavorite, toggleFavorite, toggleCompare, getCompareList } from '../lib/storage'
import { memo, useState, useCallback } from 'react'

interface Props {
  modpack: Modpack
  onClick: () => void
  onFavoritesChange: () => void
  onCompareChange: () => void
  index: number
}

function ModpackCardInner({ modpack, onClick, onFavoritesChange, onCompareChange, index }: Props) {
  const [fav, setFav] = useState(isFavorite(modpack.id))
  const [compareList, setCompareList] = useState<string[]>(getCompareList())
  const inCompare = compareList.includes(modpack.id)

  const handleFav = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setFav(prev => !prev)
    toggleFavorite(modpack.id)
    onFavoritesChange()
  }, [modpack.id, onFavoritesChange])

  const handleCompare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = toggleCompare(modpack.id)
    setCompareList(updated)
    onCompareChange()
  }, [modpack.id, onCompareChange])

  const staggerClass = `stagger-${Math.min(index + 1, 10)}`

  return (
    <div
      onClick={onClick}
      className={`group bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden cursor-pointer card-hover animate-slide-up ${staggerClass}`}
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s`, contentVisibility: 'auto', containIntrinsicSize: 'auto 320px' }}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {modpack.image_url ? (
          <img
            src={modpack.image_url}
            alt={modpack.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-900 to-stone-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={`badge border bg-black/60 ${PLATFORM_COLORS[getPlatform(modpack)] || ''}`}>
            {getPlatform(modpack) === 'curated' && <Star className="w-3 h-3" />}
            {getPlatform(modpack) === 'modrinth' && <Globe className="w-3 h-3" />}
            {getPlatform(modpack) === 'curseforge' && <Cpu className="w-3 h-3" />}
            {getPlatform(modpack) === 'curated' ? 'Curated' : getPlatform(modpack) === 'modrinth' ? 'Modrinth' : 'CurseForge'}
          </span>
          <span className={`badge border bg-black/60 ${LOADER_COLORS[modpack.loader] || ''}`}>
            {modpack.loader}
          </span>
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            onClick={handleCompare}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              inCompare ? 'bg-green-600 text-white' : 'bg-black/60 text-stone-300 hover:bg-black/80'
            }`}
            title={inCompare ? 'Remove from compare' : 'Add to compare'}
          >
            <GitCompare className="w-4 h-4" />
          </button>
          <button
            onClick={handleFav}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              fav ? 'bg-red-600 text-white' : 'bg-black/60 text-stone-300 hover:bg-black/80'
            }`}
            title={fav ? 'Remove favorite' : 'Add favorite'}
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Name on image */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-bold text-lg leading-tight">{modpack.name}</h3>
          <p className="text-stone-300 text-xs">by {modpack.author}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <p className="text-stone-400 text-sm line-clamp-2 leading-relaxed">{modpack.description}</p>

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            {modpack.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5 text-blue-400" />
            {formatDownloads(modpack.downloads)}
          </span>
          {modpack.mod_count > 0 && (
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-green-400" />
              {modpack.mod_count}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`badge border text-[10px] ${PERFORMANCE_COLORS[modpack.performance_impact] || ''}`}>
            <Gauge className="w-2.5 h-2.5" /> {modpack.performance_impact}
          </span>
          <span className={`badge border text-[10px] ${DIFFICULTY_COLORS[modpack.difficulty] || ''}`}>
            {modpack.difficulty}
          </span>
          <span className="badge bg-stone-800 text-stone-400 border border-stone-700 text-[10px] font-mono">
            {modpack.minecraft_versions[0]}
            {modpack.minecraft_versions.length > 1 && ` +${modpack.minecraft_versions.length - 1}`}
          </span>
        </div>

        {/* Genres + External link */}
        <div className="flex flex-wrap gap-1 items-center">
          {modpack.genres.slice(0, 3).map(g => (
            <span key={g} className="text-[10px] text-green-400/80 bg-green-900/20 px-2 py-0.5 rounded-full">
              {genreLabel(g)}
            </span>
          ))}
          {modpack.external_url && (
            <a
              href={modpack.external_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="ml-auto text-[10px] text-stone-500 hover:text-green-400 flex items-center gap-0.5 transition-colors"
            >
              View on {getPlatform(modpack) === 'modrinth' ? 'Modrinth' : 'CurseForge'} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export const ModpackCard = memo(ModpackCardInner)
