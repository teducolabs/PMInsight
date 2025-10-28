using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

public class UpdateWBSCommandHandler : IRequestHandler<UpdateWBSCommand, WBSDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateWBSCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto> Handle(UpdateWBSCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.Id, cancellationToken);
        
        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("WBS not found or access denied");
        }

        // Check if locked by someone else
        if (!string.IsNullOrEmpty(wbs.LockedBy) && wbs.LockedBy != _currentUserService.UserId)
        {
            throw new InvalidOperationException($"WBS is locked by another user");
        }

        wbs.Tree = request.Tree;
        wbs.Version++;

        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return new WBSDto
        {
            Id = wbs.Id,
            ProjectId = wbs.ProjectId,
            OrganizationId = wbs.OrganizationId,
            Tree = wbs.Tree,
            Version = wbs.Version,
            BaselineRef = wbs.BaselineRef,
            LockedBy = wbs.LockedBy,
            LockedAt = wbs.LockedAt,
            CreatedAt = wbs.CreatedAt,
            UpdatedAt = wbs.UpdatedAt,
        };
    }
}
