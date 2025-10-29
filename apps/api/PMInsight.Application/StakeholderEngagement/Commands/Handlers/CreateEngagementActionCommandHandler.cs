using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.StakeholderEngagement.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.StakeholderEngagement.Commands.Handlers;

public class CreateEngagementActionCommandHandler : IRequestHandler<CreateEngagementActionCommand, StakeholderEngagementActionDto>
{
    private readonly IRepository<StakeholderEngagementAction> _actionRepository;
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateEngagementActionCommandHandler(
        IRepository<StakeholderEngagementAction> actionRepository,
        IRepository<Stakeholder> stakeholderRepository,
        ICurrentUserService currentUserService)
    {
        _actionRepository = actionRepository;
        _stakeholderRepository = stakeholderRepository;
        _currentUserService = currentUserService;
    }

    public async Task<StakeholderEngagementActionDto> Handle(CreateEngagementActionCommand request, CancellationToken cancellationToken)
    {
        var stakeholder = await _stakeholderRepository.GetByIdAsync(request.StakeholderId, cancellationToken);
        if (stakeholder == null)
        {
            throw new NotFoundException($"Stakeholder {request.StakeholderId} not found");
        }

        if (stakeholder.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to create engagement actions for this stakeholder");
        }

        var action = new StakeholderEngagementAction
        {
            OrganizationId = _currentUserService.OrganizationId,
            StakeholderId = request.StakeholderId,
            Title = request.Title,
            Description = request.Description,
            Quadrant = request.Quadrant,
            Priority = request.Priority,
            Status = EngagementActionStatus.NotStarted,
            DueDate = request.DueDate,
            AssignedTo = request.AssignedTo,
        };

        await _actionRepository.CreateAsync(action, cancellationToken);

        return new StakeholderEngagementActionDto
        {
            Id = action.Id,
            StakeholderId = action.StakeholderId,
            Title = action.Title,
            Description = action.Description,
            Quadrant = action.Quadrant,
            Priority = action.Priority,
            Status = action.Status,
            DueDate = action.DueDate,
            CompletedDate = action.CompletedDate,
            AssignedTo = action.AssignedTo,
            Notes = action.Notes,
            CreatedAt = action.CreatedAt,
            UpdatedAt = action.UpdatedAt,
        };
    }
}
