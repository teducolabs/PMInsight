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

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<StakeholderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<StakeholderDto>>> GetProjectStakeholders(
        [FromQuery] string projectId,
        [FromQuery] string? category = null,
        [FromQuery] double? minInfluence = null,
        [FromQuery] double? minInterest = null,
        [FromQuery] string? searchText = null,
        [FromQuery] int pageSize = 20,
        [FromQuery] int pageNumber = 1)
    {
        var query = new GetProjectStakeholdersQuery
        {
            ProjectId = projectId,
            MinInfluence = (int?)Math.Round(minInfluence ?? 0),
            MinInterest = (int?)Math.Round(minInterest ?? 0),
            SearchText = searchText,
            PageSize = pageSize,
            PageNumber = pageNumber
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("matrix/{projectId}")]
    [ProducesResponseType(typeof(StakeholderMatrixDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StakeholderMatrixDto>> GetStakeholderMatrix(string projectId)
    {
        var result = await _mediator.Send(new GetStakeholderMatrixQuery { ProjectId = projectId });
        return Ok(result);
    }

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

    [HttpPost]
    [ProducesResponseType(typeof(StakeholderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<StakeholderDto>> CreateStakeholder(CreateStakeholderCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetStakeholder), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(StakeholderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StakeholderDto>> UpdateStakeholder(string id, UpdateStakeholderCommand command)
    {
        if (id != command.Id)
            return BadRequest();

        var result = await _mediator.Send(command);
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStakeholder(string id)
    {
        var result = await _mediator.Send(new DeleteStakeholderCommand(id));
        if (!result)
            return NotFound();

        return Ok();
    }
}