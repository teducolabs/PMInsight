using FluentValidation;
using MediatR;
using PMInsight.Application.Stakeholders.Dtos;

namespace PMInsight.Application.Stakeholders.Commands;

public record CreateStakeholderCommand : IRequest<StakeholderDto>
{
    public required string ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Organization { get; init; }
    public required string Role { get; init; }
    public required string ContactInfo { get; init; }
    public required string Category { get; init; }
    public required double Influence { get; init; }
    public required double Interest { get; init; }
    public string? ExpectationAndNeeds { get; init; }
    public string? EngagementStrategy { get; init; }
}

public class CreateStakeholderCommandValidator : AbstractValidator<CreateStakeholderCommand>
{
    public CreateStakeholderCommandValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Organization)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Role)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.ContactInfo)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Category)
            .NotEmpty()
            .Must(x => x is "Internal" or "External")
            .WithMessage("Category must be either 'Internal' or 'External'");

        RuleFor(x => x.Influence)
            .InclusiveBetween(1, 5)
            .WithMessage("Influence must be between 1 and 5");

        RuleFor(x => x.Interest)
            .InclusiveBetween(1, 5)
            .WithMessage("Interest must be between 1 and 5");

        RuleFor(x => x.ExpectationAndNeeds)
            .MaximumLength(500);

        RuleFor(x => x.EngagementStrategy)
            .MaximumLength(500);
    }
}