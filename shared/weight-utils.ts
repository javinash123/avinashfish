export interface WeightInput {
  pounds: number;
  ounces: number;
}

export interface WeightDisplay {
  pounds: number;
  ounces: number;
  totalOunces: number;
}

export function convertToOunces(pounds: number, ounces: number): number {
  return (pounds * 16) + ounces;
}

export function convertFromOunces(totalOunces: number): WeightDisplay {
  const pounds = Math.floor(totalOunces / 16);
  const ounces = totalOunces % 16;
  return { pounds, ounces, totalOunces };
}

export function formatWeight(totalOunces: number | string): string {
  // If it's already a formatted weight string, return it as is
  if (typeof totalOunces === 'string' && totalOunces.includes('lb')) {
    return totalOunces;
  }

  const ounces = typeof totalOunces === 'string' ? parseFloat(totalOunces) : totalOunces;
  
  if (isNaN(ounces) || ounces === 0) {
    return "0 lb 0 oz";
  }
  
  const { pounds, ounces: oz } = convertFromOunces(Math.round(ounces));
  return `${pounds} lb ${oz} oz`;
}

export function parseWeight(weightString: string): number {
  if (!weightString) return 0;
  
  const match = weightString.match(/(\d+)\s*lb\s*(\d+)\s*oz/i);
  if (match) {
    const pounds = parseInt(match[1], 10);
    const ounces = parseInt(match[2], 10);
    return convertToOunces(pounds, ounces);
  }
  
  // If it's just a number string, treat as total ounces
  const numericValue = parseFloat(weightString);
  if (!isNaN(numericValue)) {
    return Math.round(numericValue);
  }
  
  return 0;
}

export function sumWeights(weights: Array<number | string>): number {
  return weights.reduce<number>((total, weight) => {
    const ounces: number = typeof weight === 'string' ? parseWeight(weight) : weight;
    return total + ounces;
  }, 0);
}
