using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Handlers;

/// <summary>
/// Handler for inserting a new WBS node at a specific position
/// Supports MS Project-style operations: Insert Above, Insert Below, Add Child
/// </summary>
public class InsertWBSNodeCommandHandler : IRequestHandler<InsertWBSNodeCommand, WBSNodeDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public InsertWBSNodeCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSNodeDto> Handle(InsertWBSNodeCommand request, CancellationToken cancellationToken)
    {
        // Load WBS
        var wbs = await _wbsRepository.GetByIdAsync(request.WBSId, cancellationToken);
        
        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("WBS not found or access denied");
        }

        // Check if locked by someone else
        if (!string.IsNullOrEmpty(wbs.LockedBy) && wbs.LockedBy != _currentUserService.UserId)
        {
            throw new InvalidOperationException("WBS is locked by another user");
        }

        // Find target node to verify it exists
        var targetNode = WBSMapper.FindNodeById(wbs.Tree, request.TargetNodeId);
        if (targetNode == null)
        {
            throw new InvalidOperationException($"Target node {request.TargetNodeId} not found");
        }

        // Create new node
        var newNode = new WBSNode
        {
            Name = request.Name,
            Code = request.Code, // Will be reassigned by AssignSequenceIds
            Description = request.Description,
            Type = request.Type,
            PlannedStartDate = request.PlannedStartDate,
            PlannedEndDate = request.PlannedEndDate,
            DurationDays = request.DurationDays,
            AssignedUserIds = request.AssignedUserIds ?? new List<string>(),
            EstimatedHours = request.EstimatedHours ?? 0,
            PlannedCost = request.PlannedCost,
        };

        // Insert at specified position
        bool inserted = WBSMapper.InsertNodeAtPosition(
            wbs.Tree, 
            newNode, 
            request.TargetNodeId, 
            request.Position
        );
        
        if (!inserted)
        {
            throw new InvalidOperationException($"Failed to insert node at position {request.Position}");
        }

        // Auto-assign sequence IDs and WBS codes (1, 2, 3... and WBS-1.1, WBS-1.2, etc.)
        WBSMapper.AssignSequenceIds(wbs.Tree);

        // Increment version
        wbs.Version++;
        
        // Save
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return WBSMapper.MapNodeToDto(newNode);
    }
}
