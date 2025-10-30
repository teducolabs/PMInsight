using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Application.ProjectResources.Commands;
using PMInsight.Application.ProjectResources.Dtos;
using PMInsight.Application.ProjectResources.Queries;

namespace PMInsight.Api.Controllers;

/// <summary>
/// Controller for managing project resource pool
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/projects/{projectId}/resources")]
public class ProjectResourcesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectResourcesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all resources in project pool with utilization stats
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of resources with utilization data</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<ProjectResourceDto>), 200)]
    public async Task<ActionResult<List<ProjectResourceDto>>> GetResources(
        string projectId,
        CancellationToken cancellationToken)
    {
        var query = new GetProjectResourcesQuery { ProjectId = projectId };
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a new resource in project pool
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="request">Resource creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created resource</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ProjectResourceDto), 201)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ProjectResourceDto>> CreateResource(
        string projectId,
        [FromBody] CreateProjectResourceRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateProjectResourceCommand 
        { 
            ProjectId = projectId, 
            Request = request 
        };
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(
            nameof(GetResources), 
            new { projectId }, 
            result
        );
    }

    /// <summary>
    /// Update an existing resource in project pool
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="resourceId">Resource ID</param>
    /// <param name="request">Resource update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated resource</returns>
    [HttpPut("{resourceId}")]
    [ProducesResponseType(typeof(ProjectResourceDto), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ProjectResourceDto>> UpdateResource(
        string projectId,
        string resourceId,
        [FromBody] UpdateProjectResourceRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateProjectResourceCommand 
        { 
            ResourceId = resourceId, 
            Request = request 
        };
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Delete a resource from project pool
    /// Will fail if resource is assigned to any tasks
    /// </summary>
    /// <param name="projectId">Project ID</param>
    /// <param name="resourceId">Resource ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{resourceId}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<ActionResult> DeleteResource(
        string projectId, 
        string resourceId,
        CancellationToken cancellationToken)
    {
        var command = new DeleteProjectResourceCommand { ResourceId = resourceId };
        await _mediator.Send(command, cancellationToken);
        return NoContent();
    }
}
