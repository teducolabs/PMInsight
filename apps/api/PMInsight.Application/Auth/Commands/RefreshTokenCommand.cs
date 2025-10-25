using MediatR;
using FluentValidation;

namespace PMInsight.Application.Auth.Commands;

public record RefreshTokenCommand : IRequest<RefreshTokenResult>
{
    public required string RefreshToken { get; init; }
}

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty();
    }
}

public record RefreshTokenResult
{
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
    public required DateTime AccessTokenExpiry { get; init; }
    public required DateTime RefreshTokenExpiry { get; init; }
}