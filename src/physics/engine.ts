import { Disc, PlayerDisc, PlayerInput, Stadium, Vector2D } from '../types/haxball';

export const PHYSICS_CONFIG = {
  playerAcceleration: 0.55,
  playerDamping: 0.88, // Moderate, well-controlled movement
  playerMass: 1.0,
  playerBounciness: 0.4,
  
  ballDamping: 0.985,
  ballMass: 0.5,
  ballBounciness: 0.5, // Controlled, realistic bounciness
  
  kickMargin: 6, // Distance allowance for kicking
  kickForce: 7.5, // Default base impulse force
  
  maxPlayerSpeed: 4.0, // Natural tactical running speed
  pushingMaxPlayerSpeed: 2.7, // Speed when pushing/dribbling ball
  maxBallSpeed: 22.0, // Top speed allowance for passes and shots
};

export interface PhysicsStepResult {
  goalScored?: 'red' | 'blue';
  kickedPlayerId?: string;
  bounceSound?: boolean;
}

export class PhysicsEngine {
  stadium: Stadium;
  ball: Disc;
  players: Map<string, PlayerDisc>;
  lastTouchPlayerId?: string;

  constructor(stadium: Stadium) {
    this.stadium = stadium;
    this.ball = this.createDefaultBall();
    this.players = new Map();
  }

  setStadium(stadium: Stadium) {
    this.stadium = stadium;
    this.resetBall();
  }

  createDefaultBall(): Disc {
    return {
      x: this.stadium.ballSpawn.x,
      y: this.stadium.ballSpawn.y,
      vx: 0,
      vy: 0,
      radius: this.stadium.ballRadius,
      invMass: 1 / PHYSICS_CONFIG.ballMass,
      damping: PHYSICS_CONFIG.ballDamping,
      bounciness: PHYSICS_CONFIG.ballBounciness,
      spin: 0,
    };
  }

  resetBall() {
    this.ball.x = this.stadium.ballSpawn.x;
    this.ball.y = this.stadium.ballSpawn.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.spin = 0;
  }

