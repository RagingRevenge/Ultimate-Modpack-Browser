const FAVORITES_KEY = 'modforge_favorites'
const COMPARE_KEY = 'modforge_compare'
const RECENTS_KEY = 'modforge_recents'

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function toggleFavorite(id: string): string[] {
  const favs = getFavorites()
  const updated = favs.includes(id)
    ? favs.filter(f => f !== id)
    : [...favs, id]
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
  return updated
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id)
}

export function getCompareList(): string[] {
  try {
    const raw = localStorage.getItem(COMPARE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function toggleCompare(id: string): string[] {
  const list = getCompareList()
  let updated: string[]
  if (list.includes(id)) {
    updated = list.filter(c => c !== id)
  } else if (list.length >= 4) {
    updated = [...list.slice(1), id]
  } else {
    updated = [...list, id]
  }
  localStorage.setItem(COMPARE_KEY, JSON.stringify(updated))
  return updated
}

export function clearCompare(): void {
  localStorage.removeItem(COMPARE_KEY)
}

export function getRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRecent(id: string): void {
  const recents = getRecents().filter(r => r !== id)
  localStorage.setItem(RECENTS_KEY, JSON.stringify([id, ...recents].slice(0, 8)))
}
