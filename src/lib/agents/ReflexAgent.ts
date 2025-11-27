/**
 * ReflexAgent - Simple rule-based agent
 * 
 * Logic:
 * - If altitude < 4 → increase by +1
 * - If altitude > 6 → decrease by -1
 * - If altitude in [4,6] → do nothing (0)
 * 
 * No memory, only reacts to current state
 */

export class ReflexAgent {
  private readonly SAFE_MIN = 4;
  private readonly SAFE_MAX = 6;
  private actionHistory: { altitude: number; action: number; timestamp: number }[] = [];

  /**
   * Decide action based on current altitude
   * Simple reactive rules with no prediction
   */
  decideAction(currentAltitude: number): number {
    let action = 0;

    if (currentAltitude < this.SAFE_MIN) {
      action = 1; // Increase altitude
    } else if (currentAltitude > this.SAFE_MAX) {
      action = -1; // Decrease altitude
    }
    // else: in safe zone, do nothing (action = 0)

    this.recordAction(currentAltitude, action);
    return action;
  }

  /**
   * Get explanation of action
   */
  explainAction(altitude: number, action: number): string {
    if (action === 1) {
      return `Altitude ${altitude} < ${this.SAFE_MIN} → Increase +1`;
    } else if (action === -1) {
      return `Altitude ${altitude} > ${this.SAFE_MAX} → Decrease -1`;
    } else {
      return `Altitude ${altitude} in safe zone → No adjustment`;
    }
  }

  /**
   * Record action to history
   */
  private recordAction(altitude: number, action: number): void {
    this.actionHistory.push({
      altitude,
      action,
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
   * Reset agent
   */
  reset(): void {
    this.actionHistory = [];
  }

  /**
   * Get agent name
   */
  getName(): string {
    return "Reflex Agent";
  }

  /**
   * Get agent description
   */
  getDescription(): string {
    return "Simple rule-based agent that reacts to current altitude without prediction";
  }
}
