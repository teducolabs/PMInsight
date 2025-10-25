using System.Linq.Expressions;
using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Extensions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.Common.Models;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Queries.Handlers;

public class GetProjectStakeholdersQueryHandler : IRequestHandler<GetProjectStakeholdersQuery, PaginatedResponse<StakeholderDto>>
{
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly IRepository<Project> _projectRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetProjectStakeholdersQueryHandler(
        IRepository<Stakeholder> stakeholderRepository,
        IRepository<Project> projectRepository,
        ICurrentUserService currentUserService)
    {
        _stakeholderRepository = stakeholderRepository;
        _projectRepository = projectRepository;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResponse<StakeholderDto>> Handle(GetProjectStakeholdersQuery request, CancellationToken cancellationToken)
    {
        // Verify project exists and user has access
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project {request.ProjectId} not found");
        }

        if (project.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to view this project's stakeholders");
        }

        // Build up the filter predicate
        Expression<Func<Stakeholder, bool>> predicate = s => s.ProjectId == request.ProjectId;

        if (request.MinInfluence.HasValue)
        {
            Expression<Func<Stakeholder, bool>> influencePredicate = s => s.Influence >= (InfluenceLevel)request.MinInfluence.Value;
            predicate = predicate.And(influencePredicate);
        }

        if (request.MinInterest.HasValue)
        {
            Expression<Func<Stakeholder, bool>> interestPredicate = s => s.Interest >= (InterestLevel)request.MinInterest.Value;
            predicate = predicate.And(interestPredicate);
        }

        if (!string.IsNullOrEmpty(request.SearchText))
        {
            var searchText = request.SearchText.ToLower();
            Expression<Func<Stakeholder, bool>> searchPredicate = s =>
                s.Name.ToLower().Contains(searchText) ||
                s.Role.ToLower().Contains(searchText);
            predicate = predicate.And(searchPredicate);
        }

        var total = await _stakeholderRepository.CountAsync(predicate, cancellationToken);
        var items = await _stakeholderRepository.FindAsync(predicate, cancellationToken);

        // Apply pagination manually since repository doesn't support Skip/Take
        var pagedItems = items
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize);

        return new PaginatedResponse<StakeholderDto>
        {
            Items = pagedItems.Select(s => MapToDto(s)).ToList(),
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = (int)total
        };
    }

    private static StakeholderDto MapToDto(Stakeholder stakeholder)
    {
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