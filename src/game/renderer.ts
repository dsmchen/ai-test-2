import { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, PATH } from './constants'

const ENEMY_COLORS: Record<string, string> = {
  normal: '#ff4444',
  fast: '#ff8844',
  tank: '#aa4444',
  boss: '#ff00ff',
}

const TOWER_EMOJI: Record<string, string> = {
  basic: '🎯',
  sniper: '🔭',
  splash: '💥',
  slow: '🐌',
}

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
    ctx.fillStyle = '#374151'
    ctx.fillRect(tower.x - CELL_SIZE / 3, tower.y - CELL_SIZE / 3, CELL_SIZE / 1.5, CELL_SIZE / 1.5)
    ctx.font = `${CELL_SIZE / 2}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(TOWER_EMOJI[tower.type], tower.x, tower.y)
    ctx.fillStyle = '#fff'
    ctx.font = '8px monospace'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(`Lv${tower.level}`, tower.x, tower.y + CELL_SIZE / 3 + 8)
  }

  for (const enemy of game.enemies) {
    ctx.fillStyle = ENEMY_COLORS[enemy.type] || '#ff4444'
    if (enemy.type === 'boss') {
      ctx.fillRect(enemy.x - 15, enemy.y - 15, 30, 30)
    } else if (enemy.type === 'tank') {
      ctx.beginPath()
      ctx.moveTo(enemy.x, enemy.y - 14)
      ctx.lineTo(enemy.x + 14, enemy.y + 10)
      ctx.lineTo(enemy.x - 14, enemy.y + 10)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2)
      ctx.fill()
    }
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
