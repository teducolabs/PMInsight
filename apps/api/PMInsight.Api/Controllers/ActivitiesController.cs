using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Application.Activities.Commands;
using PMInsight.Application.Activities.Dtos;
using PMInsight.Application.Activities.Queries;

namespace PMInsight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/projects/{projectId}/activities")]
public class ActivitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActivitiesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all activities for a project
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ActivityDto>>> GetActivities(
        string projectId,
        [FromQuery] string? wbsNodeId = null,
        [FromQuery] bool? isCritical = null)
    {
        var query = new GetActivitiesQuery
        {
            ProjectId = projectId,
            WbsNodeId = wbsNodeId,
            IsCritical = isCritical
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get activity by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ActivityDto>> GetActivity(string projectId, string id)
    {
        var query = new GetActivityByIdQuery
        {
            ProjectId = projectId,
            Id = id
        };

        var result = await _mediator.Send(query);
        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    /// <summary>
    /// Get critical path for project
    /// </summary>
    [HttpGet("critical-path")]
    public async Task<ActionResult<List<ActivityDto>>> GetCriticalPath(string projectId)
    {
        var query = new GetCriticalPathQuery
        {
            ProjectId = projectId
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Create new activity
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ActivityDto>> CreateActivity(
        string projectId,
        [FromBody] CreateActivityDto dto)
    {
        var command = new CreateActivityCommand
        {
            ProjectId = projectId,
            Name = dto.Name,
            Code = dto.Code,
            Description = dto.Description,
            WbsNodeId = dto.WbsNodeId,
            PlannedStartDate = dto.PlannedStartDate,
            PlannedEndDate = dto.PlannedEndDate,
            DurationDays = dto.DurationDays,
            Status = dto.Status,
            PercentComplete = dto.PercentComplete,
            AssignedUserIds = dto.AssignedUserIds,
            EstimatedHours = dto.EstimatedHours,
            PlannedCost = dto.PlannedCost,
            ConstraintType = dto.ConstraintType,
            ConstraintDate = dto.ConstraintDate
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetActivity), new { projectId, id = result.Id }, result);
    }

    /// <summary>
    /// Update activity
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ActivityDto>> UpdateActivity(
        string projectId,
        string id,
        [FromBody] UpdateActivityDto dto)
    {
        var command = new UpdateActivityCommand
        {
            ProjectId = projectId,
            Id = id,
            Name = dto.Name,
            Code = dto.Code,
            Description = dto.Description,
            WbsNodeId = dto.WbsNodeId,
            PlannedStartDate = dto.PlannedStartDate,
            PlannedEndDate = dto.PlannedEndDate,
            DurationDays = dto.DurationDays,
            ActualStartDate = dto.ActualStartDate,
            ActualEndDate = dto.ActualEndDate,
            PercentComplete = dto.PercentComplete,
            Status = dto.Status,
            AssignedUserIds = dto.AssignedUserIds,
            EstimatedHours = dto.EstimatedHours,
            ActualHours = dto.ActualHours,
            PlannedCost = dto.PlannedCost,
            ActualCost = dto.ActualCost,
            Notes = dto.Notes
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }

    /// <summary>
    /// Add dependency between activities
    /// </summary>
    [HttpPost("{id}/dependencies")]
    public async Task<ActionResult> AddDependency(
        string projectId,
        string id,
        [FromBody] AddDependencyDto dto)
    {
        var command = new AddDependencyCommand
        {
            ProjectId = projectId,
            SuccessorId = id,
            PredecessorId = dto.PredecessorId,
            Type = dto.Type,
            LagDays = dto.LagDays
        };

        await _mediator.Send(command);
        return NoContent();
    }

    /// <summary>
    /// Calculate critical path for project
    /// </summary>
    [HttpPost("calculate-critical-path")]
    public async Task<ActionResult> CalculateCriticalPath(string projectId)
    {
        var command = new CalculateCriticalPathCommand
        {
            ProjectId = projectId
        };

        await _mediator.Send(command);
        return NoContent();
    }
}
