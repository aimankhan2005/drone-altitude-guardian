/**
 * ModelBasedAgent - Intelligent predictive agent
 * 
 * Features:
 * - Maintains belief state about wind trends
 * - Predicts next altitude based on wind patterns
 * - Applies smaller, smarter adjustments
 * - Only acts when prediction shows instability
 */

export class ModelBasedAgent {
  private readonly SAFE_MIN = 4;
  private readonly SAFE_MAX = 6;
  private windHistory: number[] = [];
  private readonly HISTORY_WINDOW = 5;
  private actionHistory: { 
    altitude: number; 
    predictedAltitude: number; 
    action: number; 
    windTrend: number;
    timestamp: number;
  }[] = [];

  /**
   * Update internal model with new wind observation
   */
  updateModel(wind: number): void {
    this.windHistory.push(wind);
    if (this.windHistory.length > this.HISTORY_WINDOW) {
      this.windHistory.shift();
    }
  }

  /**
   * Calculate average wind trend from recent history
   */
  private getWindTrend(): number {
    if (this.windHistory.length === 0) return 0;
    const sum = this.windHistory.reduce((acc, wind) => acc + wind, 0);
    return sum / this.windHistory.length;
  }

  /**
   * Predict next altitude based on current altitude and wind trend
   */
  private predictNextAltitude(currentAltitude: number): number {
    const windTrend = this.getWindTrend();
    return currentAltitude + windTrend;
  }

  /**
   * Decide action based on predicted altitude
   * Smarter than reflex agent - only acts when prediction shows problems
   */
  decideAction(currentAltitude: number): number {
    const windTrend = this.getWindTrend();
    const predictedAltitude = this.predictNextAltitude(currentAltitude);
    let action = 0;

    // Predict and preemptively adjust if needed
    if (predictedAltitude < this.SAFE_MIN) {
      action = 1; // Increase altitude
    } else if (predictedAltitude > this.SAFE_MAX) {
      action = -1; // Decrease altitude
    } else if (currentAltitude < this.SAFE_MIN) {
      // Current altitude is already low, act even if prediction is ok
      action = 1;
    } else if (currentAltitude > this.SAFE_MAX) {
      // Current altitude is already high, act even if prediction is ok
      action = -1;
    }
    // else: predicted to stay in safe zone, do nothing

    this.recordAction(currentAltitude, predictedAltitude, action, windTrend);
    return action;
  }

  /**
   * Get explanation of action
   */
  explainAction(altitude: number, action: number): string {
    const windTrend = this.getWindTrend().toFixed(2);
    const predicted = this.predictNextAltitude(altitude).toFixed(1);
    
    if (action === 1) {
      return `Predicted altitude ${predicted} (trend: ${windTrend}) → Increase +1`;
    } else if (action === -1) {
      return `Predicted altitude ${predicted} (trend: ${windTrend}) → Decrease -1`;
    } else {
      return `Predicted altitude ${predicted} in safe zone → No adjustment`;
    }
  }

  /**
   * Record action to history
   */
  private recordAction(
    altitude: number, 
    predictedAltitude: number, 
    action: number, 
    windTrend: number
  ): void {
    this.actionHistory.push({
      altitude,
      predictedAltitude,
      action,
      windTrend,
      timestamp: Date.now(),
    });
  }

  /**
   * Get action history
   */
  getActionHistory() {
    return [...this.actionHistory];
  }

  /**
   * Get current wind trend
   */
  getCurrentWindTrend(): number {
    return this.getWindTrend();
  }

  /**
   * Reset agent
   */
  reset(): void {
    this.windHistory = [];
    this.actionHistory = [];
  }

  /**
   * Get agent name
   */
  getName(): string {
    return "Model-Based Agent";
  }

  /**
   * Get agent description
   */
  getDescription(): string {
    return "Intelligent agent that predicts altitude changes based on wind patterns";
  }
}
