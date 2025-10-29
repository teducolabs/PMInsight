using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Helpers;

public static class WBSMapper
{
    public static WBSDto MapToDto(Domain.Entities.WBS wbs)
    {
        return new WBSDto
        {
            Id = wbs.Id,
            ProjectId = wbs.ProjectId,
            OrganizationId = wbs.OrganizationId,
            Tree = wbs.Tree.Select(MapNodeToDto).ToList(),
            Version = wbs.Version,
            BaselineRef = wbs.BaselineRef,
            LockedBy = wbs.LockedBy,
            LockedAt = wbs.LockedAt,
            CreatedAt = wbs.CreatedAt,
            UpdatedAt = wbs.UpdatedAt,
        };
    }
    
    public static WBSNodeDto MapNodeToDto(WBSNode node)
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
            Children = node.Children.Select(MapNodeToDto).ToList(),
            ScheduleMode = node.ScheduleMode,
            PlannedStartDate = node.PlannedStartDate,
            PlannedEndDate = node.PlannedEndDate,
            DurationDays = node.DurationDays,
            ActualStartDate = node.ActualStartDate,
            ActualEndDate = node.ActualEndDate,
            ActualDurationDays = node.ActualDurationDays,
            PercentComplete = node.PercentComplete,
            Status = node.Status,
            Predecessors = node.Predecessors.Select(p => new ActivityDependencyDto
            {
                ActivityId = p.ActivityId,
                Type = p.Type,
                LagDays = p.LagDays
            }).ToList(),
            Successors = node.Successors.Select(s => new ActivityDependencyDto
            {
                ActivityId = s.ActivityId,
                Type = s.Type,
                LagDays = s.LagDays
            }).ToList(),
            AssignedUserIds = node.AssignedUserIds,
            EstimatedHours = node.EstimatedHours,
            ActualHours = node.ActualHours,
            PlannedCost = node.PlannedCost,
            ActualCost = node.ActualCost,
            Currency = node.Currency,
            Constraint = node.Constraint != null ? new ActivityConstraintDto
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
            Baseline = node.Baseline != null ? new ActivityBaselineDto
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
