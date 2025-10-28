using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Application.Common.Models;
using PMInsight.Application.Stakeholders.Commands;
using PMInsight.Application.Stakeholders.Dtos;
using PMInsight.Application.Stakeholders.Queries;

namespace PMInsight.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/stakeholders")]
public class StakeholdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public StakeholdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all stakeholders for a project with pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<StakeholderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<StakeholderDto>>> GetProjectStakeholders(
        [FromQuery] GetProjectStakeholdersRequest request)
    {
        var query = new GetProjectStakeholdersQuery
        {
            ProjectId = request.ProjectId,
            MinInfluence = request.MinInfluence,
            MinInterest = request.MinInterest,
            SearchText = request.SearchText,
            PageSize = request.PageSize,
            PageNumber = request.PageNumber
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Get stakeholder matrix for visualization
    /// </summary>
    [HttpGet("matrix/{projectId}")]
    [ProducesResponseType(typeof(StakeholderMatrixDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StakeholderMatrixDto>> GetStakeholderMatrix(string projectId)
    {
        var result = await _mediator.Send(new GetStakeholderMatrixQuery { ProjectId = projectId });
        return Ok(result);
    }

    /// <summary>
    /// Get a single stakeholder by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(StakeholderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StakeholderDto>> GetStakeholder(string id)
    {
        var result = await _mediator.Send(new GetStakeholderByIdQuery { Id = id });
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Create a new stakeholder
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(StakeholderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<StakeholderDto>> CreateStakeholder([FromBody] CreateStakeholderRequest request)
    {
        var command = new CreateStakeholderCommand
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Role = request.Role,
            Email = request.Email,
            Phone = request.Phone,
            Type = request.Type,
            Influence = request.Influence,
            Interest = request.Interest,
            CommunicationPreference = request.CommunicationPreference,
            Notes = request.Notes
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetStakeholder), new { id = result.Id }, result);
    }

    /// <summary>
    /// Update an existing stakeholder
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(StakeholderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StakeholderDto>> UpdateStakeholder(string id, [FromBody] UpdateStakeholderRequest request)
    {
        if (id != request.Id)
            return BadRequest("ID mismatch");

        var command = new UpdateStakeholderCommand
        {
            Id = request.Id,
            Name = request.Name,
            Role = request.Role,
            Email = request.Email,
            Phone = request.Phone,
            Type = request.Type,
            Influence = request.Influence,
            Interest = request.Interest,
            CommunicationPreference = request.CommunicationPreference,
            Notes = request.Notes
        };

        var result = await _mediator.Send(command);
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Delete a stakeholder
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStakeholder(string id)
    {
        var result = await _mediator.Send(new DeleteStakeholderCommand(id));
        if (!result)
            return NotFound();

        return NoContent();
    }
}