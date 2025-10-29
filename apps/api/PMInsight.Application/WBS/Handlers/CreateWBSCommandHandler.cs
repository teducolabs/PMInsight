using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;

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

        return WBSMapper.MapToDto(wbs);
    }
}
