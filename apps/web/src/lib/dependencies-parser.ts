import { DependencyType, type WBSNode, type WBSNodeDependency } from '@/features/wbs';

/**
 * Parse dependency string into structured dependencies
 * Format: <sequenceId><Type><Lag>
 * Examples:
 * - "3FS" -> Task 3, Finish-to-Start, 0 lag
 * - "4FS+2d" -> Task 4, Finish-to-Start, +2 days lag
 * - "5SS-1d" -> Task 5, Start-to-Start, -1 days lead
 * - "3FS,5SS+1d" -> Multiple dependencies
 */
export function parseDependencyString(
  input: string,
  allNodes: WBSNode[]
): { dependencies: WBSNodeDependency[]; errors: string[] } {
  const dependencies: WBSNodeDependency[] = [];
  const errors: string[] = [];

  if (!input || input.trim() === '') {
    return { dependencies, errors };
  }

  // Split by comma for multiple dependencies
  const parts = input.split(',').map(p => p.trim()).filter(p => p !== '');

  for (const part of parts) {
    const result = parseSingleDependency(part, allNodes);
    if (result.dependency) {
      dependencies.push(result.dependency);
    }
    if (result.error) {
      errors.push(result.error);
    }
  }

  return { dependencies, errors };
}

/**
 * Parse single dependency string
 * Format: <sequenceId><Type>[+/-<days>d]
 * Examples: 3FS, 4FS+2d, 5SS-1d
 */
function parseSingleDependency(
  input: string,
  allNodes: WBSNode[]
): { dependency?: WBSNodeDependency; error?: string } {
  // Regex: digits + (FS|SS|FF|SF) + optional (+/-digits + d)
  const regex = /^(\d+)(FS|SS|FF|SF)(([+-]\d+)d?)?$/i;
  const match = input.match(regex);

  if (!match) {
    return { error: `Cú pháp không hợp lệ: "${input}". Ví dụ đúng: 3FS, 4FS+2d, 5SS-1d` };
  }

  const sequenceId = parseInt(match[1], 10);
  const type = match[2].toUpperCase() as DependencyType;
  const lagString = match[4] || '0';
  const lagDays = parseInt(lagString, 10);

  // Find node by sequenceId
  const targetNode = allNodes.find(n => n.sequenceId === sequenceId);

  if (!targetNode) {
    return { error: `Không tìm thấy task ID ${sequenceId}` };
  }

  // Validate dependency type
  if (!['FS', 'SS', 'FF', 'SF'].includes(type)) {
    return { error: `Loại dependency không hợp lệ: ${type}. Chỉ chấp nhận FS, SS, FF, SF` };
  }

  return {
    dependency: {
      nodeId: targetNode.id,
      nodeName: targetNode.name,
      nodeCode: targetNode.code,
      type,
      lagDays,
    },
  };
}

/**
 * Convert dependencies array to string format
 * Example: [3FS, 5SS+2d]
 */
export function dependenciesToString(
  dependencies: WBSNodeDependency[],
  allNodes: WBSNode[]
): string {
  if (!dependencies || dependencies.length === 0) {
    return '';
  }

  const parts = dependencies.map(dep => {
    const node = allNodes.find(n => n.id === dep.nodeId);
    if (!node?.sequenceId) {
      return `?${dep.type}`;
    }

    let str = `${node.sequenceId}${dep.type}`;
    if (dep.lagDays && dep.lagDays !== 0) {
      str += dep.lagDays > 0 ? `+${dep.lagDays}d` : `${dep.lagDays}d`;
    }
    return str;
  });

  return parts.join(',');
}

/**
 * Validate dependency logic
 * Check for:
 * - Circular dependencies
 * - Self-reference
 * - Invalid predecessor-successor relationships
 */
export function validateDependencies(
  nodeId: string,
  dependencies: WBSNodeDependency[],
  allNodes: WBSNode[]
): string[] {
  const warnings: string[] = [];
  const currentNode = allNodes.find(n => n.id === nodeId);

  if (!currentNode) return warnings;

  // Check for self-reference
  if (dependencies.some(d => d.nodeId === nodeId)) {
    warnings.push('⚠️ Task không thể phụ thuộc vào chính nó');
  }

  // Check for circular dependencies (simple check - can be enhanced)
  for (const dep of dependencies) {
    const predecessorNode = allNodes.find(n => n.id === dep.nodeId);
    if (predecessorNode) {
      // Check if predecessor depends on current node
      const hasCycle = predecessorNode.predecessors?.some((p: WBSNodeDependency) => p.nodeId === nodeId);
      if (hasCycle) {
        warnings.push(`⚠️ Phụ thuộc vòng tròn phát hiện với task ${predecessorNode.sequenceId || predecessorNode.name}`);
      }

      // Warn if using SF (rare and confusing)
      if (dep.type === DependencyType.SF) {
        warnings.push(`💡 SF (Start-to-Finish) hiếm dùng và dễ nhầm lẫn. Xem xét dùng FS hoặc SS`);
      }

      // Warn about large lag/lead
      if (Math.abs(dep.lagDays) > 30) {
        warnings.push(`💡 Lag/Lead ${dep.lagDays} ngày khá lớn. Kiểm tra lại logic`);
      }
    }
  }

  return warnings;
}

/**
 * Auto-assign sequence IDs to all nodes (1, 2, 3...)
 * Based on tree order (depth-first traversal)
 */
export function assignSequenceIds(nodes: WBSNode[]): WBSNode[] {
  let counter = 1;

  function traverse(node: WBSNode): WBSNode {
    const updated = { ...node, sequenceId: counter++ };
    if (node.children && node.children.length > 0) {
      updated.children = node.children.map(traverse);
    }
    return updated;
  }

  return nodes.map(traverse);
}
