using FluentValidation;
using MediatR;
using PMInsight.Application.Projects.Dtos;

namespace PMInsight.Application.Projects.Commands;

public record UpdateProjectCommand : IRequest<ProjectDto>
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required DateTime StartDate { get; init; }
    public required DateTime EndDate { get; init; }
    public double? Budget { get; init; }
}

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

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