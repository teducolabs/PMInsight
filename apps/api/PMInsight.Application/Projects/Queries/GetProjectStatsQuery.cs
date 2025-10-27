using MediatR;

namespace PMInsight.Application.Projects.Queries;

public record GetProjectStatsQuery : IRequest<ProjectStatsDto>;

public record ProjectStatsDto
{
    public int TotalProjects { get; init; }
    public int ActiveProjects { get; init; }
    public int CompletedProjects { get; init; }
    public int OnHoldProjects { get; init; }
    public int RedProjects { get; init; }
    public int YellowProjects { get; init; }
    public int GreenProjects { get; init; }
}
