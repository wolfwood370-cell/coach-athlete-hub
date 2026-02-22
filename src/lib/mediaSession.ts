/**
 * Media Session API utility for lock-screen rest timer display.
 *
 * Uses a silent looping audio track to keep the Media Session active
 * on iOS/Android, then dynamically updates the metadata with the
 * remaining rest time.
 */

// --------------------------------------------------------------------------
// Silent audio element (singleton)
// --------------------------------------------------------------------------

let silentAudio: HTMLAudioElement | null = null;

function getSilentAudio(): HTMLAudioElement {
  if (silentAudio) return silentAudio;

  // Create a tiny silent WAV inline via data URI (44 bytes PCM, ~1s loop)
  // This keeps the media session alive on mobile platforms
  const silentWavDataUri =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  silentAudio = new Audio(silentWavDataUri);
  silentAudio.loop = true;
  silentAudio.volume = 0.01; // near-silent but not zero (some browsers ignore 0)
  return silentAudio;
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Start the media session with rest timer metadata.
 * Call this when the rest timer begins.
 */
export function startMediaSession(): void {
  if (!("mediaSession" in navigator)) return;

  try {
    const audio = getSilentAudio();
    audio.play().catch(() => {
      // Autoplay blocked — will still work if called after user gesture
    });

    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Recupero in corso...",
      artist: "Tempo rimanente: --:--",
      album: "Coach Athlete Hub",
      artwork: [
        { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  } catch {
    // Silently ignore unsupported environments
  }
}

/**
 * Update the remaining time displayed on the lock screen.
 */
export function updateMediaSessionTime(remainingSeconds: number): void {
  if (!("mediaSession" in navigator) || !navigator.mediaSession.metadata) return;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Recupero in corso...",
      artist: `Tempo rimanente: ${formatted}`,
      album: "Coach Athlete Hub",
      artwork: [
        { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      ],
    });
  } catch {
    // ignore
  }
}

/**
 * Stop the media session and pause silent audio.
 * Call this when the rest timer ends or is skipped.
 */
export function stopMediaSession(): void {
  try {
    if (silentAudio) {
      silentAudio.pause();
      silentAudio.currentTime = 0;
    }

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
    }
  } catch {
    // ignore
  }
}
