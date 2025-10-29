using MediatR;

namespace PMInsight.Application.WBS.Commands;

public record DeleteWBSNodeCommand(string WBSId, string NodeId) : IRequest<bool>;
