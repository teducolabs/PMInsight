using FluentValidation;
using MediatR;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Commands;

public record CreateStakeholderCommand : IRequest<StakeholderDto>
{
    public required string ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Role { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public required string Type { get; init; } // StakeholderType as string
    public required int Influence { get; init; } // 1-5
    public required int Interest { get; init; } // 1-5
    public string? CommunicationPreference { get; init; }
    public string? Notes { get; init; }
}

public class CreateStakeholderCommandValidator : AbstractValidator<CreateStakeholderCommand>
{
    public CreateStakeholderCommandValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Role)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Type)
            .NotEmpty()
            .Must(x => x is "Internal" or "External" or "Customer" or "Vendor" or "Partner")
            .WithMessage("Type must be one of: Internal, External, Customer, Vendor, Partner");

        RuleFor(x => x.Influence)
            .InclusiveBetween(1, 5)
            .WithMessage("Influence must be between 1 and 5");

        RuleFor(x => x.Interest)
            .InclusiveBetween(1, 5)
            .WithMessage("Interest must be between 1 and 5");

        RuleFor(x => x.Notes)
            .MaximumLength(1000);
    }
}