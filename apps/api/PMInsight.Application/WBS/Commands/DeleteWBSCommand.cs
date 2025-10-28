using MediatR;

namespace PMInsight.Application.WBS.Commands;

public record DeleteWBSCommand(string Id) : IRequest<bool>;
