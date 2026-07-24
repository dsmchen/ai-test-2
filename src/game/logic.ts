import { GameState, Tower, EnemyType, Difficulty } from './types'
import { PATH, ENEMY_STATS, TOWER_STATS, CELL_SIZE, STARTING_MONEY, STARTING_LIVES, UPGRADE_COST, UPGRADE_MULTIPLIER, DIFFICULTY_MULTIPLIER, TOTAL_WAVES, SPLASH_RADIUS, SLOW_FACTOR, SLOW_DURATION, PATH_CLEARANCE, SELL_RATIO, PROJECTILE_HIT_DIST, getEnemiesPerWave, getWaveHealthMultiplier, getWaveSpeedMultiplier, getBossHealthMultiplier } from './constants'

let nextId = 1
function generateId(): number {
  return nextId++
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay))
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const closestX = ax + t * dx
  const closestY = ay + t * dy
  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY))
}

export function getTowerStats(tower: Tower) {
  const base = TOWER_STATS[tower.type]
  const mult = UPGRADE_MULTIPLIER[tower.level - 1]
  return {
    damage: base.damage * mult,
    range: base.range * mult,
    fireRate: base.fireRate / mult,
    cost: base.cost,
  }
}

export function createInitialState(): GameState {
  return {
    towers: [],
    enemies: [],
    projectiles: [],
    money: STARTING_MONEY,
    lives: STARTING_LIVES,
    wave: 1,
    lastSpawn: 0,
    enemiesSpawned: 0,
    waveStarted: false,
    lastTimestamp: 0,
    deltaTime: 0,
    gameSpeed: 1,
    paused: false,
  }
}

export function spawnEnemy(game: GameState, difficulty: Difficulty = 'medium') {
  const enemiesPerWave = getEnemiesPerWave(game.wave)
  if (!game.waveStarted || game.enemiesSpawned >= enemiesPerWave) return

  const types: EnemyType[] = ['normal', 'fast', 'tank']
  const bossCount = game.wave >= TOTAL_WAVES - 2 ? game.wave - (TOTAL_WAVES - 3) : 0
  const isBossSlot = game.enemiesSpawned >= enemiesPerWave - bossCount
  if (isBossSlot) {
    types.length = 0
    types.push('boss')
  }
  const type = types[Math.floor(Math.random() * types.length)]
  const stats = ENEMY_STATS[type]
  const diffMult = DIFFICULTY_MULTIPLIER[difficulty]
  const waveHealthMult = getWaveHealthMultiplier(game.wave)
  const waveSpeedMult = getWaveSpeedMultiplier(game.wave)
  const bossHealthMult = type === 'boss' ? getBossHealthMultiplier(game.wave) : 1

  game.enemies.push({
    id: generateId(),
    type,
    x: PATH[0].x,
    y: PATH[0].y,
    health: Math.round(stats.health * diffMult * waveHealthMult * bossHealthMult),
    maxHealth: Math.round(stats.health * diffMult * waveHealthMult * bossHealthMult),
    speed: stats.speed * diffMult * waveSpeedMult,
    pathIndex: 0,
    reward: Math.round(stats.reward * diffMult),
    slowUntil: 0,
  })
  game.enemiesSpawned++
}

export function canPlaceTower(game: GameState, x: number, y: number, type: Tower['type']): 'money' | 'tower' | 'path' | null {
  const stats = TOWER_STATS[type]
  if (game.money < stats.cost) return 'money'

  const tooClose = game.towers.some(t => {
    const dx = t.x - x
    const dy = t.y - y
    return Math.sqrt(dx * dx + dy * dy) < CELL_SIZE
  })
  if (tooClose) return 'tower'

  for (let i = 0; i < PATH.length - 1; i++) {
    const dist = distanceToSegment(x, y, PATH[i].x, PATH[i].y, PATH[i + 1].x, PATH[i + 1].y)
    if (dist < PATH_CLEARANCE) return 'path'
  }

  return null
}

export function placeTower(game: GameState, x: number, y: number, type: Tower['type']): boolean {
  if (canPlaceTower(game, x, y, type) !== null) return false

  const stats = TOWER_STATS[type]
  game.towers.push({
    id: generateId(),
    type,
    x,
    y,
    level: 1,
    lastFired: 0,
  })
  game.money -= stats.cost
  return true
}

export function upgradeTower(game: GameState, towerId: number): boolean {
  const tower = game.towers.find(t => t.id === towerId)
  if (!tower || tower.level >= 3) return false

  const cost = UPGRADE_COST[tower.level]
  if (game.money < cost) return false

  game.money -= cost
  tower.level++
  return true
}

