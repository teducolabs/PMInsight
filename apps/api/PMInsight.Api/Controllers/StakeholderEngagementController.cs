using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Application.StakeholderEngagement.Commands;
using PMInsight.Application.StakeholderEngagement.Dtos;
using PMInsight.Application.StakeholderEngagement.Queries;

namespace PMInsight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/stakeholder-engagement")]
public class StakeholderEngagementController : ControllerBase
{
    private readonly IMediator _mediator;

    public StakeholderEngagementController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ===== History Endpoints =====

    [HttpGet("history/{stakeholderId}")]
    public async Task<ActionResult<IEnumerable<StakeholderEngagementHistoryDto>>> GetHistory(string stakeholderId)
    {
        var query = new GetStakeholderEngagementHistoryQuery { StakeholderId = stakeholderId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("history")]
    public async Task<ActionResult<StakeholderEngagementHistoryDto>> CreateHistory([FromBody] CreateEngagementHistoryRequest request)
    {
        var command = new CreateEngagementHistoryCommand
        {
            StakeholderId = request.StakeholderId,
            ActionId = request.ActionId,
            Type = request.Type,
            Title = request.Title,
            Description = request.Description,
            Outcome = request.Outcome,
            Feedback = request.Feedback,
            Sentiment = request.Sentiment,
            PerformedAt = request.PerformedAt,
            NextAction = request.NextAction,
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetHistory), new { stakeholderId = result.StakeholderId }, result);
    }

    // ===== Action Endpoints =====

    [HttpGet("actions/{stakeholderId}")]
    public async Task<ActionResult<IEnumerable<StakeholderEngagementActionDto>>> GetActions(string stakeholderId)
    {
        var query = new GetStakeholderEngagementActionsQuery { StakeholderId = stakeholderId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("actions")]
    public async Task<ActionResult<StakeholderEngagementActionDto>> CreateAction([FromBody] CreateEngagementActionRequest request)
    {
        var command = new CreateEngagementActionCommand
        {
            StakeholderId = request.StakeholderId,
            Title = request.Title,
            Description = request.Description,
            Quadrant = request.Quadrant,
            Priority = request.Priority,
            DueDate = request.DueDate,
            AssignedTo = request.AssignedTo,
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetActions), new { stakeholderId = result.StakeholderId }, result);
    }

    [HttpPut("actions/{id}")]
    public async Task<ActionResult<StakeholderEngagementActionDto>> UpdateAction(string id, [FromBody] UpdateEngagementActionRequest request)
    {
        var command = new UpdateEngagementActionCommand
        {
            Id = id,
            Status = request.Status,
            CompletedDate = request.CompletedDate,
            Notes = request.Notes,
            DueDate = request.DueDate,
            AssignedTo = request.AssignedTo,
        };

        var result = await _mediator.Send(command);
        return Ok(result);
    }
}
