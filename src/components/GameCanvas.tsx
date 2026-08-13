import React, { useEffect, useRef, useState } from 'react';
import { Camera, Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import { Disc, GameSnapshot, PlayerDisc, Stadium } from '../types/haxball';
import { getSocket } from '../lib/socket';
import { PHYSICS_CONFIG } from '../physics/engine';

interface GameCanvasProps {
  stadium: Stadium;
  snapshot: GameSnapshot | null;
  localPlayerId: string;
}

/**
 * Linear interpolation (lerp) helper.
 * Smoothly transitions from start to end based on weight t (clamped 0..1).
 */
const lerp = (start: number, end: number, t: number): number => {
  const clampedT = Math.max(0, Math.min(1, t));
  return start + (end - start) * clampedT;
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stadium,
  snapshot,
  localPlayerId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraMode, setCameraMode] = useState<'full' | 'player' | 'ball'>('full');
  const [zoomLevel, setZoomLevel] = useState<number>(1.2);

  // Smooth local prediction & interpolation refs
  const interpolatedBall = useRef<Disc | null>(null);
  const interpolatedPlayers = useRef<Record<string, PlayerDisc>>({});
  const lastFrameTimeRef = useRef<number>(performance.now());
  const cameraPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const ballAngleRef = useRef<number>(0);
  const ballTrailRef = useRef<Array<{ x: number; y: number; spin: number }>>([]);

  // Input state
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    kick: false,
    kickPower: 0,
    curveLeft: false,
    curveRight: false,
  });
  const kickReleasedRef = useRef(true);
  const kickStartTimeRef = useRef(0);

  // Attach key listeners & continuous heartbeat
  useEffect(() => {
    const sendInput = () => {
      if (inputRef.current.kick && kickStartTimeRef.current > 0) {
        const holdDuration = Math.max(0, performance.now() - kickStartTimeRef.current);
        inputRef.current.kickPower = Math.min(1.0, holdDuration / 700);
      } else {
        inputRef.current.kickPower = 0;
      }
      const socket = getSocket();
      socket.emit('player_input', inputRef.current);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Blur any focused UI button so space/keys don't trigger clicks on it
      if (
        document.activeElement &&
        document.activeElement !== document.body &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        (document.activeElement as HTMLElement).blur();
      }

      let changed = false;
      const key = e.key.toLowerCase();
      const isGameKey = [' ', 'w', 'a', 's', 'd', 'q', 'e', 'z', 'c', 'x', 'k', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'control'].includes(key);

      if (isGameKey) {
        e.preventDefault();
      }

      if (key === 'w' || key === 'arrowup') {
        if (!inputRef.current.up) { inputRef.current.up = true; changed = true; }
      }
      if (key === 's' || key === 'arrowdown') {
        if (!inputRef.current.down) { inputRef.current.down = true; changed = true; }
      }
      if (key === 'a' || key === 'arrowleft') {
        if (!inputRef.current.left) { inputRef.current.left = true; changed = true; }
      }
      if (key === 'd' || key === 'arrowright') {
        if (!inputRef.current.right) { inputRef.current.right = true; changed = true; }
      }
      if (key === 'q' || key === 'z' || key === ',' || key === 'shift') {
        if (!inputRef.current.curveLeft) { inputRef.current.curveLeft = true; changed = true; }
      }
      if (key === 'e' || key === 'c' || key === '.' || key === 'control') {
        if (!inputRef.current.curveRight) { inputRef.current.curveRight = true; changed = true; }
      }
      if (key === ' ' || key === 'x' || key === 'k') {
        if (kickReleasedRef.current) {
          kickStartTimeRef.current = performance.now();
          if (!inputRef.current.kick) {
            inputRef.current.kick = true;
            inputRef.current.kickPower = 0;
            changed = true;
          }
          kickReleasedRef.current = false;
        }
      }

      if (changed) {
        sendInput();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      let changed = false;
      const key = e.key.toLowerCase();
      const isGameKey = [' ', 'w', 'a', 's', 'd', 'q', 'e', 'z', 'c', 'x', 'k', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'control'].includes(key);

      if (isGameKey) {
        e.preventDefault();
      }

      if (key === 'w' || key === 'arrowup') {
        if (inputRef.current.up) { inputRef.current.up = false; changed = true; }
      }
      if (key === 's' || key === 'arrowdown') {
        if (inputRef.current.down) { inputRef.current.down = false; changed = true; }
      }
      if (key === 'a' || key === 'arrowleft') {
        if (inputRef.current.left) { inputRef.current.left = false; changed = true; }
      }
      if (key === 'd' || key === 'arrowright') {
        if (inputRef.current.right) { inputRef.current.right = false; changed = true; }
      }
      if (key === 'q' || key === 'z' || key === ',' || key === 'shift') {
        if (inputRef.current.curveLeft) { inputRef.current.curveLeft = false; changed = true; }
      }
      if (key === 'e' || key === 'c' || key === '.' || key === 'control') {
        if (inputRef.current.curveRight) { inputRef.current.curveRight = false; changed = true; }
      }
      if (key === ' ' || key === 'x' || key === 'k') {
        kickReleasedRef.current = true;
        kickStartTimeRef.current = 0;
        if (inputRef.current.kick) {
          inputRef.current.kick = false;
          inputRef.current.kickPower = 0;
          changed = true;
        }
      }

      if (changed) {
        sendInput();
      }
    };

    // Heartbeat input sending every 16ms (~60Hz) while keys are held for zero input lag
    const timer = setInterval(() => {
      if (
        inputRef.current.up ||
        inputRef.current.down ||
        inputRef.current.left ||
        inputRef.current.right ||
        inputRef.current.kick
      ) {
        sendInput();
      }
    }, 16);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update interpolation targets when snapshot arrives
  useEffect(() => {
    if (!snapshot) return;

    if (!interpolatedBall.current) {
      interpolatedBall.current = { ...snapshot.ball };
    }

    Object.entries(snapshot.players).forEach(([id, p]) => {
      if (!interpolatedPlayers.current[id]) {
        interpolatedPlayers.current[id] = { ...(p as PlayerDisc) };
      }
    });
  }, [snapshot]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match parent container width and full height
      const dpr = window.devicePixelRatio || 1;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const targetWidth = rect.width;
        const targetHeight = rect.height;

        if (canvas.width !== targetWidth * dpr || canvas.height !== targetHeight * dpr) {
          canvas.width = targetWidth * dpr;
          canvas.height = targetHeight * dpr;
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const viewW = canvas.width / dpr;
      const viewH = canvas.height / dpr;

      ctx.clearRect(0, 0, viewW, viewH);

      // Frame delta time calculation for frame-rate independent lerp
      const now = performance.now();
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      // Exponential decay alpha factors based on dt
      const playerLerpFactor = 1 - Math.exp(-22 * dt); // smooth ~22Hz rate for remote players
      const localReconcileFactor = 1 - Math.exp(-12 * dt); // gentle reconciliation for local player
      const ballLerpFactor = 1 - Math.exp(-25 * dt); // responsive ball interpolation

      // Local prediction for local player
      if (localPlayerId && interpolatedPlayers.current[localPlayerId]) {
        const localP = interpolatedPlayers.current[localPlayerId];
        const ballP = interpolatedBall.current;

        let isPushingBall = false;
        if (ballP) {
          const dx = ballP.x - localP.x;
          const dy = ballP.y - localP.y;
          const dist = Math.hypot(dx, dy);
          const touchDist = localP.radius + ballP.radius + 3.0;
          if (dist <= touchDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dotVel = localP.vx * nx + localP.vy * ny;
            if (dotVel > -0.5) {
              isPushingBall = true;
            }
          }
        }

        const accel = isPushingBall
          ? PHYSICS_CONFIG.playerAcceleration * 0.65
          : PHYSICS_CONFIG.playerAcceleration;
        const maxSpeed = isPushingBall
          ? PHYSICS_CONFIG.pushingMaxPlayerSpeed
          : PHYSICS_CONFIG.maxPlayerSpeed;

        let moveX = 0;
        let moveY = 0;
        if (inputRef.current.left) moveX -= 1;
        if (inputRef.current.right) moveX += 1;
        if (inputRef.current.up) moveY -= 1;
        if (inputRef.current.down) moveY += 1;

        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.7071;
          moveY *= 0.7071;
        }

        localP.vx += moveX * accel;
        localP.vy += moveY * accel;

        const spd = Math.hypot(localP.vx, localP.vy);
        if (spd > maxSpeed) {
          localP.vx = (localP.vx / spd) * maxSpeed;
          localP.vy = (localP.vy / spd) * maxSpeed;
        }

        localP.x += localP.vx;
        localP.y += localP.vy;
        localP.vx *= PHYSICS_CONFIG.playerDamping;
        localP.vy *= PHYSICS_CONFIG.playerDamping;
        localP.kicking = inputRef.current.kick;
      }

      // Linear interpolation for all discs towards latest server snapshot
      if (snapshot) {
        if (interpolatedBall.current) {
          interpolatedBall.current.x = lerp(interpolatedBall.current.x, snapshot.ball.x, ballLerpFactor);
          interpolatedBall.current.y = lerp(interpolatedBall.current.y, snapshot.ball.y, ballLerpFactor);
          interpolatedBall.current.vx = lerp(interpolatedBall.current.vx, snapshot.ball.vx, ballLerpFactor);
          interpolatedBall.current.vy = lerp(interpolatedBall.current.vy, snapshot.ball.vy, ballLerpFactor);
        }

        Object.entries(snapshot.players).forEach(([id, serverP]) => {
          const sp = serverP as PlayerDisc;
          let curr = interpolatedPlayers.current[id];
          if (!curr) {
            interpolatedPlayers.current[id] = { ...sp };
            curr = interpolatedPlayers.current[id];
          }

          if (id === localPlayerId) {
            // Reconcile local prediction smoothly with server snapshot using lerp
            curr.x = lerp(curr.x, sp.x, localReconcileFactor);
            curr.y = lerp(curr.y, sp.y, localReconcileFactor);
            curr.vx = lerp(curr.vx, sp.vx, localReconcileFactor);
            curr.vy = lerp(curr.vy, sp.vy, localReconcileFactor);
          } else {
            // Smooth linear interpolation for remote players based on snapshot data
            curr.x = lerp(curr.x, sp.x, playerLerpFactor);
            curr.y = lerp(curr.y, sp.y, playerLerpFactor);
            curr.vx = lerp(curr.vx, sp.vx, playerLerpFactor);
            curr.vy = lerp(curr.vy, sp.vy, playerLerpFactor);
          }
          curr.team = sp.team;
          curr.name = sp.name;
          curr.avatar = sp.avatar;
          curr.kicking = sp.kicking;
          if (id === localPlayerId && sp.kickLocked) {
            inputRef.current.kick = false;
            inputRef.current.kickPower = 0;
            kickStartTimeRef.current = 0;
          }
        });

        Object.keys(interpolatedPlayers.current).forEach((id) => {
          if (!snapshot.players[id]) {
            delete interpolatedPlayers.current[id];
          }
        });
      }

      // Camera Transformations - Fit field snugly so pitch is huge
      const activePitchW = stadium.pitchRect.right - stadium.pitchRect.left + stadium.goalDepth * 2.2;
      const activePitchH = stadium.pitchRect.bottom - stadium.pitchRect.top + 50;

      let baseScale = Math.min(viewW / activePitchW, viewH / activePitchH);
      let scale = baseScale * zoomLevel;

      const pitchCenterX = (stadium.pitchRect.left + stadium.pitchRect.right) / 2;
      const pitchCenterY = (stadium.pitchRect.top + stadium.pitchRect.bottom) / 2;

      const localP = localPlayerId ? interpolatedPlayers.current[localPlayerId] : null;
      const ballP = interpolatedBall.current;

      let targetCamX = pitchCenterX;
      let targetCamY = pitchCenterY;

      if (cameraMode === 'player' && localP) {
        scale *= 1.25;
        targetCamX = localP.x;
        targetCamY = localP.y;
      } else if (cameraMode === 'ball' && ballP) {
        scale *= 1.25;
        targetCamX = ballP.x;
        targetCamY = ballP.y;
      }

      if (cameraMode !== 'full') {
        cameraPosRef.current.x = lerp(cameraPosRef.current.x, targetCamX, 1 - Math.exp(-15 * dt));
        cameraPosRef.current.y = lerp(cameraPosRef.current.y, targetCamY, 1 - Math.exp(-15 * dt));
      } else {
        cameraPosRef.current.x = pitchCenterX;
        cameraPosRef.current.y = pitchCenterY;
      }

      const translateX = viewW / 2 - cameraPosRef.current.x * scale;
      const translateY = viewH / 2 - cameraPosRef.current.y * scale;

      ctx.save();
      ctx.translate(translateX, translateY);
      ctx.scale(scale, scale);

      // --- DRAW PITCH BACKGROUND ---
      // Grass background
      ctx.fillStyle = '#15803D';
      ctx.fillRect(-200, -200, stadium.width + 400, stadium.height + 400);

      // Pitch stripes
      const stripeWidth = 50;
      for (let x = stadium.pitchRect.left; x < stadium.pitchRect.right; x += stripeWidth * 2) {
        ctx.fillStyle = '#166534';
        ctx.fillRect(x, stadium.pitchRect.top, stripeWidth, stadium.pitchRect.bottom - stadium.pitchRect.top);
      }

      // Pitch boundary
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        stadium.pitchRect.left,
        stadium.pitchRect.top,
        stadium.pitchRect.right - stadium.pitchRect.left,
        stadium.pitchRect.bottom - stadium.pitchRect.top
      );

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(pitchCenterX, stadium.pitchRect.top);
      ctx.lineTo(pitchCenterX, stadium.pitchRect.bottom);
      ctx.stroke();

      // Center circle & spot
      ctx.beginPath();
      ctx.arc(pitchCenterX, pitchCenterY, stadium.centerCircleRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(pitchCenterX, pitchCenterY, 5, 0, Math.PI * 2);
      ctx.fill();

      // --- DRAW GOAL NETS ---
      // Left Goal Net
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(stadium.pitchRect.left - stadium.goalDepth, stadium.redGoal.p0.y, stadium.goalDepth, stadium.goalWidth);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(stadium.pitchRect.left - stadium.goalDepth, stadium.redGoal.p0.y, stadium.goalDepth, stadium.goalWidth);

      // Right Goal Net
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fillRect(stadium.pitchRect.right, stadium.blueGoal.p0.y, stadium.goalDepth, stadium.goalWidth);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(stadium.pitchRect.right, stadium.blueGoal.p0.y, stadium.goalDepth, stadium.goalWidth);

      // Custom segments
      stadium.segments.forEach((seg) => {
        ctx.strokeStyle = seg.color || '#C7D2FE';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(seg.p0.x, seg.p0.y);
        ctx.lineTo(seg.p1.x, seg.p1.y);
        ctx.stroke();
      });

      // --- DRAW PLAYERS ---
      (Object.values(interpolatedPlayers.current) as PlayerDisc[]).forEach((p) => {
        if (p.team === 'spec') return;

        const isLocal = p.id === localPlayerId;

        // Player Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(p.x + 2, p.y + 4, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Kicking Ring
        if (p.kicking) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Disc Fill
        ctx.fillStyle = p.team === 'red' ? '#EF4444' : '#3B82F6';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Disc Border
        ctx.strokeStyle = isLocal ? '#F59E0B' : '#FFFFFF';
        ctx.lineWidth = isLocal ? 4 : 2.5;
        ctx.stroke();

        // Avatar Text / Number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.avatar || p.name.substring(0, 2).toUpperCase(), p.x, p.y);

        // Player Name Tag (Dynamic size according to name length, truncated if too long)
        const rawName = p.name || 'Player';
        const maxLen = 12;
        const displayName = rawName.length > maxLen ? rawName.substring(0, maxLen - 1) + '…' : rawName;

        ctx.font = 'bold 10px sans-serif';
        const nameWidth = ctx.measureText(displayName).width;
        const platePadding = 8;
        const plateW = Math.max(28, Math.ceil(nameWidth + platePadding * 2));
        const plateH = 16;
        const plateX = p.x - plateW / 2;
        const plateY = p.y - p.radius - 22;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(plateX, plateY, plateW, plateH, 4);
        } else {
          ctx.rect(plateX, plateY, plateW, plateH);
        }
        ctx.fill();

        ctx.strokeStyle = isLocal ? '#22FF88' : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isLocal ? '#22FF88' : '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayName, p.x, plateY + plateH / 2 + 0.5);

        // Visual Kick Power Meter above Local Player when holding kick key
        if (isLocal && (inputRef.current.kick || kickStartTimeRef.current > 0)) {
          const elapsed = kickStartTimeRef.current > 0 ? Math.max(0, performance.now() - kickStartTimeRef.current) : 0;
          const power = Math.min(1.0, elapsed / 700);

          const meterW = 60;
          const meterH = 10;
          const meterX = p.x - meterW / 2;
          const meterY = p.y - p.radius - 42;

          // Outer Box Shadow Frame
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(meterX - 2, meterY - 2, meterW + 4, meterH + 4);

          // Dark Bar Background
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(meterX, meterY, meterW, meterH);

          // Dynamic Power Bar Fill with Horizontal Linear Gradient
          const fillW = Math.max(0, (meterW - 2) * power);
          if (fillW > 0) {
            const gradient = ctx.createLinearGradient(meterX, meterY, meterX + meterW, meterY);
            gradient.addColorStop(0, '#06B6D4'); // Cyan start (0%)
            gradient.addColorStop(0.5, '#EAB308'); // Yellow mid (50%)
            gradient.addColorStop(1.0, '#EF4444'); // Red max (100%)

            ctx.fillStyle = gradient;
            ctx.fillRect(meterX + 1, meterY + 1, fillW, meterH - 2);
          }

          // Gauge Dividers (33% & 66%)
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.fillRect(meterX + Math.floor(meterW * 0.33), meterY + 1, 1, meterH - 2);
          ctx.fillRect(meterX + Math.floor(meterW * 0.66), meterY + 1, 1, meterH - 2);

          // Border Outline
          ctx.strokeStyle = power >= 1.0 ? '#F59E0B' : 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = power >= 1.0 ? 1.5 : 1;
          ctx.strokeRect(meterX - 1, meterY - 1, meterW + 2, meterH + 2);

          // Text Label above meter bar
          ctx.fillStyle = power >= 1.0 ? '#F59E0B' : '#FCD34D';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const labelText = power >= 1.0 ? '⚡ MAX 100%' : `POWER ${Math.round(power * 100)}%`;
          ctx.fillText(labelText, p.x, meterY - 3);

          // Active Curve Direction Indicator Badge
          if (inputRef.current.curveLeft && !inputRef.current.curveRight) {
            ctx.fillStyle = '#06B6D4';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('◄ CURVE LEFT (Q/Z)', p.x, meterY + meterH + 11);
          } else if (inputRef.current.curveRight && !inputRef.current.curveLeft) {
            ctx.fillStyle = '#F59E0B';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText('CURVE RIGHT (E/C) ►', p.x, meterY + meterH + 11);
          }
        }
      });

      // --- DRAW BALL & CURVE MOTION TRAIL ---
      if (interpolatedBall.current) {
        const ball = interpolatedBall.current;
        const ballSpeed = Math.hypot(ball.vx, ball.vy);
        const spin = ball.spin || 0;

        // Update ball rotation angle
        ballAngleRef.current += spin * 0.12 + ball.vx * 0.02;

        // Update ball trail history
        if (ballSpeed > 1.2) {
          ballTrailRef.current.push({ x: ball.x, y: ball.y, spin });
          const maxTrailLength = Math.min(22, Math.floor(10 + ballSpeed * 0.8));
          while (ballTrailRef.current.length > maxTrailLength) {
            ballTrailRef.current.shift();
          }
        } else if (ballTrailRef.current.length > 0) {
          ballTrailRef.current.shift();
        }

        // 1. Draw Curved Motion / Spin Trail behind ball
        if (ballTrailRef.current.length > 1) {
          ctx.save();
          for (let i = 0; i < ballTrailRef.current.length - 1; i++) {
            const p1 = ballTrailRef.current[i];
            const p2 = ballTrailRef.current[i + 1];
            const alpha = (i / ballTrailRef.current.length) * 0.5;
            const hasHighSpin = Math.abs(p2.spin) > 0.3;

            ctx.strokeStyle = hasHighSpin
              ? (p2.spin > 0 ? `rgba(6, 182, 212, ${alpha + 0.15})` : `rgba(245, 158, 11, ${alpha + 0.15})`)
              : `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = Math.max(1.5, (i / ballTrailRef.current.length) * (ball.radius * 1.2));
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 2. Ball Shadow (subtle drop shadow)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(ball.x + 1.5, ball.y + 2.5, ball.radius * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // 3. Ball Main Body
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Rotating Ball Soccer Pattern
        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ballAngleRef.current);

        // Center pentagon
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        const pRadius = ball.radius * 0.38;
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const px = Math.cos(a) * pRadius;
          const py = Math.sin(a) * pRadius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Seam lines radiating from pentagon to outer circle
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * pRadius, Math.sin(a) * pRadius);
          ctx.lineTo(Math.cos(a) * (ball.radius * 0.9), Math.sin(a) * (ball.radius * 0.9));
          ctx.stroke();
        }

        // Spinning aura ring when ball is actively curving with high spin
        if (Math.abs(spin) > 0.4) {
          ctx.strokeStyle = spin > 0 ? '#06B6D4' : '#F59E0B';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, ball.radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // --- DRAW GOAL POSTS ---
      stadium.posts.forEach((post) => {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(post.x + 2, post.y + 3, post.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = post.color || '#FFFFFF';
        ctx.beginPath();
        ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      ctx.restore();

      // --- OVERLAY BANNERS ---
      if (snapshot) {
        if (snapshot.gameState === 'GOAL_SCORED' && snapshot.scoringTeam) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(0, viewH / 2 - 50, viewW, 100);

          ctx.fillStyle = snapshot.scoringTeam === 'red' ? '#EF4444' : '#3B82F6';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`⚽ GOAL FOR ${snapshot.scoringTeam.toUpperCase()} TEAM!`, viewW / 2, viewH / 2 - 10);

          ctx.fillStyle = '#F8FAFC';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(`Score: RED ${snapshot.score.red} - ${snapshot.score.blue} BLUE`, viewW / 2, viewH / 2 + 25);
        } else if (snapshot.gameState === 'GAME_OVER') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(0, viewH / 2 - 70, viewW, 140);

          const winner = snapshot.score.red > snapshot.score.blue ? 'RED TEAM' : 'BLUE TEAM';
          ctx.fillStyle = '#F59E0B';
          ctx.font = 'bold 42px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`🏆 ${winner} WINS!`, viewW / 2, viewH / 2 - 15);

          ctx.fillStyle = '#F8FAFC';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText(`Final Score: RED ${snapshot.score.red} - ${snapshot.score.blue} BLUE`, viewW / 2, viewH / 2 + 30);
        } else if (snapshot.gameState === 'COUNTDOWN') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
          ctx.fillRect(0, viewH / 2 - 40, viewW, 80);

          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('GET READY... KICK OFF INCOMING!', viewW / 2, viewH / 2);
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [stadium, snapshot, cameraMode, zoomLevel, localPlayerId]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onClick={() => {
          // Unfocus any active input so movement keys work immediately
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* Floating Controls Overlay (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-2xl select-none z-20">
        {/* Zoom Buttons */}
        <div className="flex items-center border-r border-[#272C35] pr-2 mr-1 gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
            className="p-1 rounded-lg hover:bg-[#21252D] text-slate-300 transition"
            title="Zoom Out Pitch"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold px-1 text-[#22FF88]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.15))}
            className="p-1 rounded-lg hover:bg-[#21252D] text-slate-300 transition"
            title="Zoom In Pitch"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setCameraMode('full')}
          className={`px-3 py-1 rounded-xl font-sora font-semibold text-xs transition ${
            cameraMode === 'full' ? 'bg-[#22FF88] text-[#0F1115] font-bold shadow-sm' : 'hover:bg-[#21252D]'
          }`}
        >
          Full Field
        </button>
        <button
          onClick={() => setCameraMode('player')}
          className={`px-3 py-1 rounded-xl font-sora font-semibold text-xs transition ${
            cameraMode === 'player' ? 'bg-[#22FF88] text-[#0F1115] font-bold shadow-sm' : 'hover:bg-[#21252D]'
          }`}
        >
          Follow Me
        </button>
        <button
          onClick={() => setCameraMode('ball')}
          className={`px-3 py-1 rounded-xl font-sora font-semibold text-xs transition ${
            cameraMode === 'ball' ? 'bg-[#22FF88] text-[#0F1115] font-bold shadow-sm' : 'hover:bg-[#21252D]'
          }`}
        >
          Follow Ball
        </button>
      </div>

      {/* Floating Keybinds Helper Overlay (Bottom Left - Capsule Style matching image) */}
      <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-2.5 bg-[#181B20]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#272C35] text-[11px] text-slate-300 font-mono select-none z-20 shadow-2xl">
        <span className="text-white font-bold">WASD / ARROWS</span> Move
        <span className="text-[#272C35]">|</span>
        <span className="text-white font-bold">SPACE / X</span> Kick
        <span className="text-[#272C35]">|</span>
        <span className="text-[#00F0FF] font-bold">Q / Z</span> ◄ Curve Left
        <span className="text-[#272C35]">|</span>
        <span className="text-[#22FF88] font-bold">E / C</span> Curve Right ►
      </div>
    </div>
  );
};
