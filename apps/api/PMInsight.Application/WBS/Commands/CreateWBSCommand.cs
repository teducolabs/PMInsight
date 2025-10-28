using MediatR;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Commands;

public record CreateWBSCommand : IRequest<WBSDto>
{
    public required string ProjectId { get; init; }
    public List<WBSNode> Tree { get; init; } = new();
}
