using MediatR;

namespace PMInsight.Application.Projects.Commands;

public record SetBaselineCommand(string Id) : IRequest<bool>;