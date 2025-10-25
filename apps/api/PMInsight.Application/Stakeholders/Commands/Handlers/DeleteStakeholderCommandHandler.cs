using MediatR;
using PMInsight.Application.Common.Exceptions;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Stakeholders.Commands.Handlers;

public class DeleteStakeholderCommandHandler : IRequestHandler<DeleteStakeholderCommand, bool>
{
    private readonly IRepository<Stakeholder> _stakeholderRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteStakeholderCommandHandler(
        IRepository<Stakeholder> stakeholderRepository,
        ICurrentUserService currentUserService)
    {
        _stakeholderRepository = stakeholderRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteStakeholderCommand request, CancellationToken cancellationToken)
    {
        var stakeholder = await _stakeholderRepository.GetByIdAsync(request.Id, cancellationToken);
        if (stakeholder == null)
        {
            throw new NotFoundException($"Stakeholder {request.Id} not found");
        }

        if (stakeholder.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("You don't have permission to delete this stakeholder");
        }

        await _stakeholderRepository.DeleteAsync(request.Id, cancellationToken);
        return true;
    }
}