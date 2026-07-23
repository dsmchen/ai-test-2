import { useEffect, useRef, useState, useCallback } from 'react'
import { Tower, TowerType, Difficulty } from '../game/types'
import { CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, STARTING_MONEY, STARTING_LIVES, UPGRADE_COST, ENEMIES_PER_WAVE, SPAWN_INTERVAL, SELL_RATIO, TOWER_STATS } from '../game/constants'
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
  const [phase, setPhase] = useState<'setup' | 'playing'>('setup')
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
  const [isPaused, setIsPaused] = useState(false)
  const toastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null)
  const placementValidRef = useRef<'money' | 'tower' | 'path' | null>(null)

  const gameRef = useRef(createInitialState())

  const startGame = () => {
    gameRef.current = createInitialState()
    setMoney(STARTING_MONEY)
    setLives(STARTING_LIVES)
    setWave(1)
    setWaveStarted(false)
    setGameOver(null)
    setSelectedPlacedTower(null)
    setGameSpeed(1)
    setIsPaused(false)
    setPhase('playing')
  }

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

  const handleUpgrade = useCallback(() => {
    if (!selectedPlacedTower) return
    const game = gameRef.current
    if (upgradeTower(game, selectedPlacedTower.id)) {
      setMoney(game.money)
      setSelectedPlacedTower({ ...selectedPlacedTower, level: selectedPlacedTower.level + 1 })
    }
  }, [selectedPlacedTower])

  const handleSell = useCallback(() => {
    if (!selectedPlacedTower) return
    const game = gameRef.current
    if (sellTower(game, selectedPlacedTower.id)) {
      setMoney(game.money)
      setSelectedPlacedTower(null)
    }
  }, [selectedPlacedTower])

  const togglePause = useCallback(() => {
    const game = gameRef.current
    game.paused = !game.paused
    setIsPaused(game.paused)
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
        case '>':
        case '.':
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
  }, [gameOver, togglePause, cycleSpeed, handleUpgrade, handleSell])

  const resetGame = () => {
    gameRef.current = createInitialState()
    setMoney(STARTING_MONEY)
    setLives(STARTING_LIVES)
    setWave(1)
    setWaveStarted(false)
    setGameOver(null)
    setSelectedPlacedTower(null)
    setGameSpeed(1)
    setIsPaused(false)
    setPhase('setup')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    let cancelled = false

    render(ctx, gameRef.current, null, selectedTower, null, null)

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

      render(ctx, game, hoverPosRef.current, selectedTower, placementValidRef.current, selectedPlacedTower?.id ?? null)
      game.animationId = requestAnimationFrame(gameLoop)
    }

    gameRef.current.animationId = requestAnimationFrame(gameLoop)

    return () => {
      cancelled = true
      cancelAnimationFrame(gameRef.current.animationId)
    }
  }, [gameOver, wave, difficulty, selectedTower, gameSpeed, money, lives, phase]) // eslint-disable-line react-hooks/exhaustive-deps

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

  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-8 py-12">
        <div className="flex flex-col items-center gap-4">
          <span className="text-gray-300">Select Difficulty</span>
          <div className="flex items-center gap-3">
            {([
              { key: 'easy' as Difficulty, color: '#15803D', label: 'Easy', desc: '0.7x stats' },
              { key: 'medium' as Difficulty, color: '#A16207', label: 'Medium', desc: '1x stats' },
              { key: 'hard' as Difficulty, color: '#B91C1C', label: 'Hard', desc: '1.5x stats' },
            ]).map(({ key, color, label, desc }) => (
              <button
                key={key}
                onClick={() => setDifficulty(key)}
                aria-pressed={difficulty === key}
                style={{
                  backgroundColor: difficulty === key ? color : '#374151',
                  color: '#fff',
                }}
                className="px-6 py-3 rounded-lg capitalize hover:opacity-80 flex flex-col items-center min-w-[100px]"
              >
                <span className="font-semibold">{label}</span>
                <span className="text-xs opacity-75">{desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div
          className="p-[2px] rounded-[5px]"
          style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
        >
          <button
            onClick={startGame}
            className="px-8 py-3 bg-gray-800 text-white hover:bg-gray-700 rounded-[5px] text-lg font-semibold"
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      <HUD money={money} lives={lives} wave={wave} />
      <TowerSelector selected={selectedTower} onSelect={setSelectedTower} money={money} />

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

      {waveStarted && !gameOver && (
        <div className="flex items-center gap-2 min-h-[36px]">
          <button
            onClick={togglePause}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={cycleSpeed}
            className={`px-3 py-1 rounded text-sm text-white ${
              gameSpeed > 1 ? 'bg-gray-500 hover:bg-gray-400' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {gameSpeed}x
          </button>
          <span className="relative group">
            <button
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
              aria-label="Keyboard shortcuts"
            >
              ?
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-focus-within:block bg-gray-800 text-gray-300 text-xs rounded px-3 py-2 whitespace-nowrap z-20 border border-gray-600">
              <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">Space</kbd> pause/resume<br/>
              <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">&gt;</kbd> cycle speed<br/>
              <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">1-4</kbd> select tower<br/>
              <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">Esc</kbd> deselect<br/>
              <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">U</kbd> upgrade<br/>
              <kbd className="bg-gray-600 px-1 py-0.5 rounded text-[10px]">S</kbd> sell
            </span>
          </span>
        </div>
      )}

      <div
        className="relative p-[3px] rounded-[5px]"
        style={{ background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #9400D3)' }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: '#1a1a2e' }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label="Game board"
          className={`rounded-[5px] block ${cursorClass}`}
        />

        {gameOver && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 rounded-[5px] animate-fade-in">
            <div className="text-center animate-slide-up">
              <p className={`text-3xl font-bold mb-4 ${gameOver === 'won' ? 'text-green-300' : 'text-red-300'}`}>
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
          </div>
        )}
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
              className={`px-3 py-1 rounded ${canUpgrade ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-600 cursor-not-allowed text-white'}`}
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
    </div>
  )
}

export default Game
