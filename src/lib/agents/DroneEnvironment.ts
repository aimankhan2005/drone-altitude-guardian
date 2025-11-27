/**
 * DroneEnvironment - Simulates the drone's physical environment
 * 
 * Features:
 * - Discrete altitude levels (0-10)
 * - Random wind disturbances {-1, 0, +1}
 * - Safe altitude band [4, 5, 6]
 * - State management
 */

export interface EnvironmentState {
  altitude: number;
  wind: number;
  timestamp: number;
  isStable: boolean;
}

export class DroneEnvironment {
  private altitude: number;
  private readonly MIN_ALTITUDE = 0;
  private readonly MAX_ALTITUDE = 10;
  private readonly SAFE_MIN = 4;
  private readonly SAFE_MAX = 6;
  private history: EnvironmentState[] = [];

  constructor(initialAltitude: number = 5) {
    this.altitude = Math.max(this.MIN_ALTITUDE, Math.min(this.MAX_ALTITUDE, initialAltitude));
    this.recordState(0);
  }

  /**
   * Generate random wind disturbance
   * Returns -1, 0, or +1 with equal probability
   */
  private generateWind(): number {
    const random = Math.random();
    if (random < 0.33) return -1;
    if (random < 0.66) return 0;
    return 1;
  }

  /**
   * Apply wind disturbance to current altitude
   */
  applyWind(): number {
    const wind = this.generateWind();
    this.altitude = Math.max(this.MIN_ALTITUDE, Math.min(this.MAX_ALTITUDE, this.altitude + wind));
    this.recordState(wind);
    return wind;
  }

  /**
   * Apply agent's adjustment action
   */
  applyAction(adjustment: number): void {
    this.altitude = Math.max(this.MIN_ALTITUDE, Math.min(this.MAX_ALTITUDE, this.altitude + adjustment));
  }

  /**
   * Check if drone is in safe altitude band
   */
  isInSafeZone(): boolean {
    return this.altitude >= this.SAFE_MIN && this.altitude <= this.SAFE_MAX;
  }

  /**
   * Check if drone is critically unstable (needs A* recovery)
   */
  isCritical(): boolean {
    return this.altitude < 3 || this.altitude > 7;
  }

  /**
   * Get current altitude
   */
  getAltitude(): number {
    return this.altitude;
  }

  /**
   * Get safe zone boundaries
   */
  getSafeZone(): [number, number] {
    return [this.SAFE_MIN, this.SAFE_MAX];
  }

  /**
   * Get altitude boundaries
   */
  getBoundaries(): [number, number] {
    return [this.MIN_ALTITUDE, this.MAX_ALTITUDE];
  }

  /**
   * Record current state to history
   */
  private recordState(wind: number): void {
    this.history.push({
      altitude: this.altitude,
      wind,
      timestamp: Date.now(),
      isStable: this.isInSafeZone(),
    });
  }

  /**
   * Get history of states
   */
  getHistory(): EnvironmentState[] {
    return [...this.history];
  }

  /**
   * Get recent wind trend (average of last N steps)
   */
  getRecentWindTrend(steps: number = 5): number {
    if (this.history.length === 0) return 0;
    const recentHistory = this.history.slice(-steps);
    const sum = recentHistory.reduce((acc, state) => acc + state.wind, 0);
    return sum / recentHistory.length;
  }

  /**
   * Reset environment
   */
  reset(initialAltitude: number = 5): void {
    this.altitude = Math.max(this.MIN_ALTITUDE, Math.min(this.MAX_ALTITUDE, initialAltitude));
    this.history = [];
    this.recordState(0);
  }

  /**
   * Get current state
   */
  getState(): EnvironmentState {
    return {
      altitude: this.altitude,
      wind: this.history.length > 0 ? this.history[this.history.length - 1].wind : 0,
      timestamp: Date.now(),
      isStable: this.isInSafeZone(),
    };
  }
}
