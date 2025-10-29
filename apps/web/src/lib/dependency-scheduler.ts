import { WBSNode, DependencyType } from '@/types/wbs';
import { addDays, differenceInDays } from 'date-fns';

/**
 * Validate if a task can be moved to new dates without violating dependencies
 */
export function validateTaskMove(
  node: WBSNode,
  newStartDate: Date,
  newEndDate: Date,
  allNodes: WBSNode[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check predecessors constraints
  if (node.predecessors && node.predecessors.length > 0) {
    for (const dep of node.predecessors) {
      const predecessor = allNodes.find(n => n.id === dep.nodeId);
      if (!predecessor?.plannedStartDate || !predecessor?.plannedEndDate) continue;

      const predStart = new Date(predecessor.plannedStartDate);
      const predEnd = new Date(predecessor.plannedEndDate);

      switch (dep.type) {
        case DependencyType.FS: // Finish-to-Start
          const minStartFS = addDays(predEnd, dep.lagDays);
          if (newStartDate < minStartFS) {
            errors.push(`Task phải bắt đầu sau ${predecessor.name} (FS${dep.lagDays > 0 ? '+' + dep.lagDays : dep.lagDays < 0 ? dep.lagDays : ''})`);
          }
          break;

        case DependencyType.SS: // Start-to-Start
          const minStartSS = addDays(predStart, dep.lagDays);
          if (newStartDate < minStartSS) {
            errors.push(`Task phải bắt đầu cùng hoặc sau ${predecessor.name} (SS${dep.lagDays > 0 ? '+' + dep.lagDays : dep.lagDays < 0 ? dep.lagDays : ''})`);
          }
          break;

        case DependencyType.FF: // Finish-to-Finish
          const minEndFF = addDays(predEnd, dep.lagDays);
          if (newEndDate < minEndFF) {
            errors.push(`Task phải kết thúc cùng hoặc sau ${predecessor.name} (FF${dep.lagDays > 0 ? '+' + dep.lagDays : dep.lagDays < 0 ? dep.lagDays : ''})`);
          }
          break;

        case DependencyType.SF: // Start-to-Finish
          const minEndSF = addDays(predStart, dep.lagDays);
          if (newEndDate < minEndSF) {
            errors.push(`Task phải kết thúc sau khi ${predecessor.name} bắt đầu (SF${dep.lagDays > 0 ? '+' + dep.lagDays : dep.lagDays < 0 ? dep.lagDays : ''})`);
          }
          break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate cascading updates for dependent (successor) tasks
 */
export function calculateCascadingUpdates(
  movedNode: WBSNode,
  newStartDate: Date,
  newEndDate: Date,
  allNodes: WBSNode[]
): Map<string, { plannedStartDate: string; plannedEndDate: string }> {
  const updates = new Map<string, { plannedStartDate: string; plannedEndDate: string }>();
  const flatNodes = flattenTree(allNodes);

  // Find all successors (tasks that depend on this node)
  const successors = flatNodes.filter(n => 
    n.predecessors?.some(dep => dep.nodeId === movedNode.id)
  );

  for (const successor of successors) {
    const dep = successor.predecessors?.find(d => d.nodeId === movedNode.id);
    if (!dep) continue;

    let newSuccessorStart: Date | null = null;
    let newSuccessorEnd: Date | null = null;
    const successorDuration = successor.durationDays || 1;

    switch (dep.type) {
      case DependencyType.FS: // Finish-to-Start
        // Successor must start after moved node finishes (+ lag)
        newSuccessorStart = addDays(newEndDate, dep.lagDays);
        newSuccessorEnd = addDays(newSuccessorStart, successorDuration);
        break;

      case DependencyType.SS: // Start-to-Start
        // Successor must start when moved node starts (+ lag)
        newSuccessorStart = addDays(newStartDate, dep.lagDays);
        newSuccessorEnd = addDays(newSuccessorStart, successorDuration);
        break;

      case DependencyType.FF: // Finish-to-Finish
        // Successor must finish when moved node finishes (+ lag)
        newSuccessorEnd = addDays(newEndDate, dep.lagDays);
        newSuccessorStart = addDays(newSuccessorEnd, -successorDuration);
        break;

      case DependencyType.SF: // Start-to-Finish
        // Successor must finish when moved node starts (+ lag)
        newSuccessorEnd = addDays(newStartDate, dep.lagDays);
        newSuccessorStart = addDays(newSuccessorEnd, -successorDuration);
        break;
    }

    if (newSuccessorStart && newSuccessorEnd) {
      // Check if successor actually needs to be moved
      const currentStart = successor.plannedStartDate ? new Date(successor.plannedStartDate) : null;
      const currentEnd = successor.plannedEndDate ? new Date(successor.plannedEndDate) : null;

      // Only update if dates changed significantly (> 1 day difference)
      if (currentStart && currentEnd) {
        const startDiff = Math.abs(differenceInDays(newSuccessorStart, currentStart));
        const endDiff = Math.abs(differenceInDays(newSuccessorEnd, currentEnd));

        if (startDiff > 0 || endDiff > 0) {
          updates.set(successor.id, {
            plannedStartDate: newSuccessorStart.toISOString(),
            plannedEndDate: newSuccessorEnd.toISOString(),
          });

          // Recursively calculate cascading updates for this successor's successors
          const cascadedUpdates = calculateCascadingUpdates(
            successor,
            newSuccessorStart,
            newSuccessorEnd,
            allNodes
          );

          // Merge cascaded updates
          cascadedUpdates.forEach((value, key) => {
            if (!updates.has(key)) {
              updates.set(key, value);
            }
          });
        }
      } else {
        // No current dates, apply update
        updates.set(successor.id, {
          plannedStartDate: newSuccessorStart.toISOString(),
          plannedEndDate: newSuccessorEnd.toISOString(),
        });
      }
    }
  }

  return updates;
}

/**
 * Flatten tree to get all nodes
 */
function flattenTree(nodes: WBSNode[]): WBSNode[] {
  const result: WBSNode[] = [];
  const traverse = (node: WBSNode) => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return result;
}

/**
 * Calculate earliest possible start date based on predecessors
 */
export function calculateEarliestStart(
  node: WBSNode,
  allNodes: WBSNode[]
): Date | null {
  if (!node.predecessors || node.predecessors.length === 0) {
    return null; // No constraints, can start anytime
  }

  let earliestStart: Date | null = null;

  for (const dep of node.predecessors) {
    const predecessor = allNodes.find(n => n.id === dep.nodeId);
    if (!predecessor?.plannedStartDate || !predecessor?.plannedEndDate) continue;

    const predStart = new Date(predecessor.plannedStartDate);
    const predEnd = new Date(predecessor.plannedEndDate);
    let constraintDate: Date;

    switch (dep.type) {
      case DependencyType.FS:
        constraintDate = addDays(predEnd, dep.lagDays);
        break;
      case DependencyType.SS:
        constraintDate = addDays(predStart, dep.lagDays);
        break;
      case DependencyType.FF:
        // For FF, we need to know task duration to calculate start
        const duration = node.durationDays || 1;
        constraintDate = addDays(addDays(predEnd, dep.lagDays), -duration);
        break;
      case DependencyType.SF:
        const dur = node.durationDays || 1;
        constraintDate = addDays(addDays(predStart, dep.lagDays), -dur);
        break;
      default:
        continue;
    }

    if (!earliestStart || constraintDate > earliestStart) {
      earliestStart = constraintDate;
    }
  }

  return earliestStart;
}
