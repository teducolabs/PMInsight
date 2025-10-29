using MediatR;
using PMInsight.Application.Resources.Dtos;

namespace PMInsight.Application.Resources.Commands;

/// <summary>
/// Command to add a resource assignment to a WBS node
/// </summary>
public record AddResourceAssignmentCommand : IRequest<ResourceAssignmentDto>
{
    public required string WbsId { get; init; }
    public required string NodeId { get; init; }
    public required AddResourceAssignmentRequest Request { get; init; }
}

/// <summary>
/// Command to update a resource assignment
/// </summary>
public record UpdateResourceAssignmentCommand : IRequest<ResourceAssignmentDto>
{
    public required string WbsId { get; init; }
    public required string NodeId { get; init; }
    public required string AssignmentId { get; init; }
    public required UpdateResourceAssignmentRequest Request { get; init; }
}

/// <summary>
/// Command to remove a resource assignment
/// </summary>
public record RemoveResourceAssignmentCommand : IRequest<Unit>
{
    public required string WbsId { get; init; }
    public required string NodeId { get; init; }
    public required string AssignmentId { get; init; }
}

/// <summary>
/// Command to update actual hours for a resource assignment
/// </summary>
public record UpdateResourceActualHoursCommand : IRequest<ResourceAssignmentDto>
{
    public required string WbsId { get; init; }
    public required string NodeId { get; init; }
    public required string AssignmentId { get; init; }
    public decimal ActualHours { get; init; }
}
