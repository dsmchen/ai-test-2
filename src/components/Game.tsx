import { useEffect, useRef } from 'react'

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

interface Tower {
  id: number
  x: number
  y: number
  level: number
}

interface Enemy {
  id: number
  x: number
  y: number
  health: number
  pathIndex: number
}

const initialTowers: Tower[] = [
  { id: 1, x: 120, y: 200, level: 1 },
  { id: 2, x: 400, y: 200, level: 2 },
  { id: 3, x: 680, y: 400, level: 1 },
]

const initialEnemies: Enemy[] = [
  { id: 1, x: 0, y: 300, health: 100, pathIndex: 0 },
  { id: 2, x: 100, y: 300, health: 80, pathIndex: 0 },
]

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef({
    towers: initialTowers,
    enemies: initialEnemies,
    animationId: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = () => {
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

      for (const tower of gameRef.current.towers) {
        const colorIndex = gameRef.current.towers.indexOf(tower) % RAINBOW.length
        ctx.fillStyle = RAINBOW[colorIndex]
        ctx.fillRect(tower.x - CELL_SIZE / 3, tower.y - CELL_SIZE / 3, CELL_SIZE / 1.5, CELL_SIZE / 1.5)
        ctx.fillStyle = '#fff'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`Lv${tower.level}`, tower.x, tower.y + 4)
      }

      for (const enemy of gameRef.current.enemies) {
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2)
        ctx.fill()

        if (enemy.pathIndex < PATH.length - 1) {
          const target = PATH[enemy.pathIndex + 1]
          const dx = target.x - enemy.x
          const dy = target.y - enemy.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 2) {
            enemy.pathIndex++
          } else {
            enemy.x += (dx / dist) * 2
            enemy.y += (dy / dist) * 2
          }
        }
      }

      gameRef.current.animationId = requestAnimationFrame(gameLoop)
    }

    gameRef.current.animationId = requestAnimationFrame(gameLoop)

    const animationId = gameRef.current.animationId
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border border-gray-600"
    />
  )
}

export default Game
