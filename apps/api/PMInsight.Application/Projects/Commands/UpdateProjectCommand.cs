using FluentValidation;
using MediatR;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Projects.Commands;

public record UpdateProjectCommand : IRequest<ProjectDto>
{
    public required string Id { get; init; }
    public string? Code { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
    public ProjectStatus? Status { get; init; }
    public string? Priority { get; init; } // Low, Medium, High, Critical
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public DateTime? ActualStartDate { get; init; }
    public DateTime? ActualEndDate { get; init; }
    public double? Budget { get; init; }
    public string? Currency { get; init; }
    public int? Progress { get; init; }
    public string? Health { get; init; } // Green, Yellow, Red
    public string? ProjectManagerId { get; init; }
    public string? SponsorId { get; init; }
}

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Name)
            .MaximumLength(200)
            .When(x => x.Name != null);

        RuleFor(x => x.Code)
            .MaximumLength(50)
            .When(x => x.Code != null);

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description != null);

        RuleFor(x => x.StartDate)
            .LessThan(x => x.EndDate!.Value)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("Start date must be before end date");

        RuleFor(x => x.Budget)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Budget.HasValue);

        RuleFor(x => x.Progress)
            .InclusiveBetween(0, 100)
            .When(x => x.Progress.HasValue);

        RuleFor(x => x.Priority)
            .Must(p => p is "Low" or "Medium" or "High" or "Critical")
            .When(x => x.Priority != null)
            .WithMessage("Priority must be Low, Medium, High, or Critical");

        RuleFor(x => x.Health)
            .Must(h => h == "Green" || h == "Yellow" || h == "Red")
            .When(x => x.Health != null)
            .WithMessage("Health must be Green, Yellow, or Red");
    }
}