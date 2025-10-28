using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.WBS.Handlers;

public class CreateWBSCommandHandler : IRequestHandler<CreateWBSCommand, WBSDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateWBSCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService
    )
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto> Handle(CreateWBSCommand request, CancellationToken cancellationToken)
    {
        var wbs = new Domain.Entities.WBS
        {
            ProjectId = request.ProjectId,
            Tree = request.Tree,
            Version = 1,
            OrganizationId = _currentUserService.OrganizationId!,
        };

        await _wbsRepository.CreateAsync(wbs, cancellationToken);

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
