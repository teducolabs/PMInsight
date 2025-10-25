using System.ComponentModel.DataAnnotations;
using FluentValidation;
using MediatR;

namespace PMInsight.Application.Auth.Commands;

public record RegisterCommand : IRequest<RegisterResult>
{
    public required string Email { get; init; }
    public required string Password { get; init; }
    public required string Name { get; init; }
    public required string OrganizationName { get; init; }
    public string? Phone { get; init; }
}

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(100);
            
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain at least one number")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character");
            
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);
            
        RuleFor(x => x.OrganizationName)
            .NotEmpty()
            .MaximumLength(100);
            
        RuleFor(x => x.Phone)
            .MaximumLength(20);
    }
}

public record RegisterResult
{
    public required string UserId { get; init; }
    public required string OrganizationId { get; init; }
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
}