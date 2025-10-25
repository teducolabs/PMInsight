namespace PMInsight.Application.Common.Models;

public class PaginatedResponse<T>
{
    public required IEnumerable<T> Items { get; init; }
    public required int PageNumber { get; init; }
    public required int PageSize { get; init; }
    public required int TotalCount { get; init; }
    public bool HasNextPage => PageNumber * PageSize < TotalCount;
}

public class PaginatedRequest
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}