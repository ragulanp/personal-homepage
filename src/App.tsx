import { useEffect, useRef, useState } from "react";
import "./App.css";

const EMOJI_SIZE = 40;
const COLLISION_DIAMETER = EMOJI_SIZE;
// How close to a corner a wall bounce counts as a corner hit.
const CORNER_THRESHOLD = 60;

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  el: HTMLDivElement | null;
};

const createBall = (x: number, y: number, vx: number, vy: number): Ball => ({
  x,
  y,
  vx,
  vy,
  el: null,
});

// Looping chiptune melody (C major pentatonic) and bass, in Hz.
const MELODY = [
  523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 659.25, 523.25, 659.25,
  783.99, 1046.5, 880, 783.99, 659.25, 587.33,
];
const BASS = [130.81, 0, 196, 0, 174.61, 0, 196, 0];

const startMusic = () => {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);

  const playNote = (
    freq: number,
    start: number,
    duration: number,
    type: OscillatorType,
    peak: number,
  ) => {
    if (!freq) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + duration);
  };

  const step = 0.22;
  let index = 0;
  let nextTime = ctx.currentTime + 0.1;

  const scheduler = window.setInterval(() => {
    while (nextTime < ctx.currentTime + 0.2) {
      playNote(
        MELODY[index % MELODY.length],
        nextTime,
        step * 0.9,
        "triangle",
        0.25,
      );
      playNote(
        BASS[index % BASS.length],
        nextTime,
        step * 1.8,
        "sawtooth",
        0.18,
      );
      index++;
      nextTime += step;
    }
  }, 40);

  return () => {
    window.clearInterval(scheduler);
    ctx.close();
  };
};

export const App = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ballsRef = useRef<Map<number, Ball>>(new Map());
  const seededRef = useRef(false);
  const nextIdRef = useRef(1);
  const [ballIds, setBallIds] = useState<number[]>([0]);
  const [cornerHits, setCornerHits] = useState(0);
  const stopMusicRef = useRef<(() => void) | null>(null);
  const [musicOn, setMusicOn] = useState(false);

  // Seed the initial ball once, before the ref callbacks run.
  if (!seededRef.current) {
    seededRef.current = true;
    ballsRef.current.set(
      0,
      createBall(
        Math.random() * (window.innerWidth - EMOJI_SIZE),
        Math.random() * (window.innerHeight - EMOJI_SIZE),
        3,
        3,
      ),
    );
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const heading = headingRef.current;
    if (!heading) return;

    const { innerWidth, innerHeight } = window;
    const rotateY = ((event.clientX / innerWidth) * 2 - 1) * 35;
    const rotateX = -((event.clientY / innerHeight) * 2 - 1) * 25;

    heading.style.setProperty("--rotate-x", `${rotateX}deg`);
    heading.style.setProperty("--rotate-y", `${rotateY}deg`);
  };

  const handlePointerLeave = () => {
    const heading = headingRef.current;
    if (!heading) return;

    heading.style.removeProperty("--rotate-x");
    heading.style.removeProperty("--rotate-y");
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const id = nextIdRef.current++;
    const maxX = window.innerWidth - EMOJI_SIZE;
    const maxY = window.innerHeight - EMOJI_SIZE;
    const speed = 3 + Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;

    ballsRef.current.set(
      id,
      createBall(
        Math.max(0, Math.min(event.clientX - EMOJI_SIZE / 2, maxX)),
        Math.max(0, Math.min(event.clientY - EMOJI_SIZE / 2, maxY)),
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      ),
    );
    setBallIds((ids) => [...ids, id]);
  };

  const handleReset = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    ballsRef.current.clear();
    setBallIds([]);
    setCornerHits(0);
  };

  const toggleMusic = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (stopMusicRef.current) {
      stopMusicRef.current();
      stopMusicRef.current = null;
      setMusicOn(false);
    } else {
      stopMusicRef.current = startMusic();
      setMusicOn(true);
    }
  };

  useEffect(() => {
    let frame = 0;

    const step = () => {
      const maxX = window.innerWidth - EMOJI_SIZE;
      const maxY = window.innerHeight - EMOJI_SIZE;

      ballsRef.current.forEach((ball, id) => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        let bouncedX = false;
        let bouncedY = false;

        if (ball.x <= 0 || ball.x >= maxX) {
          ball.vx = -ball.vx;
          ball.x = Math.max(0, Math.min(ball.x, maxX));
          bouncedX = true;
        }
        if (ball.y <= 0 || ball.y >= maxY) {
          ball.vy = -ball.vy;
          ball.y = Math.max(0, Math.min(ball.y, maxY));
          bouncedY = true;
        }

        const nearCornerX =
          ball.x <= CORNER_THRESHOLD || ball.x >= maxX - CORNER_THRESHOLD;
        const nearCornerY =
          ball.y <= CORNER_THRESHOLD || ball.y >= maxY - CORNER_THRESHOLD;
        if ((bouncedX || bouncedY) && nearCornerX && nearCornerY) {
          setCornerHits((count) => count + 1);
          // Remove the ball on a corner hit, but always keep at least one.
          if (ballsRef.current.size > 1) {
            ballsRef.current.delete(id);
            setBallIds((ids) => ids.filter((existing) => existing !== id));
            return;
          }
        }

        if (ball.el) {
          ball.el.style.transform = `translate(${ball.x}px, ${ball.y}px)`;
        }
      });

      // Elastic collisions between balls (equal mass)
      const balls = Array.from(ballsRef.current.values());
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;

          if (dist < COLLISION_DIAMETER) {
            const nx = dx / dist;
            const ny = dy / dist;
            const relVel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;

            if (relVel > 0) {
              a.vx -= relVel * nx;
              a.vy -= relVel * ny;
              b.vx += relVel * nx;
              b.vy += relVel * ny;
            }

            // Separate the overlap so they don't stick together
            const overlap = (COLLISION_DIAMETER - dist) / 2;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            if (a.el) a.el.style.transform = `translate(${a.x}px, ${a.y}px)`;
            if (b.el) b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
          }
        }
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => stopMusicRef.current?.(), []);

  return (
    <main
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
    >
      <div className="corner-counter">Corner hits: {cornerHits}</div>
      <div className="ball-counter">Balls: {ballIds.length}</div>
      <button className="reset-button" onPointerDown={handleReset}>
        Reset
      </button>
      <button className="music-button" onPointerDown={toggleMusic}>
        {musicOn ? "🔊 Music" : "🔇 Music"}
      </button>
      {ballIds.map((id) => (
        <div
          key={id}
          className="bouncing-emoji"
          ref={(el) => {
            const ball = ballsRef.current.get(id);
            if (ball) ball.el = el;
          }}
        >
          ⚽
        </div>
      ))}
      <h1 ref={headingRef} data-text="Ragulan">
        Ragulan
      </h1>
    </main>
  );
};
