using FluentValidation;
using MediatR;
using PMInsight.Application.StakeholderEngagement.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.StakeholderEngagement.Commands;

public record UpdateEngagementActionCommand : IRequest<StakeholderEngagementActionDto>
{
    public required string Id { get; init; }
    public EngagementActionStatus? Status { get; init; }
    public DateTime? CompletedDate { get; init; }
    public string? Notes { get; init; }
    public DateTime? DueDate { get; init; }
    public string? AssignedTo { get; init; }
}

public class UpdateEngagementActionCommandValidator : AbstractValidator<UpdateEngagementActionCommand>
{
    public UpdateEngagementActionCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}
