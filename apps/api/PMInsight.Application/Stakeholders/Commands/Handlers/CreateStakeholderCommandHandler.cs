using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Commands.Handlers;

public class CreateStakeholderCommandHandler
    : IRequestHandler<CreateStakeholderCommand, StakeholderDto>
{
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateStakeholderCommandHandler(
        IRepository<Stakeholder> stakeholderRepository,
        IRepository<Project> projectRepository,
        ICurrentUserService currentUserService)
    {
        _stakeholderRepository = stakeholderRepository;
        _projectRepository = projectRepository;
        _currentUserService = currentUserService;
    }

    public async Task<StakeholderDto> Handle(CreateStakeholderCommand request, CancellationToken cancellationToken)
    {
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project {request.ProjectId} not found");
        }

        if (project.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException(
                "You don't have permission to create stakeholders for this project"
            );
        }

        var stakeholder = new Stakeholder
        {
            ProjectId = request.ProjectId,
            OrganizationId = _currentUserService.OrganizationId,
            Name = request.Name,
            Role = request.Role,
            Influence = request.Influence switch
            {
                double i when i < 0.33 => InfluenceLevel.Low,
                double i when i < 0.66 => InfluenceLevel.Medium,
                _ => InfluenceLevel.High
            },
            Interest = request.Interest switch
            {
                double i when i < 0.33 => InterestLevel.Low,
                double i when i < 0.66 => InterestLevel.Medium,
                _ => InterestLevel.High
            },
            EngagementPlan = request.EngagementStrategy,
            Contacts = new List<Contact>
            {
                new Contact
                {
                    Type = ContactType.Email,
                    Value = request.ContactInfo
                }
            }
        };

        await _stakeholderRepository.CreateAsync(stakeholder, cancellationToken);

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
            }).ToList(),
            CreatedAt = stakeholder.CreatedAt,
            UpdatedAt = stakeholder.UpdatedAt
        };
    }
}