using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

public class LockWBSCommandHandler : IRequestHandler<LockWBSCommand, bool>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public LockWBSCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(LockWBSCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.Id, cancellationToken);

        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            return false;
        }

        if (!string.IsNullOrEmpty(wbs.LockedBy))
        {
            throw new InvalidOperationException($"WBS is already locked by user: {wbs.LockedBy}");
        }

        wbs.LockedBy = _currentUserService.UserId;
        wbs.LockedAt = DateTime.UtcNow;

        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);
        return true;
    }
}

public class UnlockWBSCommandHandler : IRequestHandler<UnlockWBSCommand, bool>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public UnlockWBSCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(UnlockWBSCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.Id, cancellationToken);

        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            return false;
        }

        if (wbs.LockedBy != _currentUserService.UserId)
        {
            throw new UnauthorizedAccessException("Only the user who locked the WBS can unlock it");
        }

        wbs.LockedBy = null;
        wbs.LockedAt = null;

        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);
        return true;
    }
}
