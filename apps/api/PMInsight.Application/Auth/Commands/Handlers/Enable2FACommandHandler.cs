using MediatR;
using Microsoft.AspNetCore.Http;
using OtpNet;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Auth.Commands.Handlers;

public class Enable2FACommandHandler : IRequestHandler<Enable2FACommand, Enable2FAResult>
{
    private readonly IRepository<User> _userRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public Enable2FACommandHandler(IRepository<User> userRepository, IHttpContextAccessor httpContextAccessor)
    {
        _userRepository = userRepository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Enable2FAResult> Handle(Enable2FACommand request, CancellationToken cancellationToken)
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

        // Generate new secret
        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(secretBytes);

        // Update user with secret (not enabled yet)
        user.TwoFactorSecret = secret;
        await _userRepository.UpdateAsync(user.Id, user, cancellationToken);

        // Generate QR code URL
        var qrCodeUrl = $"otpauth://totp/PMInsight:{user.Email}?secret={secret}&issuer=PMInsight";

        return new Enable2FAResult
        {
            Secret = secret,
            QrCodeUrl = qrCodeUrl
        };
    }
}