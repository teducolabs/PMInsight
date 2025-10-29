using FluentValidation;
using MediatR;
using PMInsight.Application.StakeholderEngagement.Dtos;

namespace PMInsight.Application.StakeholderEngagement.Commands;

public record CreateEngagementActionCommand : IRequest<StakeholderEngagementActionDto>
{
    public required string StakeholderId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Quadrant { get; init; }
    public required int Priority { get; init; }
    public DateTime? DueDate { get; init; }
    public string? AssignedTo { get; init; }
}

public class CreateEngagementActionCommandValidator : AbstractValidator<CreateEngagementActionCommand>
{
    public CreateEngagementActionCommandValidator()
    {
        RuleFor(x => x.StakeholderId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Quadrant).NotEmpty().Must(q => new[] { "manage-closely", "keep-satisfied", "keep-informed", "monitor" }.Contains(q))
            .WithMessage("Quadrant must be one of: manage-closely, keep-satisfied, keep-informed, monitor");
        RuleFor(x => x.Priority).InclusiveBetween(1, 4);
    }
}
