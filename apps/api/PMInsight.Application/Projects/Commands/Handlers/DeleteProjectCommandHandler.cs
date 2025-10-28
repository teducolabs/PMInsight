using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Projects.Commands.Handlers;

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, bool>
{
    private readonly IRepository<Project> _projectRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteProjectCommandHandler(
        IRepository<Project> projectRepository,
        ICurrentUserService currentUserService
    )
    {
        _projectRepository = projectRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(
        DeleteProjectCommand request,
        CancellationToken cancellationToken
    )
    {
        var project = await _projectRepository.GetByIdAsync(request.Id);

        if (project == null)
        {
            return false;
        }

        // Ensure user has access to this project
        if (project.OrganizationId != _currentUserService.OrganizationId)
        {
            return false;
        }

        await _projectRepository.DeleteAsync(request.Id);

        return true;
    }
}
