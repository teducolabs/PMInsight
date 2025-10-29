using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Application.WBS.Queries;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

public class GetWBSByIdQueryHandler : IRequestHandler<GetWBSByIdQuery, WBSDto?>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetWBSByIdQueryHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService
    )
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto?> Handle(GetWBSByIdQuery request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.Id, cancellationToken);

        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            return null;
        }

        return WBSMapper.MapToDto(wbs);
    }
}
