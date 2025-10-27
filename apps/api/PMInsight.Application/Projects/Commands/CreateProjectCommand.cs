using FluentValidation;
using MediatR;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Projects.Commands;

public record CreateProjectCommand : IRequest<ProjectDto>
{
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public ProjectStatus Status { get; init; } = ProjectStatus.Initiating;
    public required string Priority { get; init; } // Frontend enum as string
    public required DateTime StartDate { get; init; }
    public required DateTime EndDate { get; init; }
    public double? Budget { get; init; }
    public string Currency { get; init; } = "VND";
    public required string ProjectManagerId { get; init; }
    public string? SponsorId { get; init; }
    public string? TemplateId { get; init; }
}

public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(20)
            .Matches("^[A-Z0-9-]+$")
            .WithMessage("Code must contain only uppercase letters, numbers, and hyphens");

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .MaximumLength(1000);

        RuleFor(x => x.Priority)
            .NotEmpty()
            .Must(p => p is "Low" or "Medium" or "High" or "Critical")
            .WithMessage("Priority must be Low, Medium, High, or Critical");

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .LessThan(x => x.EndDate)
            .WithMessage("Start date must be before end date");

        RuleFor(x => x.EndDate)
            .NotEmpty();

        RuleFor(x => x.Budget)
            .GreaterThan(0)
            .When(x => x.Budget.HasValue);

        RuleFor(x => x.ProjectManagerId)
            .NotEmpty();

        RuleFor(x => x.Currency)
            .NotEmpty()
            .MaximumLength(3);
    }
}