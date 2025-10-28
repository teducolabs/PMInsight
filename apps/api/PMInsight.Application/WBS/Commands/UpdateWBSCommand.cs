using MediatR;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Commands;

public record UpdateWBSCommand : IRequest<WBSDto>
{
    public required string Id { get; init; }
    public List<WBSNode> Tree { get; init; } = new();
}
