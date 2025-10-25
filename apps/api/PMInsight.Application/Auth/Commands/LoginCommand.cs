using FluentValidation;
using MediatR;

namespace PMInsight.Application.Auth.Commands;

public record LoginCommand : IRequest<LoginResult>
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public string? TwoFactorCode { get; init; }
}

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();
            
        RuleFor(x => x.Password)
            .NotEmpty();
            
        RuleFor(x => x.TwoFactorCode)
            .Matches("^[0-9]{6}$").When(x => x.TwoFactorCode != null)
            .WithMessage("2FA code must be 6 digits");
    }
}

public record LoginResult
{
    public required string UserId { get; init; }
    public required string OrganizationId { get; init; }
    public required string Name { get; init; }
    public required bool RequiresTwoFactor { get; init; }
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
}