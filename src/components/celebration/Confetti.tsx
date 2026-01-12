import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function Confetti({ trigger, duration = 3000, onComplete }: ConfettiProps) {
  const fireConfetti = useCallback(() => {
    const end = Date.now() + duration;

    // Launch confetti from both sides
    const colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        onComplete?.();
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });

    frame();
  }, [duration, onComplete]);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null; // This component doesn't render anything
}

// Standalone function to trigger confetti
export function triggerConfetti() {
  const colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];
  
  // Big initial burst
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors,
  });

  // Follow-up bursts from sides
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.65 },
      colors,
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.65 },
      colors,
    });
  }, 300);
}

// Trophy/gold confetti for PRs
export function triggerPRConfetti() {
  const goldColors = ['#ffd700', '#ffb347', '#ff8c00', '#ffa500', '#ffcc00'];
  
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: goldColors,
    shapes: ['circle', 'square'],
    scalar: 1.2,
  });
}
