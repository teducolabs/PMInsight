using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.ProjectResources.Commands;

/// <summary>
/// Command to delete a resource from project pool
/// Will fail if resource has active assignments
/// </summary>
public record DeleteProjectResourceCommand : IRequest
{
    public required string ResourceId { get; init; }
}

/// <summary>
/// Handler for DeleteProjectResourceCommand
/// Performs soft delete only if no assignments exist
/// </summary>
public class DeleteProjectResourceCommandHandler 
    : IRequestHandler<DeleteProjectResourceCommand>
{
    private readonly ITenantRepository<ProjectResource> _resourceRepository;
    private readonly ITenantRepository<WBS> _wbsRepository;

    public DeleteProjectResourceCommandHandler(
        ITenantRepository<ProjectResource> resourceRepository,
        ITenantRepository<WBS> wbsRepository)
    {
        _resourceRepository = resourceRepository;
        _wbsRepository = wbsRepository;
    }

    public async Task Handle(
        DeleteProjectResourceCommand command, 
        CancellationToken cancellationToken)
    {
        var resource = await _resourceRepository.GetByIdAsync(
            command.ResourceId, 
            cancellationToken
        );

        if (resource == null)
        {
            throw new KeyNotFoundException(
                $"Project resource with ID '{command.ResourceId}' not found."
            );
        }

        // Check if resource is assigned to any tasks
        var wbsList = await _wbsRepository.FindAsync(
            w => w.ProjectId == resource.ProjectId, 
            cancellationToken
        );

        var hasAssignments = wbsList
            .SelectMany(w => w.Tree)
            .SelectMany(n => n.ResourceAssignments)
            .Any(a => a.ProjectResourceId == command.ResourceId);

        if (hasAssignments)
        {
            throw new InvalidOperationException(
                $"Cannot delete resource '{resource.ResourceName}' because it is assigned to one or more tasks. " +
                "Please remove all assignments first."
            );
        }

        // Soft delete
        resource.IsActive = false;
        resource.UpdatedAt = DateTime.UtcNow;
        await _resourceRepository.UpdateAsync(command.ResourceId, resource, cancellationToken);
    }
}
