/**
 * Utility functions for efficiency color coding and severity classification
 */

export interface EfficiencyMetrics {
  severity: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

/**
 * Classify efficiency level and return styling/messaging
 * Efficiency factor: 0-1 (0% to 100%)
 */
export function getEfficiencyMetrics(efficiency: number): EfficiencyMetrics {
  const percent = Math.round(efficiency * 100);

  if (percent >= 90) {
    return {
      severity: 'excellent',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      icon: '✓',
      description: 'Excellent - Optimal placement',
    };
  } else if (percent >= 75) {
    return {
      severity: 'good',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      icon: '→',
      description: 'Good - Above average',
    };
  } else if (percent >= 60) {
    return {
      severity: 'fair',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      icon: '~',
      description: 'Fair - Room for improvement',
    };
  } else {
    return {
      severity: 'poor',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      icon: '⚠',
      description: 'Poor - Significant efficiency loss',
    };
  }
}

/**
 * Get color class for efficiency percentage
 */
export function getEfficiencyColor(efficiency: number): string {
  return getEfficiencyMetrics(efficiency).color;
}

/**
 * Get background color class for efficiency percentage
 */
export function getEfficiencyBgColor(efficiency: number): string {
  return getEfficiencyMetrics(efficiency).bgColor;
}

/**
 * Get border color for efficiency percentage
 */
export function getEfficiencyBorderColor(efficiency: number): string {
  const severity = getEfficiencyMetrics(efficiency).severity;
  switch (severity) {
    case 'excellent':
      return 'border-emerald-300';
    case 'good':
      return 'border-amber-300';
    case 'fair':
      return 'border-orange-300';
    case 'poor':
      return 'border-rose-300';
  }
}

/**
 * Get warning message based on efficiency loss
 */
export function getEfficiencyWarning(
  currentEfficiency: number,
  optimalEfficiency: number
): string | null {
  const loss = optimalEfficiency - currentEfficiency;
  const lossPercent = Math.round((loss / optimalEfficiency) * 100);

  if (lossPercent <= 0) return null;
  if (lossPercent <= 5) return `Minor efficiency loss (~${lossPercent}%)`;
  if (lossPercent <= 15) return `Moderate efficiency loss (~${lossPercent}%)`;
  if (lossPercent <= 30) return `Significant efficiency loss (~${lossPercent}%)`;
  return `Critical efficiency loss (~${lossPercent}%)`;
}

/**
 * Get actionable recommendation based on efficiency
 */
export function getEfficiencyRecommendation(
  efficiency: number,
  currentDirection: string,
  optimalDirection: string
): string {
  const percent = Math.round(efficiency * 100);

  if (percent >= 90) {
    return `✓ Perfect! Your ${currentDirection}-facing roof is ideal for solar panels. Maximize coverage here.`;
  } else if (percent >= 75) {
    return `Good orientation. Your ${currentDirection}-facing roof gets strong sun exposure. Consider a ${optimalDirection}-facing area for even better performance.`;
  } else if (percent >= 60) {
    return `Fair orientation. Your ${currentDirection}-facing roof has moderate solar potential. If possible, rotate panels toward ${optimalDirection} for improved output.`;
  } else {
    return `⚠ Limited solar potential facing ${currentDirection}. Strongly consider using a ${optimalDirection}-facing roof or wall space instead.`;
  }
}

/**
 * Calculate efficiency loss percentage
 */
export function calculateEfficiencyLoss(
  currentEfficiency: number,
  optimalEfficiency: number
): number {
  if (optimalEfficiency === 0) return 0;
  return Math.round(((optimalEfficiency - currentEfficiency) / optimalEfficiency) * 100);
}

/**
 * Get severity color for progress bars and indicators
 */
export function getSeverityColor(severity: 'excellent' | 'good' | 'fair' | 'poor'): string {
  switch (severity) {
    case 'excellent':
      return 'bg-emerald-500';
    case 'good':
      return 'bg-amber-500';
    case 'fair':
      return 'bg-orange-500';
    case 'poor':
      return 'bg-rose-500';
  }
}

/**
 * Get hex color value from severity
 */
export function getSeverityHexColor(severity: 'excellent' | 'good' | 'fair' | 'poor'): string {
  switch (severity) {
    case 'excellent':
      return '#10b981'; // emerald-500
    case 'good':
      return '#f59e0b'; // amber-500
    case 'fair':
      return '#f97316'; // orange-500
    case 'poor':
      return '#ef4444'; // rose-500
  }
}
