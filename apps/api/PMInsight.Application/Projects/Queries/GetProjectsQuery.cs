using MediatR;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Projects.Queries;

public record GetProjectsQuery : IRequest<PaginatedResponse<ProjectDto>>
{
    public ProjectStatus? Status { get; init; }
    public string? OwnerId { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public string? SearchText { get; init; }
    public int Limit { get; init; } = 20;
    public string? Cursor { get; init; }
}