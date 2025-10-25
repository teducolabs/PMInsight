using MediatR;

namespace PMInsight.Application.Stakeholders.Commands;

public record DeleteStakeholderCommand(string Id) : IRequest<bool>;