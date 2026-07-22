import { GameState, TowerType } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, PATH, TOWER_STATS } from './constants'

const ENEMY_COLORS: Record<string, string> = {
  normal: '#e5e7eb',
  fast: '#9ca3af',
  tank: '#4b5563',
  boss: '#1f2937',
}

const TOWER_EMOJI: Record<string, string> = {
  basic: '🎯',
  sniper: '🔭',
  splash: '💥',
  slow: '🐌',
}

export function render(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  hoverPos: { x: number; y: number } | null,
  hoverTowerType: TowerType | null,
  placementValid: 'money' | 'tower' | 'path' | null
) {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.strokeStyle = '#2a2a4a'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= CANVAS_WIDTH; x += CELL_SIZE) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += CELL_SIZE) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_WIDTH, y)
    ctx.stroke()
  }

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
    ctx.fillStyle = ENEMY_COLORS[enemy.type] || '#e5e7eb'
    if (enemy.type === 'boss') {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const px = enemy.x + 14 * Math.cos(angle)
        const py = enemy.y + 14 * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    } else if (enemy.type === 'tank') {
      ctx.fillRect(enemy.x - 12, enemy.y - 12, 24, 24)
    } else if (enemy.type === 'fast') {
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

  if (hoverPos && hoverTowerType) {
    const stats = TOWER_STATS[hoverTowerType]
    const canPlace = placementValid === null

    ctx.globalAlpha = 0.4
    ctx.fillStyle = canPlace ? '#22c55e' : '#ef4444'
    ctx.fillRect(hoverPos.x - CELL_SIZE / 3, hoverPos.y - CELL_SIZE / 3, CELL_SIZE / 1.5, CELL_SIZE / 1.5)
    ctx.font = `${CELL_SIZE / 2}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText(TOWER_EMOJI[hoverTowerType], hoverPos.x, hoverPos.y)
    ctx.globalAlpha = 1

    ctx.strokeStyle = canPlace ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(hoverPos.x, hoverPos.y, stats.range, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
}
