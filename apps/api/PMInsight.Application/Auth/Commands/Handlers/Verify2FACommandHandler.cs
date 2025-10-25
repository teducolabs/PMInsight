using MediatR;
using Microsoft.AspNetCore.Http;
using OtpNet;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Auth.Commands.Handlers;

public class Verify2FACommandHandler : IRequestHandler<Verify2FACommand, Verify2FAResult>
{
    private readonly IRepository<User> _userRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public Verify2FACommandHandler(IRepository<User> userRepository, IHttpContextAccessor httpContextAccessor)
    {
        _userRepository = userRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Verify2FAResult> Handle(Verify2FACommand request, CancellationToken cancellationToken)
    {
        var userId = _httpContextAccessor.HttpContext?.User.FindFirst("sub")?.Value;
        if (userId == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        if (string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            throw new InvalidOperationException("2FA not set up");
        }

        // Verify TOTP code
        var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
        var totp = new Totp(secretBytes);
        var window = new VerificationWindow(previous: 1, future: 1);

        var isValid = totp.VerifyTotp(request.Code, out _, window);
        if (!isValid)
        {
            return new Verify2FAResult { Success = false };
        }

        // Enable 2FA
        user.TwoFactorEnabled = true;
        await _userRepository.UpdateAsync(user.Id, user, cancellationToken);

        return new Verify2FAResult { Success = true };
    }
}