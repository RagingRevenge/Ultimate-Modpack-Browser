import { TrendingUp, Package, Globe, Boxes } from 'lucide-react'
import type { Modpack } from '../types/modpack'
import { formatDownloads } from '../types/modpack'
import { memo, useMemo } from 'react'

interface Props {
  modpacks: Modpack[]
  externalTotals: { modrinth: number; curseforge: number }
  onSelect: (modpack: Modpack) => void
}

function StatsBarInner({ modpacks, externalTotals, onSelect }: Props) {
  const totalDownloads = useMemo(() => modpacks.reduce((sum, mp) => sum + mp.downloads, 0), [modpacks])
  const totalMods = useMemo(() => modpacks.reduce((sum, mp) => sum + mp.mod_count, 0), [modpacks])
  const totalModpacks = modpacks.length + externalTotals.modrinth + externalTotals.curseforge
  const topRated = useMemo(() => [...modpacks].sort((a, b) => b.rating - a.rating).slice(0, 5), [modpacks])

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox
          icon={<Package className="w-5 h-5" />}
          label="Total Modpacks"
          value={totalModpacks > 0 ? totalModpacks.toLocaleString() : '—'}
          color="text-green-400"
          bg="bg-green-900/20"
        />
        <StatBox
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Downloads"
          value={formatDownloads(totalDownloads)}
          color="text-blue-400"
          bg="bg-blue-900/20"
        />
        <StatBox
          icon={<Globe className="w-5 h-5" />}
          label="On Modrinth"
          value={externalTotals.modrinth > 0 ? externalTotals.modrinth.toLocaleString() : '—'}
          color="text-emerald-400"
          bg="bg-emerald-900/20"
        />
        <StatBox
          icon={<Boxes className="w-5 h-5" />}
          label="On CurseForge"
          value={externalTotals.curseforge > 0 ? externalTotals.curseforge.toLocaleString() : '—'}
          color="text-orange-400"
          bg="bg-orange-900/20"
        />
      </div>

      {/* Top rated strip */}
      {topRated.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-stone-400 mb-3">
            <TrendingUp className="w-4 h-4 text-yellow-400 fill-current" /> Top Rated
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {topRated.map((mp, i) => (
              <button
                key={mp.id}
                onClick={() => onSelect(mp)}
                className="flex items-center gap-3 bg-stone-800/50 hover:bg-stone-800 rounded-xl p-2.5 pr-4 transition-colors shrink-0 group"
              >
                <span className="text-xl font-bold text-stone-600 w-5 text-center">{i + 1}</span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-700 shrink-0">
                  {mp.image_url && <img src={mp.image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-stone-200 group-hover:text-green-400 transition-colors">{mp.name}</p>
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <TrendingUp className="w-3 h-3 text-yellow-400 fill-current" />
                    {mp.rating.toFixed(1)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const StatsBar = memo(StatsBarInner)

function StatBox({ icon, label, value, color, bg }: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bg: string
}) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg ${bg} flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-stone-500">{label}</div>
        <div className="text-xl font-bold text-stone-100">{value}</div>
      </div>
    </div>
  )
}
