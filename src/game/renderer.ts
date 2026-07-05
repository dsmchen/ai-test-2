import { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, PATH, RAINBOW } from './constants'

export function render(
  ctx: CanvasRenderingContext2D,
  game: GameState
) {
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
}
