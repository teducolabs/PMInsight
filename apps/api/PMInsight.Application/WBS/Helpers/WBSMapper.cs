using PMInsight.Application.Resources.Dtos;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Helpers;

public static class WBSMapper
{
    // Helper to flatten WBS tree for lookups
    private static Dictionary<string, WBSNode> FlattenTree(List<WBSNode> tree)
    {
        var dict = new Dictionary<string, WBSNode>();
        
        void Flatten(WBSNode node)
        {
            dict[node.Id] = node;
            foreach (var child in node.Children)
            {
                Flatten(child);
            }
        }
        
        foreach (var node in tree)
        {
            Flatten(node);
        }
        
        return dict;
    }
    
    public static WBSDto MapToDto(Domain.Entities.WBS wbs)
    {
        // Flatten tree for dependency lookups
        var nodeDict = FlattenTree(wbs.Tree);
        
        return new WBSDto
        {
            Id = wbs.Id,
            ProjectId = wbs.ProjectId,
            OrganizationId = wbs.OrganizationId,
            Tree = wbs.Tree.Select(n => MapNodeToDto(n, nodeDict)).ToList(),
            Version = wbs.Version,
            BaselineRef = wbs.BaselineRef,
            LockedBy = wbs.LockedBy,
            LockedAt = wbs.LockedAt,
            CreatedAt = wbs.CreatedAt,
            UpdatedAt = wbs.UpdatedAt,
        };
    }
    
    public static WBSNodeDto MapNodeToDto(WBSNode node, Dictionary<string, WBSNode>? nodeDict = null)
    {
        return new WBSNodeDto
        {
            Id = node.Id,
            Name = node.Name,
            Code = node.Code,
            Description = node.Description,
            Type = node.Type,
            Level = node.Level,
            SortOrder = node.SortOrder,
            Children = node.Children.Select(c => MapNodeToDto(c, nodeDict)).ToList(),
            ScheduleMode = node.ScheduleMode,
            PlannedStartDate = node.PlannedStartDate,
            PlannedEndDate = node.PlannedEndDate,
            DurationDays = node.DurationDays,
            ActualStartDate = node.ActualStartDate,
            ActualEndDate = node.ActualEndDate,
            ActualDurationDays = node.ActualDurationDays,
            PercentComplete = node.PercentComplete,
            Status = node.Status,
            Predecessors = node.Predecessors.Select(p => new WBSNodeDependencyDto
            {
                NodeId = p.NodeId,
                NodeName = nodeDict?.TryGetValue(p.NodeId, out var predNode) == true ? predNode.Name : string.Empty,
                NodeCode = nodeDict?.TryGetValue(p.NodeId, out var predNode2) == true ? predNode2.Code : null,
                Type = p.Type,
                LagDays = p.LagDays
            }).ToList(),
            Successors = node.Successors.Select(s => new WBSNodeDependencyDto
            {
                NodeId = s.NodeId,
                NodeName = nodeDict?.TryGetValue(s.NodeId, out var succNode) == true ? succNode.Name : string.Empty,
                NodeCode = nodeDict?.TryGetValue(s.NodeId, out var succNode2) == true ? succNode2.Code : null,
                Type = s.Type,
                LagDays = s.LagDays
            }).ToList(),
            AssignedUserIds = node.AssignedUserIds,
            ResourceAssignments = node.ResourceAssignments.Select(ra => new ResourceAssignmentDto
            {
                Id = ra.Id,
                UserId = ra.UserId,
                UserName = null, // Will be populated by handler if needed
                UserEmail = null,
                AllocationPercent = ra.AllocationPercent,
                AssignmentStartDate = ra.AssignmentStartDate,
                AssignmentEndDate = ra.AssignmentEndDate,
                EstimatedHours = ra.EstimatedHours,
                ActualHours = ra.ActualHours,
                PlannedCost = ra.PlannedCost,
                ActualCost = ra.ActualCost,
                Currency = ra.Currency,
                Role = ra.Role,
                IsPrimary = ra.IsPrimary,
                Notes = ra.Notes,
                CreatedAt = ra.CreatedAt,
                UpdatedAt = ra.UpdatedAt
            }).ToList(),
            EstimatedHours = node.EstimatedHours,
            ActualHours = node.ActualHours,
            PlannedCost = node.PlannedCost,
            ActualCost = node.ActualCost,
            Currency = node.Currency,
            Constraint = node.Constraint != null ? new WBSNodeConstraintDto
            {
                Type = node.Constraint.Type,
                ConstraintDate = node.Constraint.ConstraintDate
            } : null,
            Priority = node.Priority,
            IsCritical = node.IsCritical,
            TotalFloat = node.TotalFloat,
            FreeFloat = node.FreeFloat,
            EarlyStart = node.EarlyStart,
            EarlyFinish = node.EarlyFinish,
            LateStart = node.LateStart,
            LateFinish = node.LateFinish,
            Baseline = node.Baseline != null ? new WBSNodeBaselineDto
            {
                StartDate = node.Baseline.StartDate,
                EndDate = node.Baseline.EndDate,
                DurationDays = node.Baseline.DurationDays,
                PlannedCost = node.Baseline.PlannedCost,
                BaselineDate = node.Baseline.BaselineDate,
                BaselineVersion = node.Baseline.BaselineVersion
            } : null,
            Deliverables = node.Deliverables,
            AcceptanceCriteria = node.AcceptanceCriteria,
            ResponsibleOrganization = node.ResponsibleOrganization,
            ResponsibleUserId = node.ResponsibleUserId,
            Assumptions = node.Assumptions,
            ScopeConstraints = node.ScopeConstraints,
            Notes = node.Notes,
            Tags = node.Tags
        };
    }
    
    /// <summary>
    /// Find a node by ID in the tree
    /// </summary>
    public static WBSNode? FindNodeById(List<WBSNode> tree, string nodeId)
    {
        foreach (var node in tree)
        {
            if (node.Id == nodeId)
                return node;
                
            var found = FindNodeById(node.Children, nodeId);
            if (found != null)
                return found;
        }
        
        return null;
    }
    
    /// <summary>
    /// Update a node in the tree
    /// </summary>
    public static bool UpdateNodeInTree(List<WBSNode> tree, string nodeId, Action<WBSNode> updateAction)
    {
        foreach (var node in tree)
        {
            if (node.Id == nodeId)
            {
                updateAction(node);
                return true;
            }
            
            if (UpdateNodeInTree(node.Children, nodeId, updateAction))
                return true;
        }
        
        return false;
    }
    
    /// <summary>
    /// Remove a node from the tree
    /// </summary>
    public static bool RemoveNodeFromTree(List<WBSNode> tree, string nodeId)
    {
        for (int i = 0; i < tree.Count; i++)
        {
            if (tree[i].Id == nodeId)
            {
                tree.RemoveAt(i);
                return true;
            }
            
            if (RemoveNodeFromTree(tree[i].Children, nodeId))
                return true;
        }
        
        return false;
    }
    
    /// <summary>
    /// Add a node to parent or root
    /// </summary>
    public static bool AddNodeToTree(List<WBSNode> tree, WBSNode newNode, string? parentId)
    {
        if (string.IsNullOrEmpty(parentId))
        {
            tree.Add(newNode);
            return true;
        }
        
        foreach (var node in tree)
        {
            if (node.Id == parentId)
            {
                node.Children.Add(newNode);
                return true;
            }
            
            if (AddNodeToTree(node.Children, newNode, parentId))
                return true;
        }
        
        return false;
    }
}