export function sellTower(game: GameState, towerId: number): boolean {
  const towerIndex = game.towers.findIndex(t => t.id === towerId)
  if (towerIndex === -1) return false

  const tower = game.towers[towerIndex]
  const refund = getSellValue(tower)
  game.money += refund
  game.towers.splice(towerIndex, 1)
  return true
}

export function getSellValue(tower: Tower): number {
  const baseCost = TOWER_STATS[tower.type].cost
  let totalUpgradeCost = 0
  for (let i = 1; i < tower.level; i++) {
    totalUpgradeCost += UPGRADE_COST[i]
  }
  return Math.round((baseCost + totalUpgradeCost) * SELL_RATIO)
}

export function updateEnemies(game: GameState, timestamp: number) {
  const dt = game.deltaTime * game.gameSpeed
  for (const enemy of game.enemies) {
    if (enemy.pathIndex < PATH.length - 1) {
      const target = PATH[enemy.pathIndex + 1]
      const dx = target.x - enemy.x
      const dy = target.y - enemy.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const effectiveSpeed = enemy.speed * (timestamp < enemy.slowUntil ? SLOW_FACTOR : 1)
      const moveAmount = effectiveSpeed * dt * 0.06
      if (dist < moveAmount) {
        enemy.pathIndex++
      } else {
        enemy.x += (dx / dist) * moveAmount
        enemy.y += (dy / dist) * moveAmount
      }
    } else {
      game.lives--
      enemy.health = 0
    }
  }
  game.enemies = game.enemies.filter(e => e.health > 0)
}

export function updateTowers(game: GameState, timestamp: number) {
  for (const tower of game.towers) {
    const stats = getTowerStats(tower)
    if (timestamp - tower.lastFired > stats.fireRate / game.gameSpeed) {
      for (const enemy of game.enemies) {
        const dx = enemy.x - tower.x
        const dy = enemy.y - tower.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist <= stats.range) {
          game.projectiles.push({
            id: generateId(),
            x: tower.x,
            y: tower.y,
            targetId: enemy.id,
            damage: stats.damage,
            speed: 5,
            splashRadius: tower.type === 'splash' ? SPLASH_RADIUS : undefined,
            slowFactor: tower.type === 'slow' ? SLOW_FACTOR : undefined,
            towerType: tower.type,
          })
          tower.lastFired = timestamp
          break
        }
      }
    }
  }
}

export function updateProjectiles(game: GameState) {
  const dt = game.deltaTime * game.gameSpeed
  for (const proj of game.projectiles) {
    const target = game.enemies.find(e => e.id === proj.targetId)
    if (target) {
      const dx = target.x - proj.x
      const dy = target.y - proj.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < PROJECTILE_HIT_DIST) {
        if (proj.splashRadius) {
          for (const enemy of game.enemies) {
            const edx = enemy.x - target.x
            const edy = enemy.y - target.y
            const edist = Math.sqrt(edx * edx + edy * edy)
            if (edist <= proj.splashRadius) {
              enemy.health -= proj.damage
              if (enemy.health <= 0) {
                game.money += enemy.reward
              }
              if (proj.slowFactor && game.lastTimestamp) {
                enemy.slowUntil = game.lastTimestamp + SLOW_DURATION
              }
            }
          }
        } else {
          target.health -= proj.damage
          if (target.health <= 0) {
            game.money += target.reward
          }
          if (proj.slowFactor && game.lastTimestamp) {
            target.slowUntil = game.lastTimestamp + SLOW_DURATION
          }
        }
        proj.x = -100
      } else {
        const moveSpeed = proj.speed * dt * 0.06
        proj.x += (dx / dist) * moveSpeed
        proj.y += (dy / dist) * moveSpeed
      }
    } else {
      proj.x = -100
    }
  }
  game.projectiles = game.projectiles.filter(p => p.x > -50)
}

export function checkWaveComplete(game: GameState): boolean {
  const enemiesPerWave = getEnemiesPerWave(game.wave)
  if (game.enemies.length === 0 && game.enemiesSpawned >= enemiesPerWave) {
    if (game.wave < TOTAL_WAVES) {
      game.wave++
      game.enemiesSpawned = 0
      game.waveStarted = false
      return false
    }
    return true
  }
  return false
}

export function checkGameOver(game: GameState): boolean {
  return game.lives <= 0
}
