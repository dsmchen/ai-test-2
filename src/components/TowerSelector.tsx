import { TowerType } from '../game/types'
import { TOWER_STATS, TOWER_EMOJI, TOWER_DESCRIPTIONS } from '../game/constants'

interface TowerSelectorProps {
  selected: TowerType
  onSelect: (type: TowerType) => void
  money: number
}

const TOWER_TYPES: TowerType[] = ['basic', 'sniper', 'splash', 'slow']

function TowerSelector({ selected, onSelect, money }: TowerSelectorProps) {
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
            title={TOWER_DESCRIPTIONS[t]}
            className={`px-3 py-1 rounded transition-btn ${
              !canAfford ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: selected === t ? '#6b7280' : '#374151' }}
          >
            {TOWER_EMOJI[t]} {t} (${TOWER_STATS[t].cost})
          </button>
        )
      })}
    </div>
  )
}

export default TowerSelector
