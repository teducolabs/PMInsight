using FluentValidation;
using MediatR;
using PMInsight.Application.Projects.Dtos;

namespace PMInsight.Application.Projects.Commands;

public record CreateProjectCommand : IRequest<ProjectDto>
{
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required DateTime StartDate { get; init; }
    public required DateTime EndDate { get; init; }
    public double? Budget { get; init; }
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
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .LessThan(x => x.EndDate)
            .WithMessage("Start date must be before end date");

        RuleFor(x => x.EndDate)
            .NotEmpty();

        RuleFor(x => x.Budget)
            .GreaterThan(0)
            .When(x => x.Budget.HasValue);
    }
}