import { createPortal } from 'react-dom'
import { X, GitCompare, Star, Download, Package, Gauge, Swords, Cpu, Tag } from 'lucide-react'
import type { Modpack } from '../types/modpack'
import { formatDownloads, genreLabel, PERFORMANCE_COLORS, DIFFICULTY_COLORS, LOADER_COLORS } from '../types/modpack'

interface Props {
  modpacks: Modpack[]
  onClose: () => void
  onSelect: (modpack: Modpack) => void
  onClear: () => void
}

export function CompareModal({ modpacks, onClose, onSelect, onClear }: Props) {
  if (modpacks.length === 0) return null

  const rows: { label: string; key: keyof Modpack; icon: React.ReactNode; format?: (val: any) => string }[] = [
    { label: 'Rating', key: 'rating', icon: <Star className="w-4 h-4 text-yellow-400" />, format: (v: number) => `${v.toFixed(1)} / 5` },
    { label: 'Downloads', key: 'downloads', icon: <Download className="w-4 h-4 text-blue-400" />, format: (v: number) => formatDownloads(v) },
    { label: 'Mod Count', key: 'mod_count', icon: <Package className="w-4 h-4 text-green-400" /> },
    { label: 'Loader', key: 'loader', icon: <Cpu className="w-4 h-4 text-amber-400" /> },
    { label: 'Performance', key: 'performance_impact', icon: <Gauge className="w-4 h-4 text-orange-400" /> },
    { label: 'Difficulty', key: 'difficulty', icon: <Swords className="w-4 h-4 text-red-400" /> },
  ]

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-stone-900 border border-stone-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-stone-900 border-b border-stone-800 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-green-400" /> Compare Modpacks
          </h2>
          <div className="flex gap-2">
            <button onClick={onClear} className="btn-ghost text-sm">Clear All</button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-stone-300" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full">
            <tbody>
              {/* Image row */}
              <tr>
                <td className="sticky left-0 bg-stone-900 w-32 pr-4"></td>
                {modpacks.map(mp => (
                  <td key={mp.id} className="p-2 min-w-[180px]">
                    <div className="relative h-24 rounded-lg overflow-hidden cursor-pointer" onClick={() => onSelect(mp)}>
                      {mp.image_url ? (
                        <img src={mp.image_url} alt={mp.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-900 to-stone-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-sm font-bold leading-tight">{mp.name}</p>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Author row */}
              <tr className="border-t border-stone-800">
                <td className="sticky left-0 bg-stone-900 py-3 pr-4 text-xs text-stone-500 font-medium uppercase">Author</td>
                {modpacks.map(mp => (
                  <td key={mp.id} className="py-3 px-2 text-sm text-stone-300">{mp.author}</td>
                ))}
              </tr>

              {/* Stat rows */}
              {rows.map(row => (
                <tr key={row.label} className="border-t border-stone-800">
                  <td className="sticky left-0 bg-stone-900 py-3 pr-4">
                    <span className="flex items-center gap-2 text-xs text-stone-500 font-medium uppercase">
                      {row.icon} {row.label}
                    </span>
                  </td>
                  {modpacks.map(mp => {
                    const raw = mp[row.key] as any
                    const display = row.format ? row.format(raw) : String(raw)
                    let extra: React.ReactNode = null
                    if (row.key === 'performance_impact') {
                      extra = <span className={`badge border ml-1 ${PERFORMANCE_COLORS[mp.performance_impact] || ''}`}>{mp.performance_impact}</span>
                    } else if (row.key === 'difficulty') {
                      extra = <span className={`badge border ml-1 ${DIFFICULTY_COLORS[mp.difficulty] || ''}`}>{mp.difficulty}</span>
                    } else if (row.key === 'loader') {
                      extra = <span className={`badge border ml-1 ${LOADER_COLORS[mp.loader] || ''}`}>{mp.loader}</span>
                    }
                    return (
                      <td key={mp.id} className="py-3 px-2 text-sm text-stone-200">
                        {extra || display}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Genres row */}
              <tr className="border-t border-stone-800">
                <td className="sticky left-0 bg-stone-900 py-3 pr-4">
                  <span className="flex items-center gap-2 text-xs text-stone-500 font-medium uppercase">
                    <Tag className="w-4 h-4 text-green-400" /> Genres
                  </span>
                </td>
                {modpacks.map(mp => (
                  <td key={mp.id} className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {mp.genres.map(g => (
                        <span key={g} className="text-[10px] text-green-400/80 bg-green-900/20 px-2 py-0.5 rounded-full">
                          {genreLabel(g)}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* MC Versions row */}
              <tr className="border-t border-stone-800">
                <td className="sticky left-0 bg-stone-900 py-3 pr-4 text-xs text-stone-500 font-medium uppercase">MC Versions</td>
                {modpacks.map(mp => (
                  <td key={mp.id} className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {mp.minecraft_versions.map(v => (
                        <span key={v} className="text-[10px] font-mono text-stone-300 bg-stone-800 px-2 py-0.5 rounded">{v}</span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Description row */}
              <tr className="border-t border-stone-800">
                <td className="sticky left-0 bg-stone-900 py-3 pr-4 text-xs text-stone-500 font-medium uppercase">Description</td>
                {modpacks.map(mp => (
                  <td key={mp.id} className="py-3 px-2 text-xs text-stone-400 leading-relaxed align-top">{mp.description}</td>
                ))}
              </tr>
            </tbody>
          </table>

          {modpacks.length < 2 && (
            <p className="text-center text-stone-500 text-sm mt-4">
              Add more modpacks to compare (up to 4)
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
