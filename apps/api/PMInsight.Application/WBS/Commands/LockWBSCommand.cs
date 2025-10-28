using MediatR;

namespace PMInsight.Application.WBS.Commands;

public record LockWBSCommand(string Id) : IRequest<bool>;

public record UnlockWBSCommand(string Id) : IRequest<bool>;
