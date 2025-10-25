using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Commands.Handlers;

public class UpdateStakeholderCommandHandler : IRequestHandler<UpdateStakeholderCommand, StakeholderDto>
{
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateStakeholderCommandHandler(
        IRepository<Stakeholder> stakeholderRepository,
        ICurrentUserService currentUserService)
    {
        _stakeholderRepository = stakeholderRepository;
        _currentUserService = currentUserService;
    }

    public async Task<StakeholderDto> Handle(UpdateStakeholderCommand request, CancellationToken cancellationToken)
    {
        var stakeholder = await _stakeholderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (stakeholder == null)
        {
            throw new NotFoundException($"Stakeholder {request.Id} not found");
        }

        if (stakeholder.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to update this stakeholder");
        }

        stakeholder.Name = request.Name;
        stakeholder.Role = request.Role;
        stakeholder.Influence = request.Influence;
        stakeholder.Interest = request.Interest;
        stakeholder.EngagementPlan = request.EngagementPlan;
        stakeholder.Contacts = request.Contacts.Select(c => new Contact
        {
            Type = Enum.Parse<ContactType>(c.Type),
            Value = c.Value
        }).ToList();
        
        stakeholder.UpdatedAt = DateTime.UtcNow;

        await _stakeholderRepository.UpdateAsync(stakeholder.Id, stakeholder, cancellationToken);

        return new StakeholderDto
        {
            Id = stakeholder.Id,
            ProjectId = stakeholder.ProjectId,
            Name = stakeholder.Name,
            Role = stakeholder.Role,
            Influence = stakeholder.Influence.ToString(),
            Interest = stakeholder.Interest.ToString(),
            EngagementPlan = stakeholder.EngagementPlan ?? "",
            Contacts = stakeholder.Contacts.Select(c => new ContactDto
            {
                Type = c.Type.ToString(),
                Value = c.Value
            }),
            CreatedAt = stakeholder.CreatedAt,
            UpdatedAt = stakeholder.UpdatedAt
        };
    }
}