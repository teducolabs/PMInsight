using MediatR;
using PMInsight.Application.Services;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Auth.Commands.Handlers;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResult>
{
    private readonly IRepository<User> _userRepository;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(IRepository<User> userRepository, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<RefreshTokenResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // Find user by refresh token
        var user = await _userRepository.FindOneAsync(u => u.RefreshToken == request.RefreshToken, cancellationToken);
        if (user == null || user.RefreshTokenExpiry <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        // Generate new tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        
        // Update user with new refresh token
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user.Id, user, cancellationToken);

        return new RefreshTokenResult
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            AccessTokenExpiry = DateTime.UtcNow.AddMinutes(15),
            RefreshTokenExpiry = user.RefreshTokenExpiry ?? DateTime.UtcNow.AddDays(7)
        };
    }
}