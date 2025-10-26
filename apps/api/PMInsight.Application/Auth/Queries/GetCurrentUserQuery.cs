using MediatR;

namespace PMInsight.Application.Auth.Queries;

public record GetCurrentUserQuery : IRequest<GetCurrentUserResult>;

public record GetCurrentUserResult
{
    public required string Id { get; init; }
    public required string Email { get; init; }
    public required string Name { get; init; }
    public required List<string> Roles { get; init; }
    public required string OrganizationId { get; init; }
}
