using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Queries;
using PMInsight.Domain.Entities;

namespace PMInsight.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/wbs")]
public class WBSController : ControllerBase
{
    private readonly IMediator _mediator;

    public WBSController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get WBS by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WBSDto>> GetWBS(string id)
    {
        var result = await _mediator.Send(new GetWBSByIdQuery(id));
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get WBS for a specific project
    /// </summary>
    [HttpGet("project/{projectId}")]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WBSDto>> GetWBSByProject(string projectId)
    {
        var result = await _mediator.Send(new GetWBSByProjectIdQuery(projectId));
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Create a new WBS for a project
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WBSDto>> CreateWBS(CreateWBSRequest request)
    {
        var command = new CreateWBSCommand
        {
            ProjectId = request.ProjectId,
            Tree = request.Tree
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetWBS), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update WBS tree structure
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WBSDto>> UpdateWBS(string id, UpdateWBSRequest request)
    {
        var command = new UpdateWBSCommand
        {
            Id = id,
            Tree = request.Tree
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Delete WBS
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteWBS(string id)
    {
        var result = await _mediator.Send(new DeleteWBSCommand(id));
        if (!result)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Lock WBS for editing (prevents concurrent modifications)
    /// </summary>
    [HttpPost("{id}/lock")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> LockWBS(string id)
    {
        try
        {
            var result = await _mediator.Send(new LockWBSCommand(id));
            if (!result)
                return NotFound();

            return Ok(new { message = "WBS locked successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Unlock WBS
    /// </summary>
    [HttpPost("{id}/unlock")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UnlockWBS(string id)
    {
        try
        {
            var result = await _mediator.Send(new UnlockWBSCommand(id));
            if (!result)
                return NotFound();

            return Ok(new { message = "WBS unlocked successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }
}

/// <summary>
/// Request model for creating WBS
/// </summary>
public record CreateWBSRequest
{
    public required string ProjectId { get; init; }
    public List<WBSNode> Tree { get; init; } = new();
}

/// <summary>
/// Request model for updating WBS
/// </summary>
public record UpdateWBSRequest
{
    public List<WBSNode> Tree { get; init; } = new();
}
