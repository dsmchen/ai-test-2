import { GameState, TowerType } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, PATH, TOWER_STATS, TOWER_EMOJI, ENEMY_SIZES, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, HEALTH_BAR_OFFSET_Y, PROJECTILE_RADIUS } from './constants'
import { getTowerStats } from './logic'

const ENEMY_COLORS: Record<string, string> = {
  normal: '#e5e7eb',
  fast: '#9ca3af',
  tank: '#4b5563',
  boss: '#fbbf24',
}

const PROJECTILE_COLORS: Record<string, string> = {
  basic: '#66b3ff',
  sniper: '#ffffff',
  splash: '#ff6666',
  slow: '#ffff00',
}

export function render(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  hoverPos: { x: number; y: number } | null,
  hoverTowerType: TowerType | null,
  placementValid: 'money' | 'tower' | 'path' | null,
  selectedTowerId: number | null
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

  ctx.strokeStyle = '#3a3a5a'
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(PATH[0].x, PATH[0].y)
  for (let i = 1; i < PATH.length; i++) {
    ctx.lineTo(PATH[i].x, PATH[i].y)
  }
  ctx.stroke()

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
    const size = ENEMY_SIZES[enemy.type]
    if (enemy.type === 'boss') {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const px = enemy.x + size * Math.cos(angle)
        const py = enemy.y + size * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    } else if (enemy.type === 'tank') {
      ctx.fillRect(enemy.x - size, enemy.y - size, size * 2, size * 2)
    } else if (enemy.type === 'fast') {
      ctx.beginPath()
      ctx.moveTo(enemy.x, enemy.y - size)
      ctx.lineTo(enemy.x + size, enemy.y + size * 0.7)
      ctx.lineTo(enemy.x - size, enemy.y + size * 0.7)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#44ff44'
    ctx.fillRect(enemy.x - HEALTH_BAR_WIDTH / 2, enemy.y - HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH * (enemy.health / enemy.maxHealth), HEALTH_BAR_HEIGHT)
  }

  for (const proj of game.projectiles) {
    ctx.fillStyle = PROJECTILE_COLORS[proj.towerType] || '#ffff00'
    ctx.beginPath()
    ctx.arc(proj.x, proj.y, PROJECTILE_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }

  if (hoverPos && hoverTowerType) {
    const stats = TOWER_STATS[hoverTowerType]
    const canPlace = placementValid === null

    ctx.globalAlpha = 0.4
    ctx.fillStyle = canPlace ? '#22c55e' : '#ef4444'
    ctx.fillRect(hoverPos.x - CELL_SIZE / 3, hoverPos.y - CELL_SIZE / 3, CELL_SIZE / 1.5, CELL_SIZE / 1.5)
    if (!canPlace) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6
      const s = CELL_SIZE / 3
      ctx.beginPath()
      ctx.moveTo(hoverPos.x - s, hoverPos.y - s)
      ctx.lineTo(hoverPos.x + s, hoverPos.y + s)
      ctx.moveTo(hoverPos.x + s, hoverPos.y - s)
      ctx.lineTo(hoverPos.x - s, hoverPos.y + s)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.4
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

  if (selectedTowerId) {
    const tower = game.towers.find(t => t.id === selectedTowerId)
    if (tower) {
      const stats = getTowerStats(tower)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
}
