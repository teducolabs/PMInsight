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
            Email = request.Email,
            Phone = request.Phone,
            Type = Enum.Parse<StakeholderType>(request.Type),
            Influence = (InfluenceLevel)request.Influence,
            Interest = (InterestLevel)request.Interest,
            CommunicationPreference = request.CommunicationPreference,
            Notes = request.Notes,
        };

        await _stakeholderRepository.CreateAsync(stakeholder, cancellationToken);

        return new StakeholderDto
        {
            Id = stakeholder.Id,
            ProjectId = stakeholder.ProjectId,
            Name = stakeholder.Name,
            Role = stakeholder.Role,
            Email = stakeholder.Email,
            Phone = stakeholder.Phone,
            Type = stakeholder.Type,
            Influence = stakeholder.Influence,
            Interest = stakeholder.Interest,
            CommunicationPreference = stakeholder.CommunicationPreference,
            Notes = stakeholder.Notes,
            CreatedAt = stakeholder.CreatedAt,
            UpdatedAt = stakeholder.UpdatedAt
        };
    }
}