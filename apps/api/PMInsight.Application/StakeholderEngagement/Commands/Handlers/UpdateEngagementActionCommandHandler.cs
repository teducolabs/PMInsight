using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.StakeholderEngagement.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.StakeholderEngagement.Commands.Handlers;

public class UpdateEngagementActionCommandHandler : IRequestHandler<UpdateEngagementActionCommand, StakeholderEngagementActionDto>
{
    private readonly IRepository<StakeholderEngagementAction> _actionRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateEngagementActionCommandHandler(
        IRepository<StakeholderEngagementAction> actionRepository,
        ICurrentUserService currentUserService)
    {
        _actionRepository = actionRepository;
        _currentUserService = currentUserService;
    }

    public async Task<StakeholderEngagementActionDto> Handle(UpdateEngagementActionCommand request, CancellationToken cancellationToken)
    {
        var action = await _actionRepository.GetByIdAsync(request.Id, cancellationToken);
        if (action == null)
        {
            throw new NotFoundException($"Engagement action {request.Id} not found");
        }

        if (action.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to update this engagement action");
        }

        // Update only provided fields
        if (request.Status.HasValue)
        {
            action.Status = request.Status.Value;
            
            // Auto-set CompletedDate when status changes to Completed
            if (request.Status.Value == EngagementActionStatus.Completed && action.CompletedDate == null)
            {
                action.CompletedDate = DateTime.UtcNow;
            }
        }

        if (request.CompletedDate.HasValue)
            action.CompletedDate = request.CompletedDate.Value;

        if (request.Notes != null)
            action.Notes = request.Notes;

        if (request.DueDate.HasValue)
            action.DueDate = request.DueDate.Value;

        if (request.AssignedTo != null)
            action.AssignedTo = request.AssignedTo;

        action.UpdatedAt = DateTime.UtcNow;

        await _actionRepository.UpdateAsync(action.Id, action, cancellationToken);

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
