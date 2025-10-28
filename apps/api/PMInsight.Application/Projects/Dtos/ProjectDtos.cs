namespace PMInsight.Application.Projects.Dtos;

public record ProjectDto
{
    public required string Id { get; init; }
    public required string OrganizationId { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required string Status { get; init; }
    public required string Priority { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public double? Budget { get; init; }
    public required string Currency { get; init; }
    public int Progress { get; init; }
    public required string Health { get; init; }
    public required string ProjectManagerId { get; init; }
    public string? ProjectManagerName { get; init; }
    public string? SponsorId { get; init; }
    public string? SponsorName { get; init; }
    public string? TemplateId { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}

public record CreateProjectDto
{
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required DateTime StartDate { get; init; }
    public required DateTime EndDate { get; init; }
    public double? Budget { get; init; }
}

public record UpdateProjectDto
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required DateTime StartDate { get; init; }
    public required DateTime EndDate { get; init; }
    public double? Budget { get; init; }
}

public record PaginatedResponse<T>
{
    public required IEnumerable<T> Items { get; init; }
    public required string? NextCursor { get; init; }
    public required int Total { get; init; }
}