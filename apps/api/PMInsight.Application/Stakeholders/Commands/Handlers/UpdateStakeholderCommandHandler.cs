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

        // Update only the fields that are provided
        if (request.Name != null)
            stakeholder.Name = request.Name;
        
        if (request.Role != null)
            stakeholder.Role = request.Role;
        
        if (request.Email != null)
            stakeholder.Email = request.Email;
        
        if (request.Phone != null)
            stakeholder.Phone = request.Phone;
        
        if (request.Type != null)
            stakeholder.Type = Enum.Parse<StakeholderType>(request.Type);
        
        if (request.Influence.HasValue)
            stakeholder.Influence = (InfluenceLevel)request.Influence.Value;
        
        if (request.Interest.HasValue)
            stakeholder.Interest = (InterestLevel)request.Interest.Value;
        
        if (request.CommunicationPreference != null)
            stakeholder.CommunicationPreference = request.CommunicationPreference;
        
        if (request.Notes != null)
            stakeholder.Notes = request.Notes;
        
        stakeholder.UpdatedAt = DateTime.UtcNow;

        await _stakeholderRepository.UpdateAsync(stakeholder.Id, stakeholder, cancellationToken);

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