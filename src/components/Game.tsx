import { useEffect, useRef, useState } from 'react'
import { Tower, TowerType, Difficulty } from '../game/types'
import { CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_MONEY, STARTING_LIVES, UPGRADE_COST, DIFFICULTY_MULTIPLIER, ENEMIES_PER_WAVE, SPAWN_INTERVAL } from '../game/constants'
import {
  createInitialState,
  spawnEnemy,
  placeTower,
  upgradeTower,
  getTowerStats,
  updateEnemies,
  updateTowers,
  updateProjectiles,
  checkWaveComplete,
  checkGameOver,
} from '../game/logic'
import { render } from '../game/renderer'
import HUD from './HUD'
import TowerSelector from './TowerSelector'

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [money, setMoney] = useState(STARTING_MONEY)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [wave, setWave] = useState(1)
  const [selectedTower, setSelectedTower] = useState<TowerType>('basic')
  const [selectedPlacedTower, setSelectedPlacedTower] = useState<Tower | null>(null)
  const [gameOver, setGameOver] = useState<'won' | 'lost' | null>(null)
  const [waveStarted, setWaveStarted] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  const gameRef = useRef(createInitialState())

  const startWave = () => {
    const game = gameRef.current
    if (game.waveStarted || gameOver) return
    game.waveStarted = true
    setWaveStarted(true)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const game = gameRef.current
    const clickedTower = game.towers.find(t => {
      const dx = t.x - x
      const dy = t.y - y
      return Math.sqrt(dx * dx + dy * dy) < CELL_SIZE / 2
    })

    if (clickedTower) {
      setSelectedPlacedTower(clickedTower)
      return
    }

    setSelectedPlacedTower(null)
    const gridX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const gridY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2

    if (placeTower(game, gridX, gridY, selectedTower)) {
      setMoney(game.money)
    }
  }

  const handleUpgrade = () => {
    if (!selectedPlacedTower) return
    const game = gameRef.current
    if (upgradeTower(game, selectedPlacedTower.id)) {
      setMoney(game.money)
      setSelectedPlacedTower({ ...selectedPlacedTower, level: selectedPlacedTower.level + 1 })
    }
  }

  const resetGame = () => {
    gameRef.current = createInitialState()
    setMoney(STARTING_MONEY)
    setLives(STARTING_LIVES)
    setWave(1)
    setWaveStarted(false)
    setGameOver(null)
    setSelectedPlacedTower(null)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false

    const gameLoop = (timestamp: number) => {
      if (cancelled) return
      const game = gameRef.current
      game.lastTimestamp = timestamp

      if (!gameOver) {
        if (game.enemiesSpawned < ENEMIES_PER_WAVE && timestamp - game.lastSpawn > SPAWN_INTERVAL) {
          spawnEnemy(game, difficulty)
          game.lastSpawn = timestamp
        }

        updateEnemies(game, timestamp)
        updateTowers(game, timestamp)
        updateProjectiles(game)

        if (checkWaveComplete(game)) {
          setGameOver('won')
        } else if (game.wave !== wave) {
          setWave(game.wave)
          setWaveStarted(false)
        }

        if (checkGameOver(game)) {
          setGameOver('lost')
        }

        setMoney(game.money)
        setLives(game.lives)
      }

      render(ctx, game)
      game.animationId = requestAnimationFrame(gameLoop)
    }

    gameRef.current.animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelled = true
      cancelAnimationFrame(gameRef.current.animationId)
    }
  }, [gameOver, wave, difficulty])

  const upgradeCost = selectedPlacedTower ? UPGRADE_COST[selectedPlacedTower.level] : 0
  const canUpgrade = selectedPlacedTower && selectedPlacedTower.level < 3 && money >= upgradeCost
  const upgradedStats = selectedPlacedTower && selectedPlacedTower.level < 3
    ? getTowerStats({ ...selectedPlacedTower, level: selectedPlacedTower.level + 1 })
    : null

  return (
    <div className="flex flex-col items-center gap-4">
      <HUD money={money} lives={lives} wave={wave} />
      <TowerSelector selected={selectedTower} onSelect={setSelectedTower} difficulty={difficulty} />

      {!waveStarted && !gameOver && wave === 1 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-300">Difficulty:</span>
          {([
            { key: 'easy' as Difficulty, color: '#15803D' },
            { key: 'medium' as Difficulty, color: '#A16207' },
            { key: 'hard' as Difficulty, color: '#B91C1C' },
          ]).map(({ key, color }) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              aria-pressed={difficulty === key}
              style={{
                backgroundColor: difficulty === key ? color : '#374151',
                color: '#fff',
              }}
              className="px-3 py-1 rounded capitalize hover:opacity-80"
            >
              {key}
            </button>
          ))}
          <span className="text-gray-300 text-sm">({DIFFICULTY_MULTIPLIER[difficulty]}x)</span>
        </div>
      )}

      {!waveStarted && !gameOver && (
        <div
          className="p-[2px] rounded-[5px]"
          style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
        >
          <button
            onClick={startWave}
            className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-[5px]"
          >
            Start Wave {wave}
          </button>
        </div>
      )}

      <div
        className="p-[3px] rounded-[5px]"
        style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          role="img"
          aria-label="Game board"
          className="cursor-crosshair rounded-[5px] block"
        />
      </div>

      {selectedPlacedTower && !gameOver && (
        <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded">
          <span className="text-white">
            {selectedPlacedTower.type} Lv{selectedPlacedTower.level}
          </span>
          {selectedPlacedTower.level < 3 ? (
            <button
              onClick={handleUpgrade}
              disabled={!canUpgrade}
              className={`px-3 py-1 rounded ${canUpgrade ? 'bg-yellow-700 hover:bg-yellow-600 text-white' : 'bg-gray-600 cursor-not-allowed text-white'}`}
            >
              Upgrade (${upgradeCost})
            </button>
          ) : (
            <span className="text-gray-300">Max Level</span>
          )}
          {upgradedStats && (
            <span className="text-gray-300 text-sm">
              → Dmg {upgradedStats.damage} | Rng {upgradedStats.range} | Rate {Math.round(upgradedStats.fireRate)}ms
            </span>
          )}
        </div>
      )}

      {gameOver && (
        <div className="text-center">
          <p className={`text-2xl mb-2 ${gameOver === 'won' ? 'text-green-300' : 'text-red-300'}`}>
            {gameOver === 'won' ? 'You Won!' : 'Game Over'}
          </p>
          <div
            className="p-[2px] rounded-[5px] inline-block"
            style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
          >
            <button onClick={resetGame} className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-[5px]">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
