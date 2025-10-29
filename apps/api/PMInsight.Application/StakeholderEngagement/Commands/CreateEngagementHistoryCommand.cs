using FluentValidation;
using MediatR;
using PMInsight.Application.StakeholderEngagement.Dtos;

namespace PMInsight.Application.StakeholderEngagement.Commands;

public record CreateEngagementHistoryCommand : IRequest<StakeholderEngagementHistoryDto>
{
    public required string StakeholderId { get; init; }
    public string? ActionId { get; init; }
    public required string Type { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public string? Outcome { get; init; }
    public string? Feedback { get; init; }
    public string? Sentiment { get; init; }
    public required DateTime PerformedAt { get; init; }
    public string? NextAction { get; init; }
}

public class CreateEngagementHistoryCommandValidator : AbstractValidator<CreateEngagementHistoryCommand>
{
    public CreateEngagementHistoryCommandValidator()
    {
        RuleFor(x => x.StakeholderId).NotEmpty();
        RuleFor(x => x.Type).NotEmpty().Must(type => new[] { "meeting", "email", "call", "update", "feedback", "other" }.Contains(type))
            .WithMessage("Type must be one of: meeting, email, call, update, feedback, other");
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Sentiment).Must(sentiment => sentiment == null || new[] { "positive", "neutral", "negative" }.Contains(sentiment))
            .WithMessage("Sentiment must be one of: positive, neutral, negative");
        RuleFor(x => x.PerformedAt).NotEmpty();
    }
}
