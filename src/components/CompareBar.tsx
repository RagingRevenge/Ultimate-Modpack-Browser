import { GitCompare, X } from 'lucide-react'
import type { Modpack } from '../types/modpack'
import { clearCompare } from '../lib/storage'

interface Props {
  modpacks: Modpack[]
  onOpen: () => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function CompareBar({ modpacks, onOpen, onRemove, onClear }: Props) {
  if (modpacks.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-green-900/50 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 text-green-400">
          <GitCompare className="w-5 h-5" />
          <span className="text-sm font-medium">Compare ({modpacks.length}/4)</span>
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {modpacks.map(mp => (
            <div key={mp.id} className="flex items-center gap-2 bg-stone-800 rounded-lg pl-2 pr-1 py-1 shrink-0">
              <div className="w-8 h-8 rounded overflow-hidden bg-stone-700 shrink-0">
                {mp.image_url && <img src={mp.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="text-xs text-stone-300 max-w-[100px] truncate">{mp.name}</span>
              <button
                onClick={() => onRemove(mp.id)}
                className="w-5 h-5 rounded hover:bg-stone-700 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-stone-500" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 shrink-0">
          {modpacks.length >= 2 && (
            <button onClick={onOpen} className="btn-primary text-sm">
              Compare Now
            </button>
          )}
          <button onClick={onClear} className="btn-ghost text-sm">Clear</button>
        </div>
      </div>
    </div>
  )
}

export { clearCompare }
