/**
 * Utility for tracking and debugging state changes in React applications
 */

type StateSnapshot = {
  id: number;
  timestamp: number;
  action: string;
  state: any;
}

class StateTracker {
  private snapshots: StateSnapshot[] = [];
  private snapshotId = 0;

  /**
   * Take a snapshot of the current state with an action description
   */
  takeSnapshot(action: string, state: any): number {
    const snapshot: StateSnapshot = {
      id: ++this.snapshotId,
      timestamp: Date.now(),
      action,
      state: JSON.parse(JSON.stringify(state)) // Deep copy to prevent reference issues
    };
    
    this.snapshots.push(snapshot);
    console.log(`[StateTracker] Snapshot #${snapshot.id}: ${action}`);
    
    // Only keep the last 20 snapshots to avoid memory issues
    if (this.snapshots.length > 20) {
      this.snapshots.shift();
    }
    
    return snapshot.id;
  }

  /**
   * Get a specific snapshot by ID
   */
  getSnapshot(id: number): StateSnapshot | undefined {
    return this.snapshots.find(snapshot => snapshot.id === id);
  }

  /**
   * Get all snapshots for the current session
   */
  getAllSnapshots(): StateSnapshot[] {
    return [...this.snapshots]; // Return a copy to prevent mutation
  }

  /**
   * Get the most recent snapshot
   */
  getLatestSnapshot(): StateSnapshot | undefined {
    if (this.snapshots.length === 0) return undefined;
    return this.snapshots[this.snapshots.length - 1];
  }

  /**
   * Compare two snapshots and output differences
   */
  compareSnapshots(id1: number, id2: number): Record<string, { before: any, after: any }> {
    const snapshot1 = this.getSnapshot(id1);
    const snapshot2 = this.getSnapshot(id2);
    
    if (!snapshot1 || !snapshot2) {
      console.error("Cannot compare: one or both snapshots don't exist");
      return {};
    }

    const differences: Record<string, { before: any, after: any }> = {};
    
    // Compare state properties
    const allKeys = new Set([
      ...Object.keys(snapshot1.state),
      ...Object.keys(snapshot2.state)
    ]);
    
    allKeys.forEach(key => {
      if (JSON.stringify(snapshot1.state[key]) !== JSON.stringify(snapshot2.state[key])) {
        differences[key] = {
          before: snapshot1.state[key],
          after: snapshot2.state[key]
        };
      }
    });
    
    return differences;
  }

  /**
   * Clear all snapshots
   */
  reset(): void {
    this.snapshots = [];
    this.snapshotId = 0;
    console.log("[StateTracker] All snapshots cleared");
  }

  // Make init explicit to ensure it's ready when used
  init(): void {
    this.snapshots = [];
    this.snapshotId = 0;
    console.log("[StateTracker] Initialized");
  }
}

// Export a singleton instance and initialize it
export const stateTracker = new StateTracker();

// Initialize immediately for client-side execution
if (typeof window !== 'undefined') {
  stateTracker.init();
}
