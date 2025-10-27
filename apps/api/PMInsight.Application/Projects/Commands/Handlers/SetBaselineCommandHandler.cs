using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Projects.Commands.Handlers;

public class SetBaselineCommandHandler : IRequestHandler<SetBaselineCommand, bool>
{
    private readonly IRepository<Project> _projectRepository;
    private readonly ICurrentUserService _currentUserService;

    public SetBaselineCommandHandler(
        IRepository<Project> projectRepository,
        ICurrentUserService currentUserService)
    {
        _projectRepository = projectRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(SetBaselineCommand request, CancellationToken cancellationToken)
    {
        var project = await _projectRepository.GetByIdAsync(request.Id, cancellationToken);
        
        if (project == null)
        {
            throw new NotFoundException($"Project {request.Id} not found");
        }

        if (project.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to update this project");
        }

        // Create new baseline
        var baseline = new Baseline
        {
            Version = project.Baselines.Count + 1,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId ?? "System"
        };

        project.Baselines.Add(baseline);
        await _projectRepository.UpdateAsync(project.Id, project, cancellationToken);

        return true;
    }
}
