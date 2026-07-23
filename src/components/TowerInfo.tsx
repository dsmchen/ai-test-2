import { Tower } from '../game/types'
import { getSellValue, getTowerStats } from '../game/logic'
import { UPGRADE_COST } from '../game/constants'

interface TowerInfoProps {
  tower: Tower
  money: number
  onUpgrade: () => void
  onSell: () => void
}

function TowerInfo({ tower, money, onUpgrade, onSell }: TowerInfoProps) {
  const upgradeCost = UPGRADE_COST[tower.level]
  const canUpgrade = tower.level < 3 && money >= upgradeCost
  const upgradedStats = tower.level < 3
    ? getTowerStats({ ...tower, level: tower.level + 1 })
    : null
  const sellValue = getSellValue(tower)

  return (
    <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded">
      <span className="text-white">
        {tower.type} Lv{tower.level}
      </span>
      {tower.level < 3 ? (
        <button
          onClick={onUpgrade}
          disabled={!canUpgrade}
          className={`px-3 py-1 rounded ${canUpgrade ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-600 cursor-not-allowed text-white'}`}
        >
          Upgrade (${upgradeCost})
        </button>
      ) : (
        <span className="text-gray-300">Max Level</span>
      )}
      <button
        onClick={onSell}
        className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white"
      >
        Sell (${sellValue})
      </button>
      {upgradedStats && (
        <span className="text-gray-300 text-sm">
          → Dmg {upgradedStats.damage} | Rng {upgradedStats.range} | Rate {Math.round(upgradedStats.fireRate)}ms
        </span>
      )}
    </div>
  )
}

export default TowerInfo
