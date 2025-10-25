using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using OtpNet;
using PMInsight.Application.Services;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Common;

namespace PMInsight.Application.Auth.Commands.Handlers;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IRepository<User> _userRepository;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher<User> _passwordHasher;

    public LoginCommandHandler(
        IRepository<User> userRepository,
        ITokenService tokenService,
        IPasswordHasher<User> passwordHasher)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // Find user by email
        var user = await _userRepository.FindOneAsync(u => u.Email == request.Email, cancellationToken);
        if (user == null)
        {
            throw new ValidationException("Invalid email or password");
        }

        // Verify password
        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            throw new ValidationException("Invalid email or password");
        }

        // Check 2FA if enabled
        if (user.TwoFactorEnabled)
        {
            if (string.IsNullOrEmpty(request.TwoFactorCode))
            {
                return new LoginResult
                {
                    UserId = user.Id,
                    OrganizationId = user.OrganizationId,
                    Name = user.Name,
                    RequiresTwoFactor = true,
                    AccessToken = "", // No token until 2FA verified
                    RefreshToken = "" // No refresh token until 2FA verified
                };
            }

            // Verify 2FA code
            var secret = Base32Encoding.ToBytes(user.TwoFactorSecret!);
            var totp = new Totp(secret);
            var isValid = totp.VerifyTotp(request.TwoFactorCode, out _, new VerificationWindow(2, 2));
            
            if (!isValid)
            {
                throw new ValidationException("Invalid 2FA code");
            }
        }

        // Update login timestamp
        user.LastLoginAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user.Id, user, cancellationToken);

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Save refresh token
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user.Id, user, cancellationToken);

        return new LoginResult
        {
            UserId = user.Id,
            OrganizationId = user.OrganizationId,
            Name = user.Name,
            RequiresTwoFactor = false,
            AccessToken = accessToken,
            RefreshToken = refreshToken
        };
    }
}