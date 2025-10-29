using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Handlers;

public class CreateWBSNodeCommandHandler : IRequestHandler<CreateWBSNodeCommand, WBSNodeDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateWBSNodeCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSNodeDto> Handle(CreateWBSNodeCommand request, CancellationToken cancellationToken)
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

        // Create new node
        var newNode = new WBSNode
        {
            Name = request.Name,
            Code = request.Code,
            Description = request.Description,
            Type = request.Type,
            PlannedStartDate = request.PlannedStartDate,
            PlannedEndDate = request.PlannedEndDate,
            DurationDays = request.DurationDays,
            AssignedUserIds = request.AssignedUserIds ?? new List<string>(),
            EstimatedHours = request.EstimatedHours ?? 0,
            PlannedCost = request.PlannedCost,
        };

        // Add to tree
        bool added = WBSMapper.AddNodeToTree(wbs.Tree, newNode, request.ParentNodeId);
        
        if (!added && !string.IsNullOrEmpty(request.ParentNodeId))
        {
            throw new InvalidOperationException($"Parent node {request.ParentNodeId} not found");
        }

        // Calculate level
        if (string.IsNullOrEmpty(request.ParentNodeId))
        {
            newNode.Level = 1;
        }
        else
        {
            var parent = WBSMapper.FindNodeById(wbs.Tree, request.ParentNodeId);
            newNode.Level = parent!.Level + 1;
        }

        wbs.Version++;
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return WBSMapper.MapNodeToDto(newNode);
    }
}
