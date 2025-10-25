using MediatR;
using FluentValidation;

namespace PMInsight.Application.Auth.Commands;

public record Verify2FACommand : IRequest<Verify2FAResult>
{
    public required string Code { get; init; }
}

public class Verify2FACommandValidator : AbstractValidator<Verify2FACommand>
{
    public Verify2FACommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .Length(6)
            .Matches("^[0-9]+$").WithMessage("Code must contain only digits");
    }
}

public record Verify2FAResult
{
    public required bool Success { get; init; }
}