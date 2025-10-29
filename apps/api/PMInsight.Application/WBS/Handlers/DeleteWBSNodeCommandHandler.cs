using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

public class DeleteWBSNodeCommandHandler : IRequestHandler<DeleteWBSNodeCommand, bool>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteWBSNodeCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(DeleteWBSNodeCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.WBSId, cancellationToken);
        
        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            return false;
        }

        // Check if locked by someone else
        if (!string.IsNullOrEmpty(wbs.LockedBy) && wbs.LockedBy != _currentUserService.UserId)
        {
            throw new InvalidOperationException("WBS is locked by another user");
        }

        // Remove node
        bool removed = WBSMapper.RemoveNodeFromTree(wbs.Tree, request.NodeId);
        
        if (!removed)
        {
            return false;
        }

        wbs.Version++;
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return true;
    }
}
