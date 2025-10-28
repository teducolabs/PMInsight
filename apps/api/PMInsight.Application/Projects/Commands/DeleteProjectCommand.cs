using MediatR;

namespace PMInsight.Application.Projects.Commands;

public record DeleteProjectCommand(string Id) : IRequest<bool>;
