using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMInsight.Api.Models;
using PMInsight.Application.Projects.Commands;
using PMInsight.Application.Projects.Dtos;
using PMInsight.Application.Projects.Queries;
using PMInsight.Domain.Enums;

namespace PMInsight.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<ProjectDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PaginatedResponse<ProjectDto>>> GetProjects(
        [FromQuery] ProjectStatus? status,
        [FromQuery] string? ownerId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? searchText,
        [FromQuery] int limit = 20,
        [FromQuery] string? cursor = null)
    {
        var query = new GetProjectsQuery
        {
            Status = status,
            OwnerId = ownerId,
            FromDate = fromDate,
            ToDate = toDate,
            SearchText = searchText,
            Limit = limit,
            Cursor = cursor
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(ProjectStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProjectStatsDto>> GetProjectStats()
    {
        var result = await _mediator.Send(new GetProjectStatsQuery());
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectDto>> GetProject(string id)
    {
        var result = await _mediator.Send(new GetProjectByIdQuery(id));
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectRequest request)
    {
        // Parse status enum
        if (!Enum.TryParse<ProjectStatus>(request.Status, ignoreCase: true, out var status))
        {
            return BadRequest($"Invalid status: {request.Status}");
        }

        // Map request to command
        var command = new CreateProjectCommand
        {
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            Status = status,
            Priority = request.Priority,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Budget = request.Budget,
            Currency = request.Currency,
            ProjectManagerId = request.ProjectManagerId,
            SponsorId = request.SponsorId,
            TemplateId = request.TemplateId
        };

        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetProject), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectDto>> UpdateProject(string id, UpdateProjectCommand command)
    {
        if (id != command.Id)
            return BadRequest();

        var result = await _mediator.Send(command);
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost("{id}/baseline")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetBaseline(string id)
    {
        var result = await _mediator.Send(new SetBaselineCommand(id));
        if (!result)
            return NotFound();

        return Ok();
    }
}