/** Format seconds as H:MM:SS */
export function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  if (sec === 60) return `${h}:${String(m + 1).padStart(2, '0')}:00`;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Format seconds as M:SS/km */
export function formatPace(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (sec === 60) return `${m + 1}:00/km`;
  return `${m}:${String(sec).padStart(2, '0')}/km`;
}

/** Format seconds as +M:SS or -M:SS */
export function formatDelta(s: number): string {
  const sign = s >= 0 ? '+' : '-';
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = Math.round(abs % 60);
  return `${sign}${m}:${String(sec).padStart(2, '0')}`;
}

/** Format pace as M:SS (without /km suffix) */
export function formatPaceShort(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (sec === 60) return `${m + 1}:00`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
