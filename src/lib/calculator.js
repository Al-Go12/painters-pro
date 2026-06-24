export const COVERAGE_PER_LITRE_SQFT = 110;

export const UNIT_MULTIPLIERS = { ft: 1, m: 3.280839895, cm: 0.032808399, mm: 0.00328084 };

export const DOOR_SIZES = [
  { label: '7 × 3 ft  (Standard)', area: 21 },
  { label: '8 × 3 ft',             area: 24 },
  { label: '7 × 4 ft',             area: 28 },
];

export const WINDOW_SIZES = [
  { label: '4 × 4 ft  (Standard)', area: 16 },
  { label: '5 × 4 ft',             area: 20 },
  { label: '6 × 4 ft',             area: 24 },
  { label: '3 × 3 ft',             area: 9  },
];

export function asNum(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function toFeet(value, unit) {
  return asNum(value) * (UNIT_MULTIPLIERS[unit] || 1);
}

export function roundUpToHalf(litres) {
  if (litres <= 0) return 0;
  return Math.ceil(litres * 2) / 2;
}

export function litresNeeded(areaSqFt, coats) {
  return (areaSqFt * asNum(coats)) / COVERAGE_PER_LITRE_SQFT;
}

export function deductionArea(rows = []) {
  return rows.reduce((total, row) => {
    const area = String(row.size) === 'custom'
      ? asNum(row.length) * asNum(row.width)
      : asNum(row.size);
    return total + area * asNum(row.count);
  }, 0);
}

/* Multi-room interior calculation — accepts rooms[] + coat/unit options */
export function calcInterior({ rooms = [], doors = [], windows = [], unit = 'ft', primerCoats = 1, interiorCoats = 2, ceilingCoats = 1 }) {
  let totalWallArea    = 0;
  let totalCeilingArea = 0;

  for (const room of rooms) {
    const lFt = toFeet(room.length, unit);
    const wFt = toFeet(room.width,  unit);
    const hFt = toFeet(room.height, unit);
    if (lFt > 0 && wFt > 0 && hFt > 0) {
      totalWallArea    += 2 * hFt * (lFt + wFt);
      totalCeilingArea += lFt * wFt;
    }
  }

  const deduction    = deductionArea(doors) + deductionArea(windows);
  const netWallArea  = Math.max(totalWallArea - deduction, 0);

  const pL = litresNeeded(netWallArea,  primerCoats);
  const iL = litresNeeded(netWallArea,  interiorCoats);
  const cL = litresNeeded(totalCeilingArea, ceilingCoats);

  return {
    totalWallArea, totalCeilingArea, deduction, netWallArea,
    primerLitres:   pL, interiorLitres: iL, ceilingLitres: cL,
    primerLitresRounded:   roundUpToHalf(pL),
    interiorLitresRounded: roundUpToHalf(iL),
    ceilingLitresRounded:  roundUpToHalf(cL),
  };
}

/* Exterior calculation — single building */
export function calcExterior({ length, width, height, unit = 'ft', openArea = 0, primerCoats = 1, paintCoats = 2, terraceCoats = 1 }) {
  const lFt = toFeet(length, unit);
  const wFt = toFeet(width,  unit);
  const hFt = toFeet(height, unit);

  const grossArea   = 2 * (lFt + wFt) * hFt;
  const terraceArea = lFt * wFt;
  const netArea     = Math.max(grossArea - asNum(openArea), 0);

  const pL = litresNeeded(netArea,     primerCoats);
  const wL = litresNeeded(netArea,     paintCoats);
  const tL = litresNeeded(terraceArea, terraceCoats);

  return {
    grossArea, terraceArea, netArea,
    primerLitres:   pL, paintLitres: wL, terraceLitres: tL,
    primerLitresRounded:  roundUpToHalf(pL),
    paintLitresRounded:   roundUpToHalf(wL),
    terraceLitresRounded: roundUpToHalf(tL),
  };
}
