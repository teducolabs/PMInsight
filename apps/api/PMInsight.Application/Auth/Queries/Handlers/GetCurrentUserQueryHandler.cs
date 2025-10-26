using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Auth.Queries.Handlers;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, GetCurrentUserResult>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IRepository<User> _userRepository;

    public GetCurrentUserQueryHandler(
        ICurrentUserService currentUserService,
        IRepository<User> userRepository)
    {
        _currentUserService = currentUserService;
        _userRepository = userRepository;
    }

    public async Task<GetCurrentUserResult> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException("User not authenticated");
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        return new GetCurrentUserResult
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Roles = _currentUserService.Roles.ToList(),
            OrganizationId = user.OrganizationId
        };
    }
}
