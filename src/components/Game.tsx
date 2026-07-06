import { useEffect, useRef, useState } from 'react'
import { Tower, TowerType, Difficulty } from '../game/types'
import { CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_MONEY, STARTING_LIVES, UPGRADE_COST, DIFFICULTY_MULTIPLIER } from '../game/constants'
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

    const gameLoop = (timestamp: number) => {
      const game = gameRef.current

      if (!gameOver) {
        if (game.enemiesSpawned < 8 && timestamp - game.lastSpawn > 1500) {
          spawnEnemy(game, difficulty)
          game.lastSpawn = timestamp
        }

        updateEnemies(game)
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

    const animationId = gameRef.current.animationId
    return () => {
      cancelAnimationFrame(animationId)
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
      <TowerSelector selected={selectedTower} onSelect={setSelectedTower} />

      {!waveStarted && !gameOver && wave === 1 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Difficulty:</span>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded capitalize ${difficulty === d ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500`}
            >
              {d}
            </button>
          ))}
          <span className="text-gray-500 text-sm">({DIFFICULTY_MULTIPLIER[difficulty]}x)</span>
        </div>
      )}

      {!waveStarted && !gameOver && (
        <button onClick={startWave} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">
          Start Wave {wave}
        </button>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="border border-gray-600 cursor-crosshair"
      />

      {selectedPlacedTower && !gameOver && (
        <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded">
          <span className="text-white">
            {selectedPlacedTower.type} Lv{selectedPlacedTower.level}
          </span>
          {selectedPlacedTower.level < 3 ? (
            <button
              onClick={handleUpgrade}
              disabled={!canUpgrade}
              className={`px-3 py-1 rounded ${canUpgrade ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-600 cursor-not-allowed'}`}
            >
              Upgrade (${upgradeCost})
            </button>
          ) : (
            <span className="text-gray-400">Max Level</span>
          )}
          {upgradedStats && (
            <span className="text-gray-400 text-sm">
              → Dmg {upgradedStats.damage} | Rng {upgradedStats.range} | Rate {Math.round(upgradedStats.fireRate)}ms
            </span>
          )}
        </div>
      )}

      {gameOver && (
        <div className="text-center">
          <p className={`text-2xl mb-2 ${gameOver === 'won' ? 'text-green-400' : 'text-red-400'}`}>
            {gameOver === 'won' ? 'You Won!' : 'Game Over'}
          </p>
          <button onClick={resetGame} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Game
