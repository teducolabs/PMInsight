using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

/// <summary>
/// Handler for quickly updating node progress and actuals
/// </summary>
public class UpdateNodeProgressCommandHandler : IRequestHandler<UpdateNodeProgressCommand, WBSDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateNodeProgressCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto> Handle(UpdateNodeProgressCommand request, CancellationToken cancellationToken)
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

        // Update progress fields
        node.PercentComplete = (int)request.PercentComplete;
        
        if (request.ActualStartDate.HasValue)
            node.ActualStartDate = request.ActualStartDate;
        
        if (request.ActualEndDate.HasValue)
            node.ActualEndDate = request.ActualEndDate;
        
        if (request.ActualHours.HasValue)
            node.ActualHours = request.ActualHours.Value;
        
        if (request.ActualCost.HasValue)
            node.ActualCost = request.ActualCost;

        // Auto-update status based on progress
        if (request.PercentComplete >= 100)
        {
            node.Status = Domain.Enums.ActivityStatus.Completed;
            if (!node.ActualEndDate.HasValue)
                node.ActualEndDate = DateTime.UtcNow;
        }
        else if (request.PercentComplete > 0)
        {
            node.Status = Domain.Enums.ActivityStatus.InProgress;
            if (!node.ActualStartDate.HasValue)
                node.ActualStartDate = DateTime.UtcNow;
        }

        // Calculate actual duration if both dates are set
        if (node.ActualStartDate.HasValue && node.ActualEndDate.HasValue)
        {
            node.ActualDurationDays = (int)(node.ActualEndDate.Value - node.ActualStartDate.Value).TotalDays;
        }

        // Increment version and save
        wbs.Version++;
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return WBSMapper.MapToDto(wbs);
    }
}
