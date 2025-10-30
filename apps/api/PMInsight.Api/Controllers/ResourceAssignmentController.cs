using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Application.Resources.Commands;
using PMInsight.Application.Resources.Dtos;

namespace PMInsight.Api.Controllers;

/// <summary>
/// Resource Assignment Management Controller
/// Handles CRUD operations for resource assignments on WBS nodes
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/wbs/{wbsId}/nodes/{nodeId}/resources")]
public class ResourceAssignmentController : ControllerBase
{
    private readonly IMediator _mediator;

    public ResourceAssignmentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Add a resource assignment to a WBS node
    /// </summary>
    /// <remarks>
    /// Assigns a user to a specific WBS node with allocation percentage, role, and effort tracking.
    /// If isPrimary is true, any existing primary resource will be unset.
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(ResourceAssignmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ResourceAssignmentDto>> AddResourceAssignment(
        string wbsId,
        string nodeId,
        [FromBody] AddResourceAssignmentRequest request)
    {
        var command = new AddResourceAssignmentCommand
        {
            WbsId = wbsId,
            NodeId = nodeId,
            Request = request
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(
            nameof(AddResourceAssignment),
            new { wbsId, nodeId, assignmentId = result.Id },
            result);
    }

    /// <summary>
    /// Update a resource assignment
    /// </summary>
    /// <remarks>
    /// Updates allocation, role, hours, cost, or primary status.
    /// All fields are optional - only provided fields will be updated.
    /// </remarks>
    [HttpPut("{assignmentId}")]
    [ProducesResponseType(typeof(ResourceAssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ResourceAssignmentDto>> UpdateResourceAssignment(
        string wbsId,
        string nodeId,
        string assignmentId,
        [FromBody] UpdateResourceAssignmentRequest request)
    {
        var command = new UpdateResourceAssignmentCommand
        {
            WbsId = wbsId,
            NodeId = nodeId,
            AssignmentId = assignmentId,
            Request = request
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Remove a resource assignment from a WBS node
    /// </summary>
    /// <remarks>
    /// Removes the resource assignment and recalculates node effort/cost rollups.
    /// Also updates legacy AssignedUserIds if this was the last assignment for that user.
    /// </remarks>
    [HttpDelete("{assignmentId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> RemoveResourceAssignment(
        string wbsId,
        string nodeId,
        string assignmentId)
    {
        var command = new RemoveResourceAssignmentCommand
        {
            WbsId = wbsId,
            NodeId = nodeId,
            AssignmentId = assignmentId
        };

        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Quick update actual hours for a resource assignment
    /// </summary>
    /// <remarks>
    /// Convenient endpoint for timesheet integration.
    /// Updates only the actual hours and recalculates node rollups.
    /// </remarks>
    [HttpPatch("{assignmentId}/actual-hours")]
    [ProducesResponseType(typeof(ResourceAssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ResourceAssignmentDto>> UpdateResourceActualHours(
        string wbsId,
        string nodeId,
        string assignmentId,
        [FromBody] decimal actualHours)
    {
        if (actualHours < 0)
        {
            return BadRequest(new { message = "Actual hours cannot be negative" });
        }

        var command = new UpdateResourceActualHoursCommand
        {
            WbsId = wbsId,
            NodeId = nodeId,
            AssignmentId = assignmentId,
            ActualHours = actualHours
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
