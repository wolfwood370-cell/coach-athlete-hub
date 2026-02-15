import { useRef, useState, useCallback } from "react";

export interface TrackPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface TrackingResult {
  points: TrackPoint[];
  avgVelocityMs: number;
  peakVelocityMs: number;
  romCm: number;
  velocityProfile: { time: number; velocity: number }[];
}

interface HSLRange {
  hMin: number;
  hMax: number;
  sMin: number;
  sMax: number;
  lMin: number;
  lMax: number;
}

const SEARCH_WINDOW = 80; // px around last known position
const MIN_BLOB_PIXELS = 30;

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function sampleColorRange(imageData: ImageData, cx: number, cy: number, radius: number): HSLRange {
  const { data, width, height } = imageData;
  const hues: number[] = [];
  const sats: number[] = [];
  const lums: number[] = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = cx + dx, py = cy + dy;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const i = (py * width + px) * 4;
      const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
      hues.push(h); sats.push(s); lums.push(l);
    }
  }

  if (hues.length === 0) return { hMin: 0, hMax: 360, sMin: 0, sMax: 100, lMin: 0, lMax: 100 };

  const margin = 15;
  return {
    hMin: Math.max(0, Math.min(...hues) - margin),
    hMax: Math.min(360, Math.max(...hues) + margin),
    sMin: Math.max(0, Math.min(...sats) - 20),
    sMax: Math.min(100, Math.max(...sats) + 20),
    lMin: Math.max(0, Math.min(...lums) - 20),
    lMax: Math.min(100, Math.max(...lums) + 20),
  };
}

function findCentroid(
  imageData: ImageData,
  range: HSLRange,
  lastX: number,
  lastY: number,
  searchWindow: number
): { x: number; y: number } | null {
  const { data, width, height } = imageData;
  let sumX = 0, sumY = 0, count = 0;

  const xMin = Math.max(0, lastX - searchWindow);
  const xMax = Math.min(width, lastX + searchWindow);
  const yMin = Math.max(0, lastY - searchWindow);
  const yMax = Math.min(height, lastY + searchWindow);

  for (let y = yMin; y < yMax; y += 2) {
    for (let x = xMin; x < xMax; x += 2) {
      const i = (y * width + x) * 4;
      const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
      if (h >= range.hMin && h <= range.hMax &&
          s >= range.sMin && s <= range.sMax &&
          l >= range.lMin && l <= range.lMax) {
        sumX += x; sumY += y; count++;
      }
    }
  }

  if (count < MIN_BLOB_PIXELS) return null;
  return { x: Math.round(sumX / count), y: Math.round(sumY / count) };
}

export function useBarbellTracker() {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const colorRangeRef = useRef<HSLRange | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointsRef = useRef<TrackPoint[]>([]);
  const calibrationPxPerCmRef = useRef<number>(5); // default ~5px/cm, user can refine

  const calibrate = useCallback((imageData: ImageData, tapX: number, tapY: number) => {
    const range = sampleColorRange(imageData, tapX, tapY, 12);
    colorRangeRef.current = range;
    lastPosRef.current = { x: tapX, y: tapY };
    setIsCalibrated(true);
  }, []);

  const setCalibrationScale = useCallback((pxPerCm: number) => {
    calibrationPxPerCmRef.current = pxPerCm;
  }, []);

  const startTracking = useCallback(() => {
    pointsRef.current = [];
    setPoints([]);
    setResult(null);
    setIsTracking(true);
  }, []);

  const processFrame = useCallback((imageData: ImageData) => {
    if (!colorRangeRef.current || !lastPosRef.current) return;

    const centroid = findCentroid(
      imageData,
      colorRangeRef.current,
      lastPosRef.current.x,
      lastPosRef.current.y,
      SEARCH_WINDOW
    );

    if (centroid) {
      lastPosRef.current = centroid;
      const pt: TrackPoint = { x: centroid.x, y: centroid.y, timestamp: performance.now() };
      pointsRef.current.push(pt);
      setPoints([...pointsRef.current]);
    }
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    const raw = pointsRef.current;
    if (raw.length < 4) {
      setResult(null);
      return;
    }

    const pxPerCm = calibrationPxPerCmRef.current;

    // Calculate velocities between consecutive points
    const velocities: { time: number; velocity: number }[] = [];
    let peakVel = 0;
    let totalVel = 0;

    for (let i = 1; i < raw.length; i++) {
      const dx = raw[i].x - raw[i - 1].x;
      const dy = raw[i].y - raw[i - 1].y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distCm = distPx / pxPerCm;
      const dtSec = (raw[i].timestamp - raw[i - 1].timestamp) / 1000;
      if (dtSec <= 0) continue;

      const velMs = (distCm / 100) / dtSec; // m/s
      velocities.push({
        time: (raw[i].timestamp - raw[0].timestamp) / 1000,
        velocity: Math.round(velMs * 100) / 100,
      });
      totalVel += velMs;
      if (velMs > peakVel) peakVel = velMs;
    }

    // ROM: total vertical displacement (max Y - min Y)
    const ys = raw.map(p => p.y);
    const romPx = Math.max(...ys) - Math.min(...ys);
    const romCm = Math.round((romPx / pxPerCm) * 10) / 10;

    const avgVel = velocities.length > 0 ? totalVel / velocities.length : 0;

    setResult({
      points: raw,
      avgVelocityMs: Math.round(avgVel * 100) / 100,
      peakVelocityMs: Math.round(peakVel * 100) / 100,
      romCm,
      velocityProfile: velocities,
    });
  }, []);

  const reset = useCallback(() => {
    setIsCalibrated(false);
    setIsTracking(false);
    setPoints([]);
    setResult(null);
    colorRangeRef.current = null;
    lastPosRef.current = null;
    pointsRef.current = [];
  }, []);

  return {
    isCalibrated,
    isTracking,
    points,
    result,
    calibrate,
    setCalibrationScale,
    startTracking,
    processFrame,
    stopTracking,
    reset,
  };
}
