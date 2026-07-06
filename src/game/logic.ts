import { GameState, Tower, EnemyType, Difficulty } from './types'
import { PATH, ENEMY_STATS, ENEMIES_PER_WAVE, TOWER_STATS, CELL_SIZE, STARTING_MONEY, STARTING_LIVES, UPGRADE_COST, UPGRADE_MULTIPLIER, DIFFICULTY_MULTIPLIER } from './constants'

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
    animationId: 0,
  }
}

export function spawnEnemy(game: GameState, difficulty: Difficulty = 'medium') {
  if (!game.waveStarted || game.enemiesSpawned >= ENEMIES_PER_WAVE) return

  const types: EnemyType[] = ['normal', 'fast', 'tank']
  if (game.wave === 3 && game.enemiesSpawned === ENEMIES_PER_WAVE - 1) {
    types.push('boss')
  }
  const type = types[Math.floor(Math.random() * types.length)]
  const stats = ENEMY_STATS[type]
  const mult = DIFFICULTY_MULTIPLIER[difficulty]

  game.enemies.push({
    id: Date.now() + Math.random(),
    type,
    x: PATH[0].x,
    y: PATH[0].y,
    health: stats.health * mult,
    maxHealth: stats.health * mult,
    speed: stats.speed * mult,
    pathIndex: 0,
    reward: Math.round(stats.reward * mult),
  })
  game.enemiesSpawned++
}

export function placeTower(game: GameState, x: number, y: number, type: Tower['type']): boolean {
  const stats = TOWER_STATS[type]
  if (game.money < stats.cost) return false

  const tooClose = game.towers.some(t => {
    const dx = t.x - x
    const dy = t.y - y
    return Math.sqrt(dx * dx + dy * dy) < CELL_SIZE
  })
  if (tooClose) return false

  game.towers.push({
    id: Date.now(),
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

export function updateEnemies(game: GameState) {
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
      enemy.health = 0
    }
  }
  game.enemies = game.enemies.filter(e => e.health > 0)
}

export function updateTowers(game: GameState, timestamp: number) {
  for (const tower of game.towers) {
    const stats = getTowerStats(tower)
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
}

export function updateProjectiles(game: GameState) {
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
}

export function checkWaveComplete(game: GameState): boolean {
  if (game.enemies.length === 0 && game.enemiesSpawned >= ENEMIES_PER_WAVE) {
    if (game.wave < 3) {
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
