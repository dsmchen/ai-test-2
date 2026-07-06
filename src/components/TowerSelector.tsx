import { TowerType, Difficulty } from '../game/types'
import { TOWER_STATS, DIFFICULTY_COLOR } from '../game/constants'

interface TowerSelectorProps {
  selected: TowerType
  onSelect: (type: TowerType) => void
  difficulty: Difficulty
}

const TOWER_TYPES: TowerType[] = ['basic', 'sniper', 'splash', 'slow']

const TOWER_EMOJI: Record<TowerType, string> = {
  basic: '🎯',
  sniper: '🔭',
  splash: '💥',
  slow: '🐌',
}

function TowerSelector({ selected, onSelect, difficulty }: TowerSelectorProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Tower selection">
      {TOWER_TYPES.map(t => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          aria-pressed={selected === t}
          className="px-3 py-1 rounded transition-btn"
          style={{ backgroundColor: selected === t ? DIFFICULTY_COLOR[difficulty] : '#374151' }}
        >
          {TOWER_EMOJI[t]} {t} (${TOWER_STATS[t].cost})
        </button>
      ))}
    </div>
  )
}

export default TowerSelector
