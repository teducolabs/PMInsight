using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Helpers;

/// <summary>
/// Helper class to calculate critical path using Critical Path Method (CPM)
/// </summary>
public static class CriticalPathCalculator
{
    /// <summary>
    /// Calculate critical path for all nodes in the WBS tree
    /// Updates: EarlyStart, EarlyFinish, LateStart, LateFinish, TotalFloat, FreeFloat, IsCritical
    /// </summary>
    public static void CalculateCriticalPath(List<WBSNode> tree)
    {
        // Get all task and milestone nodes (flatten tree)
        var allNodes = FlattenTree(tree);
        var taskNodes = allNodes.Where(n => n.Type == Domain.Enums.WBSNodeType.Task || 
                                            n.Type == Domain.Enums.WBSNodeType.Milestone).ToList();
        
        if (taskNodes.Count == 0) return;
        
        // Create node lookup dictionary
        var nodeDict = taskNodes.ToDictionary(n => n.Id, n => n);
        
        // Forward pass - Calculate Early Start and Early Finish
        ForwardPass(taskNodes, nodeDict);
        
        // Backward pass - Calculate Late Start and Late Finish
        BackwardPass(taskNodes, nodeDict);
        
        // Calculate floats and mark critical path
        CalculateFloatsAndCriticalPath(taskNodes);
    }
    
    private static void ForwardPass(List<WBSNode> nodes, Dictionary<string, WBSNode> nodeDict)
    {
        // Start with nodes that have no predecessors
        var processedNodes = new HashSet<string>();
        var queue = new Queue<WBSNode>();
        
        // Initialize nodes without predecessors
        foreach (var node in nodes.Where(n => n.Predecessors == null || n.Predecessors.Count == 0))
        {
            node.EarlyStart = node.PlannedStartDate ?? DateTime.Today;
            node.EarlyFinish = CalculateFinishDate(node.EarlyStart.Value, node.DurationDays ?? 0);
            processedNodes.Add(node.Id);
            queue.Enqueue(node);
        }
        
        // Process nodes with predecessors
        while (queue.Count > 0)
        {
            var currentNode = queue.Dequeue();
            
            // Find all successors (nodes that have this node as predecessor)
            var successors = nodes.Where(n => 
                n.Predecessors != null && 
                n.Predecessors.Any(p => p.ActivityId == currentNode.Id)
            ).ToList();
            
            foreach (var successor in successors)
            {
                // Check if all predecessors are processed
                var allPredecessorsProcessed = successor.Predecessors!
                    .All(p => processedNodes.Contains(p.ActivityId));
                
                if (!allPredecessorsProcessed)
                    continue;
                
                // Calculate early start based on all predecessors
                DateTime earliestStart = DateTime.MinValue;
                
                foreach (var pred in successor.Predecessors!)
                {
                    if (!nodeDict.TryGetValue(pred.ActivityId, out var predNode))
                        continue;
                    
                    DateTime predFinish = predNode.EarlyFinish ?? predNode.PlannedEndDate ?? DateTime.Today;
                    DateTime calculatedStart;
                    
                    switch (pred.Type)
                    {
                        case Domain.Enums.DependencyType.FS: // Finish-to-Start
                            calculatedStart = predFinish.AddDays(pred.LagDays);
                            break;
                        case Domain.Enums.DependencyType.SS: // Start-to-Start
                            calculatedStart = (predNode.EarlyStart ?? predNode.PlannedStartDate ?? DateTime.Today)
                                .AddDays(pred.LagDays);
                            break;
                        case Domain.Enums.DependencyType.FF: // Finish-to-Finish
                            var duration = successor.DurationDays ?? 0;
                            calculatedStart = predFinish.AddDays(pred.LagDays - duration);
                            break;
                        case Domain.Enums.DependencyType.SF: // Start-to-Finish
                            var predStart = predNode.EarlyStart ?? predNode.PlannedStartDate ?? DateTime.Today;
                            calculatedStart = predStart.AddDays(pred.LagDays - (successor.DurationDays ?? 0));
                            break;
                        default:
                            calculatedStart = predFinish.AddDays(pred.LagDays);
                            break;
                    }
                    
                    if (calculatedStart > earliestStart)
                        earliestStart = calculatedStart;
                }
                
                successor.EarlyStart = earliestStart;
                successor.EarlyFinish = CalculateFinishDate(earliestStart, successor.DurationDays ?? 0);
                
                processedNodes.Add(successor.Id);
                queue.Enqueue(successor);
            }
        }
    }
    
