using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using PMInsight.Application.Services;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;
using PMInsight.Domain.Common;

namespace PMInsight.Application.Auth.Commands.Handlers;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResult>
{
    private readonly IRepository<User> _userRepository;
    private readonly IRepository<Organization> _orgRepository;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher<User> _passwordHasher;

    public RegisterCommandHandler(
        IRepository<User> userRepository,
        IRepository<Organization> orgRepository,
        ITokenService tokenService,
        IPasswordHasher<User> passwordHasher)
    {
        _userRepository = userRepository;
        _orgRepository = orgRepository;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<RegisterResult> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check if email is already registered
        var existingUser = await _userRepository.FindOneAsync(u => u.Email == request.Email);
        if (existingUser != null)
        {
            throw new ValidationException("Email is already registered");
        }

        // Create organization
        var organization = new Organization
        {
            OrganizationId = Guid.NewGuid().ToString(), // Set required OrganizationId
            Name = request.OrganizationName,
            Slug = request.OrganizationName.ToLower().Replace(" ", "-"),
            Description = null
        };
        
        organization = await _orgRepository.CreateAsync(organization, cancellationToken);

        // Create user with password hash
        var passwordHash = _passwordHasher.HashPassword(null!, request.Password);
        var user = new User
        {
            Email = request.Email,
            Name = request.Name,
            Phone = request.Phone,
            OrganizationId = organization.Id,
            Status = UserStatus.Active,
            PasswordHash = passwordHash,
            Roles = new List<UserRole> { UserRole.Owner } // First user is owner
        };

        // Hash password
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        // Generate refresh token
        user.RefreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        user = await _userRepository.CreateAsync(user, cancellationToken);

        // Generate access token
        var accessToken = _tokenService.GenerateAccessToken(user);

        return new RegisterResult
        {
            UserId = user.Id,
            OrganizationId = organization.Id,
            AccessToken = accessToken,
            RefreshToken = user.RefreshToken ?? string.Empty
        };
    }
}