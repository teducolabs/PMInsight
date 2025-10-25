using FluentValidation;
using MediatR;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Stakeholders.Commands;

public record UpdateStakeholderCommand : IRequest<StakeholderDto>
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Role { get; init; }
    public required InfluenceLevel Influence { get; init; }
    public required InterestLevel Interest { get; init; }
    public string? EngagementPlan { get; init; }
    public required IEnumerable<ContactDto> Contacts { get; init; }
}

public class UpdateStakeholderCommandValidator : AbstractValidator<UpdateStakeholderCommand>
{
    public UpdateStakeholderCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Role)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.EngagementPlan)
            .MaximumLength(500);

        RuleFor(x => x.Contacts)
            .NotEmpty();

        RuleForEach(x => x.Contacts)
            .ChildRules(contact =>
            {
                contact.RuleFor(x => x.Type)
                    .NotEmpty()
                    .Must(x => Enum.TryParse<ContactType>(x, out _))
                    .WithMessage("Invalid contact type");

                contact.RuleFor(x => x.Value)
                    .NotEmpty()
                    .MaximumLength(200);
            });
    }
}