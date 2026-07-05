import { useEffect, useRef, useState } from 'react'

const CELL_SIZE = 40
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

const PATH = [
  { x: 0, y: 300 },
  { x: 200, y: 300 },
  { x: 200, y: 100 },
  { x: 600, y: 100 },
  { x: 600, y: 500 },
  { x: 800, y: 500 },
]

const RAINBOW = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']

type TowerType = 'basic' | 'sniper' | 'splash' | 'slow'

interface Tower {
  id: number
  type: TowerType
  x: number
  y: number
  level: number
  lastFired: number
}

interface Enemy {
  id: number
  x: number
  y: number
  health: number
  maxHealth: number
  speed: number
  pathIndex: number
  reward: number
}

interface Projectile {
  id: number
  x: number
  y: number
  targetId: number
  damage: number
  speed: number
}

const TOWER_STATS: Record<TowerType, { damage: number; range: number; fireRate: number; cost: number }> = {
  basic: { damage: 10, range: 100, fireRate: 1000, cost: 50 },
  sniper: { damage: 50, range: 200, fireRate: 2000, cost: 100 },
  splash: { damage: 15, range: 80, fireRate: 1500, cost: 75 },
  slow: { damage: 5, range: 90, fireRate: 800, cost: 60 },
}

const ENEMY_STATS = { health: 80, speed: 0.8, reward: 15 }
const ENEMIES_PER_WAVE = 8
const SPAWN_INTERVAL = 1500

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [money, setMoney] = useState(200)
  const [lives, setLives] = useState(20)
  const [wave, setWave] = useState(1)
  const [selectedTower, setSelectedTower] = useState<TowerType>('basic')
  const [gameOver, setGameOver] = useState<'won' | 'lost' | null>(null)
  const [waveStarted, setWaveStarted] = useState(false)

  const gameRef = useRef({
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    money: 300,
    lives: 30,
    wave: 1,
    lastSpawn: 0,
    enemiesSpawned: 0,
    waveStarted: false,
    animationId: 0,
  })

  const spawnEnemy = () => {
    const game = gameRef.current
    if (!game.waveStarted || game.enemiesSpawned >= ENEMIES_PER_WAVE) return

    game.enemies.push({
      id: Date.now() + Math.random(),
      x: PATH[0].x,
      y: PATH[0].y,
      health: ENEMY_STATS.health,
      maxHealth: ENEMY_STATS.health,
      speed: ENEMY_STATS.speed,
      pathIndex: 0,
      reward: ENEMY_STATS.reward,
    })
    game.enemiesSpawned++
  }

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
    const gridX = Math.floor(x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2
    const gridY = Math.floor(y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2

    const stats = TOWER_STATS[selectedTower]
    const game = gameRef.current

    if (game.money < stats.cost) return

    const tooClose = game.towers.some(t => {
      const dx = t.x - gridX
      const dy = t.y - gridY
      return Math.sqrt(dx * dx + dy * dy) < CELL_SIZE
    })
    if (tooClose) return

    game.towers.push({
      id: Date.now(),
      type: selectedTower,
      x: gridX,
      y: gridY,
      level: 1,
      lastFired: 0,
    })
    game.money -= stats.cost
    setMoney(game.money)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = (timestamp: number) => {
      const game = gameRef.current

      if (!gameOver) {
        if (game.enemiesSpawned < ENEMIES_PER_WAVE && timestamp - game.lastSpawn > SPAWN_INTERVAL) {
          spawnEnemy()
          game.lastSpawn = timestamp
        }

        for (const enemy of game.enemies) {
          if (enemy.pathIndex < PATH.length - 1) {
            const target = PATH[enemy.pathIndex + 1]
            const dx = target.x - enemy.x
            const dy = target.y - enemy.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < enemy.speed * 2) {
              enemy.pathIndex++
            } else {
              enemy.x += (dx / dist) * enemy.speed * 2
              enemy.y += (dy / dist) * enemy.speed * 2
            }
          } else {
            game.lives--
            setLives(game.lives)
            enemy.health = 0
          }
        }
        game.enemies = game.enemies.filter(e => e.health > 0)

        for (const tower of game.towers) {
          const stats = TOWER_STATS[tower.type]
          if (timestamp - tower.lastFired > stats.fireRate) {
            for (const enemy of game.enemies) {
              const dx = enemy.x - tower.x
              const dy = enemy.y - tower.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist <= stats.range) {
                game.projectiles.push({
                  id: Date.now() + Math.random(),
                  x: tower.x,
                  y: tower.y,
                  targetId: enemy.id,
                  damage: stats.damage,
                  speed: 5,
                })
                tower.lastFired = timestamp
                break
              }
            }
          }
        }

        for (const proj of game.projectiles) {
          const target = game.enemies.find(e => e.id === proj.targetId)
          if (target) {
            const dx = target.x - proj.x
            const dy = target.y - proj.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 10) {
              target.health -= proj.damage
              if (target.health <= 0) {
                game.money += target.reward
                setMoney(game.money)
              }
              proj.x = -100
            } else {
              proj.x += (dx / dist) * proj.speed
              proj.y += (dy / dist) * proj.speed
            }
          } else {
            proj.x = -100
          }
        }
        game.projectiles = game.projectiles.filter(p => p.x > -50)

        if (game.enemies.length === 0 && game.enemiesSpawned >= ENEMIES_PER_WAVE) {
          if (game.wave < 3) {
            game.wave++
            game.enemiesSpawned = 0
            game.waveStarted = false
            setWave(game.wave)
            setWaveStarted(false)
          } else {
            setGameOver('won')
          }
        }

        if (game.lives <= 0) {
          setGameOver('lost')
        }
      }

      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.strokeStyle = '#4a4a6a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(PATH[0].x, PATH[0].y)
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y)
      }
      ctx.stroke()

      for (const tower of game.towers) {
        const colorIndex = game.towers.indexOf(tower) % RAINBOW.length
        ctx.fillStyle = RAINBOW[colorIndex]
        ctx.fillRect(tower.x - CELL_SIZE / 3, tower.y - CELL_SIZE / 3, CELL_SIZE / 1.5, CELL_SIZE / 1.5)
        ctx.fillStyle = '#fff'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`Lv${tower.level}`, tower.x, tower.y + 4)
      }

      for (const enemy of game.enemies) {
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#44ff44'
        ctx.fillRect(enemy.x - 15, enemy.y - 20, 30 * (enemy.health / enemy.maxHealth), 4)
      }

      ctx.fillStyle = '#ffff00'
      for (const proj of game.projectiles) {
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      game.animationId = requestAnimationFrame(gameLoop)
    }

    gameRef.current.animationId = requestAnimationFrame(gameLoop)

    const animationId = gameRef.current.animationId
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [gameOver])

  const resetGame = () => {
    gameRef.current = {
      towers: [],
      enemies: [],
      projectiles: [],
      money: 300,
      lives: 30,
      wave: 1,
      lastSpawn: 0,
      enemiesSpawned: 0,
      waveStarted: false,
      animationId: 0,
    }
    setMoney(300)
    setLives(30)
    setWave(1)
    setWaveStarted(false)
    setGameOver(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 text-lg">
        <span>💰 {money}</span>
        <span>❤️ {lives}</span>
        <span>🌊 Wave {wave}/3</span>
      </div>

      <div className="flex gap-2">
        {(['basic', 'sniper', 'splash', 'slow'] as TowerType[]).map(t => (
          <button
            key={t}
            onClick={() => setSelectedTower(t)}
            className={`px-3 py-1 rounded ${selectedTower === t ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-500`}
          >
            {t} (${TOWER_STATS[t].cost})
          </button>
        ))}
      </div>

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
