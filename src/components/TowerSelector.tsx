import { TowerType } from '../game/types'
import { TOWER_STATS } from '../game/constants'

interface TowerSelectorProps {
  selected: TowerType
  onSelect: (type: TowerType) => void
}

const TOWER_TYPES: TowerType[] = ['basic', 'sniper', 'splash', 'slow']

function TowerSelector({ selected, onSelect }: TowerSelectorProps) {
  return (
    <div className="flex gap-2">
      {TOWER_TYPES.map(t => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          className={`px-3 py-1 rounded ${selected === t ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500`}
        >
          {t} (${TOWER_STATS[t].cost})
        </button>
      ))}
    </div>
  )
}

export default TowerSelector
