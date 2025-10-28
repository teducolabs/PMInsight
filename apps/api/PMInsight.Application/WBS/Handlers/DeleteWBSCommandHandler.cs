using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

public class DeleteWBSCommandHandler : IRequestHandler<DeleteWBSCommand, bool>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteWBSCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService
    )
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteWBSCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.Id, cancellationToken);

        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            return false;
        }

        await _wbsRepository.DeleteAsync(request.Id, cancellationToken);
        return true;
    }
}