  addPlayer(id: string, name: string, team: 'red' | 'blue' | 'spec', avatar: string = ''): PlayerDisc {
    const spawnPos = team === 'red' ? this.stadium.redSpawn : this.stadium.blueSpawn;
    const player: PlayerDisc = {
      id,
      name,
      team,
      avatar,
      x: spawnPos.x,
      y: spawnPos.y + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      radius: this.stadium.playerRadius,
      invMass: 1 / PHYSICS_CONFIG.playerMass,
      damping: PHYSICS_CONFIG.playerDamping,
      bounciness: PHYSICS_CONFIG.playerBounciness,
      kicking: false,
    };
    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  resetPlayersToSpawns() {
    let redIndex = 0;
    let blueIndex = 0;
    this.players.forEach((player) => {
      if (player.team === 'red') {
        player.x = this.stadium.redSpawn.x - (redIndex % 3) * 30;
        player.y = this.stadium.redSpawn.y + Math.floor(redIndex / 3) * 40 - 20;
        player.vx = 0;
        player.vy = 0;
        redIndex++;
      } else if (player.team === 'blue') {
        player.x = this.stadium.blueSpawn.x + (blueIndex % 3) * 30;
        player.y = this.stadium.blueSpawn.y + Math.floor(blueIndex / 3) * 40 - 20;
        player.vx = 0;
        player.vy = 0;
        blueIndex++;
      }
    });
  }

  applyPlayerInput(id: string, input: PlayerInput): boolean {
    const player = this.players.get(id);
    if (!player || player.team === 'spec') return false;

    // Reset lock when user releases space (kick is false)
    if (!input.kick) {
      player.kickLocked = false;
    }

    player.currentInput = { ...input };

    // If kick is locked (already kicked without releasing space), ignore kick input
    if (player.kickLocked) {
      player.currentInput.kick = false;
      player.kicking = false;
      return false;
    }

    player.kicking = input.kick;

    let didKick = false;
    if (input.kick) {
      didKick = this.tryKick(player);
      if (didKick) {
        // Successful kick! Lock kick input & un-space player
        player.kickLocked = true;
        player.kicking = false;
        player.currentInput.kick = false;
      }
    }
    return didKick;
  }

  tryKick(player: PlayerDisc): boolean {
    if (player.kickLocked) return false;

    const dx = this.ball.x - player.x;
    const dy = this.ball.y - player.y;
    const dist = Math.hypot(dx, dy);
    const minKickDist = player.radius + this.ball.radius + PHYSICS_CONFIG.kickMargin;

    if (dist <= minKickDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      const power = Math.min(1.0, Math.max(0.0, player.currentInput?.kickPower ?? 0.0));
      // Balanced pass range: 5.5 for quick tap to 14.0 for full-power shot
      const kickForce = 5.5 + 8.5 * power;

      // Apply kick impulse to ball
      this.ball.vx = player.vx * 0.35 + nx * kickForce;
      this.ball.vy = player.vy * 0.35 + ny * kickForce;

      // Calculate normal spin ONLY when curve keys are held
      const curveLeft = player.currentInput?.curveLeft ?? false;
      const curveRight = player.currentInput?.curveRight ?? false;

      let spinMagnitude = 0;
      if (curveLeft && !curveRight) {
        spinMagnitude = -2.0 * (0.8 + 0.5 * power);
      } else if (curveRight && !curveLeft) {
        spinMagnitude = 2.0 * (0.8 + 0.5 * power);
      } else {
        spinMagnitude = 0;
      }

      this.ball.spin = spinMagnitude;

      this.lastTouchPlayerId = player.id;
      return true;
    }
    return false;
  }

  sanitizeDisc(disc: Disc, fallbackX: number, fallbackY: number) {
    if (isNaN(disc.x) || isNaN(disc.y) || !isFinite(disc.x) || !isFinite(disc.y)) {
      disc.x = fallbackX;
      disc.y = fallbackY;
      disc.vx = 0;
      disc.vy = 0;
    }
    if (isNaN(disc.vx) || !isFinite(disc.vx)) disc.vx = 0;
    if (isNaN(disc.vy) || !isFinite(disc.vy)) disc.vy = 0;
    if (disc.spin !== undefined && (isNaN(disc.spin) || !isFinite(disc.spin))) disc.spin = 0;
  }

  enforceHardPitchBounds(disc: Disc) {
    const p = this.stadium.pitchRect;
    const rad = disc.radius;
    const redG = this.stadium.redGoal;
    const blueG = this.stadium.blueGoal;

    const bounceMult = disc === this.ball ? disc.bounciness * 0.5 : disc.bounciness * 0.6;

    // Top wall clamp
    if (disc.y < p.top + rad) {
      disc.y = p.top + rad;
      if (disc.vy < 0) disc.vy *= -bounceMult;
    }
    // Bottom wall clamp
    if (disc.y > p.bottom - rad) {
      disc.y = p.bottom - rad;
      if (disc.vy > 0) disc.vy *= -bounceMult;
    }

    // Left wall / Red Goal Area clamp
    const inLeftGoalY = disc.y >= redG.p0.y - rad && disc.y <= redG.p1.y + rad;
    if (inLeftGoalY) {
      const minX = p.left - this.stadium.goalDepth + rad;
      if (disc.x < minX) {
        disc.x = minX;
        if (disc.vx < 0) disc.vx *= -bounceMult;
      }
    } else {
      if (disc.x < p.left + rad) {
        disc.x = p.left + rad;
        if (disc.vx < 0) disc.vx *= -bounceMult;
      }
    }

    // Right wall / Blue Goal Area clamp
    const inRightGoalY = disc.y >= blueG.p0.y - rad && disc.y <= blueG.p1.y + rad;
    if (inRightGoalY) {
      const maxX = p.right + this.stadium.goalDepth - rad;
      if (disc.x > maxX) {
        disc.x = maxX;
        if (disc.vx > 0) disc.vx *= -bounceMult;
      }
    } else {
      if (disc.x > p.right - rad) {
        disc.x = p.right - rad;
        if (disc.vx > 0) disc.vx *= -bounceMult;
      }
    }
  }

  step(): PhysicsStepResult {
    let bounceSound = false;
    let kickedPlayerId: string | undefined;

    const SUB_STEPS = 2;
    const playerArray = Array.from(this.players.values()).filter((p) => p.team !== 'spec');

    for (let sub = 0; sub < SUB_STEPS; sub++) {
      // 1. Move players & apply input + acceleration + damping
      this.players.forEach((player) => {
        if (player.team === 'spec') return;

        // Check if player is touching/pushing the ball
        const dx = this.ball.x - player.x;
        const dy = this.ball.y - player.y;
        const dist = Math.hypot(dx, dy);
        const touchDist = player.radius + this.ball.radius + 3.0;
        const isTouchingBall = dist <= touchDist && dist > 0;

        let isPushingBall = false;
        if (isTouchingBall) {
          const nx = dx / dist;
          const ny = dy / dist;
          const dotVel = player.vx * nx + player.vy * ny;
          if (dotVel > -0.5) {
            isPushingBall = true;
          }
        }

        const accel = (isPushingBall
          ? PHYSICS_CONFIG.playerAcceleration * 0.65
          : PHYSICS_CONFIG.playerAcceleration) / SUB_STEPS;
        const maxSpeed = isPushingBall
          ? PHYSICS_CONFIG.pushingMaxPlayerSpeed
          : PHYSICS_CONFIG.maxPlayerSpeed;

        if (player.currentInput) {
          if (!player.currentInput.kick) {
            player.kickLocked = false;
          }

          if (player.kickLocked) {
            player.currentInput.kick = false;
            player.kicking = false;
          } else {
            player.kicking = player.currentInput.kick;
          }

          let moveX = 0;
          let moveY = 0;
          if (player.currentInput.left) moveX -= 1;
          if (player.currentInput.right) moveX += 1;
          if (player.currentInput.up) moveY -= 1;
          if (player.currentInput.down) moveY += 1;

          if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
          }

          player.vx += moveX * accel;
          player.vy += moveY * accel;

          if (player.currentInput.kick && !player.kickLocked && sub === 0) {
            if (this.tryKick(player)) {
              kickedPlayerId = player.id;
              player.kickLocked = true;
              player.kicking = false;
              player.currentInput.kick = false;
            }
          }
        }

        const speed = Math.hypot(player.vx, player.vy);
        if (speed > maxSpeed) {
          player.vx = (player.vx / speed) * maxSpeed;
          player.vy = (player.vy / speed) * maxSpeed;
        }

        player.x += player.vx / SUB_STEPS;
        player.y += player.vy / SUB_STEPS;
        player.vx *= Math.pow(PHYSICS_CONFIG.playerDamping, 1 / SUB_STEPS);
        player.vy *= Math.pow(PHYSICS_CONFIG.playerDamping, 1 / SUB_STEPS);

        const spawnPos = player.team === 'red' ? this.stadium.redSpawn : this.stadium.blueSpawn;
        this.sanitizeDisc(player, spawnPos.x, spawnPos.y);
      });

      // 2. Move ball & apply curve (Magnus effect) + damping
      const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy);
      if (ballSpeed > PHYSICS_CONFIG.maxBallSpeed) {
        this.ball.vx = (this.ball.vx / ballSpeed) * PHYSICS_CONFIG.maxBallSpeed;
        this.ball.vy = (this.ball.vy / ballSpeed) * PHYSICS_CONFIG.maxBallSpeed;
      }

      // Gentle aftertouch steering during ball flight
      if (this.lastTouchPlayerId && ballSpeed > 2.0) {
        const lastPlayer = this.players.get(this.lastTouchPlayerId);
        if (lastPlayer && lastPlayer.currentInput) {
          if (lastPlayer.currentInput.curveLeft && !lastPlayer.currentInput.curveRight) {
            this.ball.spin = Math.max(-2.8, (this.ball.spin || 0) - 0.06 / SUB_STEPS);
          } else if (lastPlayer.currentInput.curveRight && !lastPlayer.currentInput.curveLeft) {
            this.ball.spin = Math.min(2.8, (this.ball.spin || 0) + 0.06 / SUB_STEPS);
          }
        }
      }

      if (this.ball.spin && Math.abs(this.ball.spin) > 0.01) {
        if (ballSpeed > 0.4) {
          const perpX = -this.ball.vy / ballSpeed;
          const perpY = this.ball.vx / ballSpeed;

          // Realistic aerodynamic bending force curve
          const curveForce = (this.ball.spin * 0.015 * Math.sqrt(ballSpeed)) / SUB_STEPS;

          this.ball.vx += perpX * curveForce;
          this.ball.vy += perpY * curveForce;
        }

        this.ball.spin *= Math.pow(0.975, 1 / SUB_STEPS);
        if (Math.abs(this.ball.spin) < 0.005) {
          this.ball.spin = 0;
        }
      }

      this.ball.x += this.ball.vx / SUB_STEPS;
      this.ball.y += this.ball.vy / SUB_STEPS;
      this.ball.vx *= Math.pow(this.ball.damping, 1 / SUB_STEPS);
      this.ball.vy *= Math.pow(this.ball.damping, 1 / SUB_STEPS);

      this.sanitizeDisc(this.ball, this.stadium.ballSpawn.x, this.stadium.ballSpawn.y);

      // 3. Multi-iteration Collision Resolution (Gauss-Seidel relaxation prevents wall pinch phase-through)
      const ITERATIONS = 3;
      for (let iter = 0; iter < ITERATIONS; iter++) {
        // Player vs Player collisions
        for (let i = 0; i < playerArray.length; i++) {
          for (let j = i + 1; j < playerArray.length; j++) {
            if (this.resolveDiscCollision(playerArray[i], playerArray[j])) {
              bounceSound = true;
            }
          }
        }

        // Player vs Ball collisions
        for (const player of playerArray) {
          if (this.resolveDiscCollision(player, this.ball)) {
            this.lastTouchPlayerId = player.id;
            bounceSound = true;
          }
        }

        // Segment wall collisions
        for (const seg of this.stadium.segments) {
          if (this.resolveSegmentCollision(this.ball, seg)) bounceSound = true;
          for (const player of playerArray) {
            this.resolveSegmentCollision(player, seg);
          }
        }

        // Post collisions
        for (const post of this.stadium.posts) {
          if (this.resolvePostCollision(this.ball, post)) bounceSound = true;
          for (const player of playerArray) {
            this.resolvePostCollision(player, post);
          }
        }

        // Hard pitch boundary enforcement (Absolute physical barrier against wall pinching)
        this.enforceHardPitchBounds(this.ball);
        for (const player of playerArray) {
          this.enforceHardPitchBounds(player);
        }
      }
    }

