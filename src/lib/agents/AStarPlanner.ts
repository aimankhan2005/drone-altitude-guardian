/**
 * AStarPlanner - Optimal path planning using A* algorithm
 * 
 * Used when drone becomes critically unstable (altitude < 3 or > 7)
 * Finds optimal sequence of moves to reach nearest safe altitude
 * 
 * State: altitude level (0-10)
 * Goal: reach safe zone [4, 5, 6]
 * Cost: minimize number of adjustments
 * Heuristic: distance to nearest safe altitude
 */

interface AStarNode {
  altitude: number;
  gCost: number; // Cost from start
  hCost: number; // Heuristic cost to goal
  fCost: number; // Total cost (g + h)
  parent: AStarNode | null;
  action: number; // Action taken to reach this node
}

export interface AStarResult {
  path: number[];
  actions: number[];
  totalCost: number;
  nodesExplored: number;
}

export class AStarPlanner {
  private readonly MIN_ALTITUDE = 0;
  private readonly MAX_ALTITUDE = 10;
  private readonly SAFE_MIN = 4;
  private readonly SAFE_MAX = 6;
  private readonly POSSIBLE_ACTIONS = [-1, 0, 1];

  /**
   * Calculate heuristic: distance to nearest safe altitude
   */
  private heuristic(altitude: number): number {
    if (altitude >= this.SAFE_MIN && altitude <= this.SAFE_MAX) {
      return 0; // Already in safe zone
    } else if (altitude < this.SAFE_MIN) {
      return this.SAFE_MIN - altitude;
    } else {
      return altitude - this.SAFE_MAX;
    }
  }

  /**
   * Check if altitude is in safe zone
   */
  private isGoal(altitude: number): boolean {
    return altitude >= this.SAFE_MIN && altitude <= this.SAFE_MAX;
  }

  /**
   * Find node with lowest fCost in open set
   */
  private findLowestFCost(openSet: AStarNode[]): AStarNode {
    return openSet.reduce((lowest, node) => 
      node.fCost < lowest.fCost ? node : lowest
    );
  }

  /**
   * Reconstruct path from goal node
   */
  private reconstructPath(goalNode: AStarNode): { path: number[]; actions: number[] } {
    const path: number[] = [];
    const actions: number[] = [];
    let current: AStarNode | null = goalNode;

    while (current !== null) {
      path.unshift(current.altitude);
      if (current.parent !== null) {
        actions.unshift(current.action);
      }
      current = current.parent;
    }

    return { path, actions };
  }

  /**
   * Run A* algorithm to find optimal path to safe zone
   */
  findPath(startAltitude: number): AStarResult {
    const startNode: AStarNode = {
      altitude: startAltitude,
      gCost: 0,
      hCost: this.heuristic(startAltitude),
      fCost: this.heuristic(startAltitude),
      parent: null,
      action: 0,
    };

    const openSet: AStarNode[] = [startNode];
    const closedSet: Set<number> = new Set();
    let nodesExplored = 0;

    while (openSet.length > 0) {
      nodesExplored++;

      // Get node with lowest fCost
      const current = this.findLowestFCost(openSet);
      
      // Remove current from open set
      const currentIndex = openSet.indexOf(current);
      openSet.splice(currentIndex, 1);

      // Check if goal reached
      if (this.isGoal(current.altitude)) {
        const { path, actions } = this.reconstructPath(current);
        return {
          path,
          actions,
          totalCost: current.gCost,
          nodesExplored,
        };
      }

      // Add to closed set
      closedSet.add(current.altitude);

      // Explore neighbors
      for (const action of this.POSSIBLE_ACTIONS) {
        const newAltitude = current.altitude + action;

        // Check bounds
        if (newAltitude < this.MIN_ALTITUDE || newAltitude > this.MAX_ALTITUDE) {
          continue;
        }

        // Skip if already explored
        if (closedSet.has(newAltitude)) {
          continue;
        }

        // Calculate costs
        const gCost = current.gCost + (action !== 0 ? 1 : 0); // Cost of action
        const hCost = this.heuristic(newAltitude);
        const fCost = gCost + hCost;

        // Check if this path to neighbor is better
        const existingNode = openSet.find(n => n.altitude === newAltitude);
        
        if (!existingNode || gCost < existingNode.gCost) {
          const neighborNode: AStarNode = {
            altitude: newAltitude,
            gCost,
            hCost,
            fCost,
            parent: current,
            action,
          };

          if (existingNode) {
            // Update existing node
            const index = openSet.indexOf(existingNode);
            openSet[index] = neighborNode;
          } else {
            // Add new node
            openSet.push(neighborNode);
          }
        }
      }
    }

    // No path found (shouldn't happen in this problem)
    return {
      path: [startAltitude],
      actions: [],
      totalCost: Infinity,
      nodesExplored,
    };
  }

  /**
   * Get next action from A* path
   */
  getNextAction(currentAltitude: number): number {
    const result = this.findPath(currentAltitude);
    return result.actions.length > 0 ? result.actions[0] : 0;
  }

  /**
   * Get full A* path explanation
   */
  explainPath(currentAltitude: number): string {
    const result = this.findPath(currentAltitude);
    return `A* Path: ${result.path.join(' → ')} (${result.nodesExplored} nodes explored)`;
  }
}
