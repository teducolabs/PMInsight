using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

public class UpdateWBSNodeCommandHandler : IRequestHandler<UpdateWBSNodeCommand, WBSNodeDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateWBSNodeCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSNodeDto> Handle(UpdateWBSNodeCommand request, CancellationToken cancellationToken)
    {
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

        // Find and update node
        var node = WBSMapper.FindNodeById(wbs.Tree, request.NodeId);
        if (node == null)
        {
            throw new InvalidOperationException($"Node {request.NodeId} not found");
        }

        // Update fields if provided
        if (request.Name != null) node.Name = request.Name;
        if (request.Description != null) node.Description = request.Description;
        if (request.ScheduleMode.HasValue) node.ScheduleMode = request.ScheduleMode.Value;
        if (request.PlannedStartDate.HasValue) node.PlannedStartDate = request.PlannedStartDate;
        if (request.PlannedEndDate.HasValue) node.PlannedEndDate = request.PlannedEndDate;
        if (request.DurationDays.HasValue) node.DurationDays = request.DurationDays;
        if (request.ActualStartDate.HasValue) node.ActualStartDate = request.ActualStartDate;
        if (request.ActualEndDate.HasValue) node.ActualEndDate = request.ActualEndDate;
        if (request.PercentComplete.HasValue) node.PercentComplete = request.PercentComplete.Value;
        if (request.Status.HasValue) node.Status = request.Status.Value;
        if (request.AssignedUserIds != null) node.AssignedUserIds = request.AssignedUserIds;
        if (request.EstimatedHours.HasValue) node.EstimatedHours = request.EstimatedHours.Value;
        if (request.ActualHours.HasValue) node.ActualHours = request.ActualHours.Value;
        if (request.PlannedCost.HasValue) node.PlannedCost = request.PlannedCost;
        if (request.ActualCost.HasValue) node.ActualCost = request.ActualCost;
        if (request.Predecessors != null) node.Predecessors = request.Predecessors;
        if (request.Constraint != null) node.Constraint = request.Constraint;
        if (request.Priority.HasValue) node.Priority = request.Priority.Value;
        if (request.Notes != null) node.Notes = request.Notes;

        wbs.Version++;
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return WBSMapper.MapNodeToDto(node);
    }
}
