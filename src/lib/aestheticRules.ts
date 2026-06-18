import { ClothingItem, OutfitBreakdown, OutfitBreakdownPart, OutfitInput, Settings } from '../types';
import { evaluateColorHarmony } from './colorTheory';
import { evaluateOccasionFitness, evaluateWeatherComfort } from './occasionRules';
import { evaluateSilhouette } from './silhouetteRules';
import { evaluateStyleCoherence } from './styleRules';

const uniq = <T>(values: T[]) => Array.from(new Set(values));

export const emptyBreakdownPart = (): OutfitBreakdownPart => ({ score: 0, reasons: [], warnings: [] });

export const addToBreakdownPart = (
  part: OutfitBreakdownPart,
  score: number,
  reasons: string[] = [],
  warnings: string[] = []
): OutfitBreakdownPart => ({
  score: Math.round(part.score + score),
  reasons: uniq([...part.reasons, ...reasons]),
  warnings: uniq([...part.warnings, ...warnings]),
});

export const evaluateAestheticRules = (
  items: ClothingItem[],
  input: OutfitInput,
  settings: Settings
): OutfitBreakdown => ({
  color: evaluateColorHarmony(items, input),
  silhouette: evaluateSilhouette(items, input),
  style: evaluateStyleCoherence(items, input),
  occasion: evaluateOccasionFitness(items, input),
  weather: evaluateWeatherComfort(items, input, settings),
});

export const breakdownScore = (breakdown: OutfitBreakdown) =>
  Math.round(Object.values(breakdown).reduce((total, part) => total + part.score, 0));

export const breakdownReasons = (breakdown: OutfitBreakdown) =>
  uniq(Object.values(breakdown).flatMap((part) => part.reasons));

export const breakdownWarnings = (breakdown: OutfitBreakdown) =>
  uniq(Object.values(breakdown).flatMap((part) => part.warnings));
