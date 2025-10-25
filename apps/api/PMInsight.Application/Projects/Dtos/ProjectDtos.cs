namespace PMInsight.Application.Projects.Dtos;

public record ProjectDto
{
    public required string Id { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required string Status { get; init; }
    public required DateTime StartDate { get; init; }
    public required DateTime EndDate { get; init; }
    public double? Budget { get; init; }
    public required string OwnerId { get; init; }
    public required string OwnerName { get; init; }
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