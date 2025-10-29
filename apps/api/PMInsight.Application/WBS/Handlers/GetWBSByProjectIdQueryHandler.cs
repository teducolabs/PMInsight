using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Application.WBS.Queries;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

public class GetWBSByProjectIdQueryHandler : IRequestHandler<GetWBSByProjectIdQuery, WBSDto?>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetWBSByProjectIdQueryHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService
    )
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto?> Handle(
        GetWBSByProjectIdQuery request,
        CancellationToken cancellationToken
    )
    {
        var allWbs = await _wbsRepository.GetAllAsync(cancellationToken);
        var wbs = allWbs.FirstOrDefault(w => w.ProjectId == request.ProjectId);

        if (wbs == null)
        {
            return null;
        }

        return WBSMapper.MapToDto(wbs);
    }
}
