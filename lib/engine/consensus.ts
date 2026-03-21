interface ConsensusResult {
  paceSecondsPerKm: number;
  timeSeconds: number;
  label: string;
}

export function calculateConsensus(
  forecastPacePerKm: number,
  targetPacePerKm: number,
  distanceKm: number
): ConsensusResult {
  const diff = forecastPacePerKm - targetPacePerKm;

  let consensusPace: number;
  let label: string;

  if (diff <= 0) {
    consensusPace = targetPacePerKm;
    label = 'Objetivo conservador — vas a ritmo cómodo';
  } else if (diff <= 5) {
    consensusPace = targetPacePerKm;
    label = 'Agresivo pero realista';
  } else if (diff <= 10) {
    consensusPace = Math.round(forecastPacePerKm - diff / 2);
    label = 'Tu target es ambicioso, te sugerimos este ritmo';
  } else {
    consensusPace = forecastPacePerKm - 5;
    label = 'Tu target está lejos de tu forma actual';
  }

  return {
    paceSecondsPerKm: consensusPace,
    timeSeconds: Math.round(consensusPace * distanceKm),
    label,
  };
}
