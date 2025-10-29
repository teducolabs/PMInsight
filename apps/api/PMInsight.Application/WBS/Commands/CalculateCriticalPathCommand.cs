using MediatR;
using PMInsight.Application.WBS.Dtos;

namespace PMInsight.Application.WBS.Commands;

/// <summary>
/// Command to calculate critical path for a WBS schedule
/// </summary>
public record CalculateCriticalPathCommand(string WBSId) : IRequest<WBSDto>;
