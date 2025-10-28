using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Dtos;

public record WBSDto
{
    public required string Id { get; init; }
    public required string ProjectId { get; init; }
    public required string OrganizationId { get; init; }
    public List<WBSNode> Tree { get; init; } = new();
    public int Version { get; init; }
    public string? BaselineRef { get; init; }
    public string? LockedBy { get; init; }
    public DateTime? LockedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
