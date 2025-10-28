using FluentValidation;
using MediatR;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Commands;

public record UpdateStakeholderCommand : IRequest<StakeholderDto>
{
    public required string Id { get; init; }
    public string? Name { get; init; }
    public string? Role { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Type { get; init; }
    public int? Influence { get; init; }
    public int? Interest { get; init; }
    public string? CommunicationPreference { get; init; }
    public string? Notes { get; init; }
}

public class UpdateStakeholderCommandValidator : AbstractValidator<UpdateStakeholderCommand>
{
    public UpdateStakeholderCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Name)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Role)
            .MaximumLength(200)
            .When(x => !string.IsNullOrEmpty(x.Role));

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Type)
            .Must(x => x is "Internal" or "External" or "Customer" or "Vendor" or "Partner")
            .WithMessage("Type must be one of: Internal, External, Customer, Vendor, Partner")
            .When(x => !string.IsNullOrEmpty(x.Type));

        RuleFor(x => x.Influence)
            .InclusiveBetween(1, 5)
            .When(x => x.Influence.HasValue);

        RuleFor(x => x.Interest)
            .InclusiveBetween(1, 5)
            .When(x => x.Interest.HasValue);

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}