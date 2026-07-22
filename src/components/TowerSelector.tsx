import { TowerType, Difficulty } from '../game/types'
import { TOWER_STATS, DIFFICULTY_COLOR } from '../game/constants'

interface TowerSelectorProps {
  selected: TowerType
  onSelect: (type: TowerType) => void
  difficulty: Difficulty
  money: number
}

const TOWER_TYPES: TowerType[] = ['basic', 'sniper', 'splash', 'slow']

const TOWER_EMOJI: Record<TowerType, string> = {
  basic: '🎯',
  sniper: '🔭',
  splash: '💥',
  slow: '🐌',
}

function TowerSelector({ selected, onSelect, difficulty, money }: TowerSelectorProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Tower selection">
      {TOWER_TYPES.map(t => {
        const canAfford = money >= TOWER_STATS[t].cost
        return (
          <button
            key={t}
            onClick={() => canAfford && onSelect(t)}
            aria-pressed={selected === t}
            disabled={!canAfford}
            className={`px-3 py-1 rounded transition-btn ${
              !canAfford ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: selected === t ? DIFFICULTY_COLOR[difficulty] : '#374151' }}
          >
            {TOWER_EMOJI[t]} {t} (${TOWER_STATS[t].cost})
          </button>
        )
      })}
    </div>
  )
}

export default TowerSelector