    // 4. Check goal scored
    const goalScored = this.checkGoal();

    return {
      goalScored,
      kickedPlayerId,
      bounceSound,
    };
  }

  resolveDiscCollision(d1: Disc, d2: Disc): boolean {
    const dx = d2.x - d1.x;
    const dy = d2.y - d1.y;
    let dist = Math.hypot(dx, dy);
    const minDist = d1.radius + d2.radius;

    if (dist < minDist) {
      let nx = 0;
      let ny = 0;
      if (dist > 0.0001) {
        nx = dx / dist;
        ny = dy / dist;
      } else {
        nx = 1;
        ny = 0;
        dist = 0.0001;
      }

      const overlap = minDist - dist;
      const totalInvMass = d1.invMass + d2.invMass;
      if (totalInvMass === 0) return false;

      d1.x -= nx * overlap * (d1.invMass / totalInvMass);
      d1.y -= ny * overlap * (d1.invMass / totalInvMass);
      d2.x += nx * overlap * (d2.invMass / totalInvMass);
      d2.y += ny * overlap * (d2.invMass / totalInvMass);

      const rvx = d2.vx - d1.vx;
      const rvy = d2.vy - d1.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const restitution = Math.min(d1.bounciness, d2.bounciness);
        const impulseMagnitude = -(1 + restitution) * velAlongNormal / totalInvMass;

        d1.vx -= impulseMagnitude * nx * d1.invMass;
        d1.vy -= impulseMagnitude * ny * d1.invMass;
        d2.vx += impulseMagnitude * nx * d2.invMass;
        d2.vy += impulseMagnitude * ny * d2.invMass;
        return true;
      }
    }
    return false;
  }

  resolveSegmentCollision(disc: Disc, seg: { p0: Vector2D; p1: Vector2D; bounciness: number }): boolean {
    const vx = seg.p1.x - seg.p0.x;
    const vy = seg.p1.y - seg.p0.y;
    const lenSq = vx * vx + vy * vy;
    if (lenSq === 0) return false;

    let t = ((disc.x - seg.p0.x) * vx + (disc.y - seg.p0.y) * vy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = seg.p0.x + t * vx;
    const closestY = seg.p0.y + t * vy;

    const dx = disc.x - closestX;
    const dy = disc.y - closestY;
    let dist = Math.hypot(dx, dy);

    if (dist < disc.radius) {
      let nx = 0;
      let ny = 0;

      if (dist > 0.0001) {
        nx = dx / dist;
        ny = dy / dist;
      } else {
        const len = Math.sqrt(lenSq);
        nx = -vy / len;
        ny = vx / len;
        dist = 0;
      }

      const overlap = disc.radius - dist;

      disc.x += nx * overlap;
      disc.y += ny * overlap;

      const dot = disc.vx * nx + disc.vy * ny;
      if (dot < 0) {
        const restitution = disc.bounciness * seg.bounciness;
        disc.vx -= (1 + restitution) * dot * nx;
        disc.vy -= (1 + restitution) * dot * ny;
        if (disc === this.ball) {
          disc.spin = (disc.spin || 0) * -0.3;
        }
        return true;
      }
    }
    return false;
  }

  resolvePostCollision(disc: Disc, post: { x: number; y: number; radius: number; bounciness: number }): boolean {
    const postDisc: Disc = {
      x: post.x,
      y: post.y,
      vx: 0,
      vy: 0,
      radius: post.radius,
      invMass: 0,
      damping: 1,
      bounciness: post.bounciness,
    };
    return this.resolveDiscCollision(disc, postDisc);
  }

  checkGoal(): 'red' | 'blue' | undefined {
    const ball = this.ball;
    const redGoal = this.stadium.redGoal;
    const blueGoal = this.stadium.blueGoal;

    if (
      ball.x < redGoal.p0.x - ball.radius &&
      ball.y > redGoal.p0.y &&
      ball.y < redGoal.p1.y
    ) {
      return 'blue';
    }

    if (
      ball.x > blueGoal.p0.x + ball.radius &&
      ball.y > blueGoal.p0.y &&
      ball.y < blueGoal.p1.y
    ) {
      return 'red';
    }

    return undefined;
  }
}

