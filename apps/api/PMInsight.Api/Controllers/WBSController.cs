using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Api.Models;
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
    
    // ===== NODE MANAGEMENT ENDPOINTS =====
    
    /// <summary>
    /// Create a new WBS node (Summary/Task/Milestone)
    /// </summary>
    [HttpPost("{wbsId}/nodes")]
    [ProducesResponseType(typeof(WBSNodeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WBSNodeDto>> CreateNode(string wbsId, CreateWBSNodeRequest request)
    {
        var command = new CreateWBSNodeCommand
        {
            WBSId = wbsId,
            Name = request.Name,
            Code = request.Code,
            Description = request.Description,
            Type = request.Type,
            ParentNodeId = request.ParentNodeId,
            PlannedStartDate = request.PlannedStartDate,
            PlannedEndDate = request.PlannedEndDate,
            DurationDays = request.DurationDays,
            AssignedUserIds = request.AssignedUserIds,
            EstimatedHours = request.EstimatedHours,
            PlannedCost = request.PlannedCost,
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetWBS), new { id = wbsId }, result);
    }
    
    /// <summary>
    /// Update a WBS node
    /// </summary>
    [HttpPut("{wbsId}/nodes/{nodeId}")]
    [ProducesResponseType(typeof(WBSNodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WBSNodeDto>> UpdateNode(string wbsId, string nodeId, UpdateWBSNodeRequest request)
    {
        var command = new UpdateWBSNodeCommand
        {
            WBSId = wbsId,
            NodeId = nodeId,
            Name = request.Name,
            Description = request.Description,
            ScheduleMode = request.ScheduleMode,
            PlannedStartDate = request.PlannedStartDate,
            PlannedEndDate = request.PlannedEndDate,
            DurationDays = request.DurationDays,
            ActualStartDate = request.ActualStartDate,
            ActualEndDate = request.ActualEndDate,
            PercentComplete = request.PercentComplete,
            Status = request.Status,
            AssignedUserIds = request.AssignedUserIds,
            EstimatedHours = request.EstimatedHours,
            ActualHours = request.ActualHours,
            PlannedCost = request.PlannedCost,
            ActualCost = request.ActualCost,
            Predecessors = request.Predecessors,
            Constraint = request.Constraint,
            Priority = request.Priority,
            Notes = request.Notes,
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }
    
    /// <summary>
    /// Delete a WBS node
    /// </summary>
    [HttpDelete("{wbsId}/nodes/{nodeId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNode(string wbsId, string nodeId)
    {
        var result = await _mediator.Send(new DeleteWBSNodeCommand(wbsId, nodeId));
        if (!result)
            return NotFound();

        return NoContent();
    }
    
    /// <summary>
    /// Calculate critical path for the WBS schedule
    /// </summary>
    [HttpPost("{wbsId}/calculate-critical-path")]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WBSDto>> CalculateCriticalPath(string wbsId)
    {
        var result = await _mediator.Send(new CalculateCriticalPathCommand(wbsId));
        return Ok(result);
    }
    
    /// <summary>
    /// Add a dependency between two nodes
    /// </summary>
    [HttpPost("{wbsId}/nodes/{nodeId}/dependencies")]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WBSDto>> AddDependency(
        string wbsId, 
        string nodeId, 
        AddDependencyRequest request)
    {
        var command = new AddNodeDependencyCommand
        {
            WBSId = wbsId,
            NodeId = nodeId,
            PredecessorNodeId = request.PredecessorNodeId,
            Type = request.Type,
            LagDays = request.LagDays
        };
        
        var result = await _mediator.Send(command);
        return Ok(result);
    }
    
    /// <summary>
    /// Remove a dependency from a node
    /// </summary>
    [HttpDelete("{wbsId}/nodes/{nodeId}/dependencies/{predecessorNodeId}")]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WBSDto>> RemoveDependency(
        string wbsId, 
        string nodeId, 
        string predecessorNodeId)
    {
        var command = new RemoveNodeDependencyCommand
        {
            WBSId = wbsId,
            NodeId = nodeId,
            PredecessorNodeId = predecessorNodeId
        };
        
        var result = await _mediator.Send(command);
        return Ok(result);
    }
    
    /// <summary>
    /// Update node progress (quick update)
    /// </summary>
    [HttpPatch("{wbsId}/nodes/{nodeId}/progress")]
    [ProducesResponseType(typeof(WBSDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WBSDto>> UpdateProgress(
        string wbsId,
        string nodeId,
        UpdateProgressRequest request)
    {
        var command = new UpdateNodeProgressCommand
        {
            WBSId = wbsId,
            NodeId = nodeId,
            PercentComplete = request.PercentComplete,
            ActualStartDate = request.ActualStartDate,
            ActualEndDate = request.ActualEndDate,
            ActualHours = request.ActualHours,
            ActualCost = request.ActualCost
        };
        
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
