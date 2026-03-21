export function windImpactPerKm(
  segmentBearing: number,
  windSpeedKmh: number,
  windDirectionDeg: number
): number {
  if (windSpeedKmh === 0) return 0;

  const windGoingTo = (windDirectionDeg + 180) % 360;
  const angleDiff = toRad(windGoingTo - segmentBearing);
  const headwindComponent = -Math.cos(angleDiff) * windSpeedKmh;

  // Asymmetric: headwind penalty > tailwind benefit
  const factor = headwindComponent > 0 ? 0.4 : 0.2;
  return headwindComponent * factor;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
