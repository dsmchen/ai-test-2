import { useEffect, useRef, useState, useCallback } from 'react'
import { Tower, TowerType, Difficulty } from '../game/types'
import { CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_MONEY, STARTING_LIVES, UPGRADE_COST, DIFFICULTY_MULTIPLIER, ENEMIES_PER_WAVE, SPAWN_INTERVAL, SELL_RATIO, TOWER_STATS, TOTAL_WAVES } from '../game/constants'
import {
  createInitialState,
  spawnEnemy,
  placeTower,
  canPlaceTower,
  upgradeTower,
  sellTower,
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

interface Toast {
  message: string
  type: 'error' | 'success'
}

const TOAST_MESSAGES: Record<string, string> = {
  money: 'Not enough money',
  tower: 'Too close to another tower',
  path: 'Too close to the path',
}

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
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [placementValid, setPlacementValid] = useState<'money' | 'tower' | 'path' | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [gameSpeed, setGameSpeed] = useState(1)
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null)
  const placementValidRef = useRef<'money' | 'tower' | 'path' | null>(null)

  const gameRef = useRef(createInitialState())

  const startWave = () => {
    const game = gameRef.current
    if (game.waveStarted || gameOver) return
    game.waveStarted = true
    setWaveStarted(true)
  }

  const showToast = useCallback((message: string, type: 'error' | 'success') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ message, type })
    toastTimeout.current = setTimeout(() => setToast(null), 1500)
  }, [])

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
      showToast('Tower placed!', 'success')
    } else {
      const reason = canPlaceTower(game, gridX, gridY, selectedTower)
      if (reason) {
        showToast(TOAST_MESSAGES[reason], 'error')
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const gridX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const gridY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const pos = { x: gridX, y: gridY }
    const valid = gameOver ? null : canPlaceTower(gameRef.current, gridX, gridY, selectedTower)
    setHoverPos(pos)
    setPlacementValid(valid)
    hoverPosRef.current = pos
    placementValidRef.current = valid
  }

  const handleMouseLeave = () => {
    setHoverPos(null)
    setPlacementValid(null)
    hoverPosRef.current = null
    placementValidRef.current = null
  }

  const handleUpgrade = () => {
    if (!selectedPlacedTower) return
    const game = gameRef.current
    if (upgradeTower(game, selectedPlacedTower.id)) {
      setMoney(game.money)
      setSelectedPlacedTower({ ...selectedPlacedTower, level: selectedPlacedTower.level + 1 })
    }
  }

  const handleSell = () => {
    if (!selectedPlacedTower) return
    const game = gameRef.current
    if (sellTower(game, selectedPlacedTower.id)) {
      setMoney(game.money)
      setSelectedPlacedTower(null)
    }
  }

  const togglePause = useCallback(() => {
    const game = gameRef.current
    game.paused = !game.paused
  }, [])

  const cycleSpeed = useCallback(() => {
    setGameSpeed(prev => prev === 1 ? 2 : prev === 2 ? 3 : 1)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePause()
          break
        case 'f':
        case 'F':
          cycleSpeed()
          break
        case '1':
          setSelectedTower('basic')
          break
        case '2':
          setSelectedTower('sniper')
          break
        case '3':
          setSelectedTower('splash')
          break
        case '4':
          setSelectedTower('slow')
          break
        case 'Escape':
          setSelectedPlacedTower(null)
          break
        case 'u':
        case 'U':
          handleUpgrade()
          break
        case 's':
        case 'S':
          handleSell()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameOver, togglePause, cycleSpeed])

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

      if (game.lastTimestamp > 0) {
        game.deltaTime = Math.min(timestamp - game.lastTimestamp, 50)
      }
      game.lastTimestamp = timestamp
      game.gameSpeed = gameSpeed

      if (!gameOver && !game.paused) {
        if (game.enemiesSpawned < ENEMIES_PER_WAVE && timestamp - game.lastSpawn > SPAWN_INTERVAL / gameSpeed) {
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

        if (game.money !== money) setMoney(game.money)
        if (game.lives !== lives) setLives(game.lives)
      }

      render(ctx, game, hoverPosRef.current, selectedTower, placementValidRef.current)
      game.animationId = requestAnimationFrame(gameLoop)
    }

    gameRef.current.animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelled = true
      cancelAnimationFrame(gameRef.current.animationId)
    }
  }, [gameOver, wave, difficulty, selectedTower, gameSpeed, money, lives])

  const upgradeCost = selectedPlacedTower ? UPGRADE_COST[selectedPlacedTower.level] : 0
  const canUpgrade = selectedPlacedTower && selectedPlacedTower.level < 3 && money >= upgradeCost
  const upgradedStats = selectedPlacedTower && selectedPlacedTower.level < 3
    ? getTowerStats({ ...selectedPlacedTower, level: selectedPlacedTower.level + 1 })
    : null

  const sellValue = selectedPlacedTower ? (() => {
    const baseCost = TOWER_STATS[selectedPlacedTower.type].cost
    let totalUpgradeCost = 0
    for (let i = 1; i < selectedPlacedTower.level; i++) {
      totalUpgradeCost += UPGRADE_COST[i]
    }
    return Math.round((baseCost + totalUpgradeCost) * SELL_RATIO)
  })() : 0

  const cursorClass = gameOver
    ? 'cursor-default'
    : hoverPos
      ? placementValid === null
        ? 'cursor-pointer'
        : 'cursor-not-allowed'
      : 'cursor-crosshair'

  return (
    <div className="relative flex flex-col items-center gap-4">
      <HUD money={money} lives={lives} wave={wave} />
      <TowerSelector selected={selectedTower} onSelect={setSelectedTower} difficulty={difficulty} money={money} />

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
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Wave {wave}:</span>
            <span>{ENEMIES_PER_WAVE} enemies</span>
            {wave === TOTAL_WAVES && <span className="text-purple-400">+ Boss</span>}
          </div>
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
        </div>
      )}

      {waveStarted && !gameOver && (
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >
            {gameRef.current.paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={cycleSpeed}
            className={`px-3 py-1 rounded text-sm text-white ${gameSpeed > 1 ? 'bg-blue-700 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {gameSpeed}x
          </button>
          <span className="text-gray-500 text-xs">Space=pause F=speed 1-4=tower</span>
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
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label="Game board"
          className={`rounded-[5px] block ${cursorClass}`}
        />
      </div>

      {toast && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 bottom-4 px-4 py-2 rounded text-sm text-white z-10 animate-slide-up ${
            toast.type === 'error' ? 'bg-red-700' : 'bg-green-700'
          }`}
        >
          {toast.message}
        </div>
      )}

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
          <button
            onClick={handleSell}
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
