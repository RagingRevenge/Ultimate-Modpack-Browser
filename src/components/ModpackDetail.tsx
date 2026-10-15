import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Heart, GitCompare, Download, BookOpen, Users, Package, Star, Cpu, Gauge, Swords, Tag, Calendar, ExternalLink, Globe } from 'lucide-react'
import type { Modpack } from '../types/modpack'
import { formatDownloads, genreLabel, PERFORMANCE_COLORS, DIFFICULTY_COLORS, LOADER_COLORS, PLATFORM_COLORS, PLATFORM_LABELS, getPlatform } from '../types/modpack'
import { isFavorite, toggleFavorite, toggleCompare, getCompareList, addRecent } from '../lib/storage'
import { useState } from 'react'

interface Props {
  modpack: Modpack
  onClose: () => void
  onFavoritesChange: () => void
  onCompareChange: () => void
}

export function ModpackDetail({ modpack, onClose, onFavoritesChange, onCompareChange }: Props) {
  const [fav, setFav] = useState(isFavorite(modpack.id))
  const [compareList, setCompareList] = useState<string[]>(getCompareList())

  useEffect(() => {
    addRecent(modpack.id)
    document.body.style.overflow = 'hidden'
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEsc)
    }
  }, [modpack.id, onClose])

  const handleFav = () => {
    setFav(!fav)
    toggleFavorite(modpack.id)
    onFavoritesChange()
  }

  const handleCompare = () => {
    const updated = toggleCompare(modpack.id)
    setCompareList(updated)
    onCompareChange()
  }

  const inCompare = compareList.includes(modpack.id)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-stone-900 border border-stone-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero Image */}
        <div className="relative h-56 sm:h-72 overflow-hidden rounded-t-2xl">
          {modpack.image_url ? (
            <img src={modpack.image_url} alt={modpack.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-900 to-stone-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge border ${PLATFORM_COLORS[getPlatform(modpack)] || ''}`}>
                {getPlatform(modpack) === 'curated' && <Star className="w-3 h-3" />}
                {getPlatform(modpack) === 'modrinth' && <Globe className="w-3 h-3" />}
                {getPlatform(modpack) === 'curseforge' && <Cpu className="w-3 h-3" />}
                {PLATFORM_LABELS[getPlatform(modpack)]}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{modpack.name}</h2>
            <p className="text-stone-300 text-sm">by {modpack.author}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleFav}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                fav ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
              {fav ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={handleCompare}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                inCompare ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              {inCompare ? 'In Compare' : 'Compare'}
            </button>
            {modpack.download_url && (
              <a
                href={modpack.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            {modpack.external_url && (
              <a
                href={modpack.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on {PLATFORM_LABELS[getPlatform(modpack)]}
              </a>
            )}
            {modpack.wiki_url && (
              <a
                href={modpack.wiki_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Wiki
              </a>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-stone-300 leading-relaxed">{modpack.long_description}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<Star className="w-5 h-5" />} label="Rating" value={`${modpack.rating.toFixed(1)} / 5`} color="text-yellow-400" />
            <StatCard icon={<Download className="w-5 h-5" />} label="Downloads" value={formatDownloads(modpack.downloads)} color="text-blue-400" />
            <StatCard icon={<Package className="w-5 h-5" />} label="Mods" value={modpack.mod_count > 0 ? modpack.mod_count.toString() : '—'} color="text-green-400" />
            <StatCard icon={<Cpu className="w-5 h-5" />} label="Loader" value={modpack.loader} color="text-amber-400" />
          </div>

          {/* Attributes */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Gauge className="w-4 h-4 text-stone-500" />
              <span className="text-stone-500 text-sm">Performance:</span>
              <span className={`badge border ${PERFORMANCE_COLORS[modpack.performance_impact] || ''}`}>
                {modpack.performance_impact}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Swords className="w-4 h-4 text-stone-500" />
              <span className="text-stone-500 text-sm">Difficulty:</span>
              <span className={`badge border ${DIFFICULTY_COLORS[modpack.difficulty] || ''}`}>
                {modpack.difficulty}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-stone-500" />
              <span className="text-stone-500 text-sm">Loader:</span>
              <span className={`badge border ${LOADER_COLORS[modpack.loader] || ''}`}>
                {modpack.loader}
              </span>
            </div>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-stone-400 text-sm font-medium mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {modpack.genres.map(g => (
                <span key={g} className="badge bg-green-900/30 text-green-300 border border-green-800/50">
                  {genreLabel(g)}
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-stone-400 text-sm font-medium mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {modpack.tags.map(t => (
                <span key={t} className="badge bg-stone-800 text-stone-400 border border-stone-700">
                  {t.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Versions */}
          <div>
            <h3 className="text-stone-400 text-sm font-medium mb-2">Minecraft Versions</h3>
            <div className="flex flex-wrap gap-2">
              {modpack.minecraft_versions.map(v => (
                <span key={v} className="badge bg-stone-800 text-stone-300 border border-stone-700 font-mono">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-800">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <div className="text-xs text-stone-500 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-stone-200">{value}</div>
    </div>
  )
}