    private static void BackwardPass(List<WBSNode> nodes, Dictionary<string, WBSNode> nodeDict)
    {
        // Start with nodes that have no successors
        var processedNodes = new HashSet<string>();
        var queue = new Queue<WBSNode>();
        
        // Find nodes without successors and set their late finish
        var nodesWithSuccessors = new HashSet<string>(
            nodes.SelectMany(n => n.Predecessors?.Select(p => p.ActivityId) ?? Enumerable.Empty<string>())
        );
        
        var endNodes = nodes.Where(n => !nodesWithSuccessors.Contains(n.Id)).ToList();
        
        // Find the latest finish date
        DateTime projectEnd = endNodes.Max(n => n.EarlyFinish ?? n.PlannedEndDate ?? DateTime.Today);
        
        foreach (var node in endNodes)
        {
            node.LateFinish = projectEnd;
            node.LateStart = CalculateStartDate(projectEnd, node.DurationDays ?? 0);
            processedNodes.Add(node.Id);
            queue.Enqueue(node);
        }
        
        // Process predecessors
        while (queue.Count > 0)
        {
            var currentNode = queue.Dequeue();
            
            if (currentNode.Predecessors == null || currentNode.Predecessors.Count == 0)
                continue;
            
            foreach (var pred in currentNode.Predecessors)
            {
                if (!nodeDict.TryGetValue(pred.ActivityId, out var predNode))
                    continue;
                
                if (processedNodes.Contains(predNode.Id))
                    continue;
                
                // Calculate late finish for predecessor
                DateTime lateFinish;
                
                switch (pred.Type)
                {
                    case Domain.Enums.DependencyType.FS: // Finish-to-Start
                        lateFinish = (currentNode.LateStart ?? DateTime.Today).AddDays(-pred.LagDays);
                        break;
                    case Domain.Enums.DependencyType.SS: // Start-to-Start
                        lateFinish = (currentNode.LateStart ?? DateTime.Today)
                            .AddDays(-pred.LagDays + (predNode.DurationDays ?? 0));
                        break;
                    case Domain.Enums.DependencyType.FF: // Finish-to-Finish
                        lateFinish = (currentNode.LateFinish ?? DateTime.Today).AddDays(-pred.LagDays);
                        break;
                    case Domain.Enums.DependencyType.SF: // Start-to-Finish
                        lateFinish = (currentNode.LateFinish ?? DateTime.Today)
                            .AddDays(-pred.LagDays + (predNode.DurationDays ?? 0));
                        break;
                    default:
                        lateFinish = (currentNode.LateStart ?? DateTime.Today).AddDays(-pred.LagDays);
                        break;
                }
                
                if (predNode.LateFinish == null || lateFinish < predNode.LateFinish)
                {
                    predNode.LateFinish = lateFinish;
                    predNode.LateStart = CalculateStartDate(lateFinish, predNode.DurationDays ?? 0);
                }
                
                processedNodes.Add(predNode.Id);
                queue.Enqueue(predNode);
            }
        }
    }
    
    private static void CalculateFloatsAndCriticalPath(List<WBSNode> nodes)
    {
        foreach (var node in nodes)
        {
            if (node.EarlyStart == null || node.LateStart == null)
                continue;
            
            // Total Float = Late Start - Early Start
            node.TotalFloat = (decimal)(node.LateStart.Value - node.EarlyStart.Value).TotalDays;
            
            // Free Float = minimum (Early Start of successors) - Early Finish
            var successors = nodes.Where(n => 
                n.Predecessors != null && 
                n.Predecessors.Any(p => p.ActivityId == node.Id)
            ).ToList();
            
            if (successors.Any())
            {
                var minSuccessorEarlyStart = successors.Min(s => s.EarlyStart ?? DateTime.MaxValue);
                if (node.EarlyFinish.HasValue && minSuccessorEarlyStart != DateTime.MaxValue)
                {
                    node.FreeFloat = (decimal)(minSuccessorEarlyStart - node.EarlyFinish.Value).TotalDays;
                }
            }
            else
            {
                node.FreeFloat = node.TotalFloat;
            }
            
            // Critical path: Total Float <= 0 (or very small threshold)
            node.IsCritical = node.TotalFloat <= 0.5m; // Allow 0.5 day tolerance
        }
    }
    
    private static DateTime CalculateFinishDate(DateTime startDate, int durationDays)
    {
        // Simple calculation - in real scenario you might want to skip weekends
        return startDate.AddDays(Math.Max(0, durationDays));
    }
    
    private static DateTime CalculateStartDate(DateTime finishDate, int durationDays)
    {
        return finishDate.AddDays(-Math.Max(0, durationDays));
    }
    
    private static List<WBSNode> FlattenTree(List<WBSNode> tree)
    {
        var result = new List<WBSNode>();
        
        foreach (var node in tree)
        {
            result.Add(node);
            result.AddRange(FlattenTree(node.Children));
        }
        
        return result;
    }
}
