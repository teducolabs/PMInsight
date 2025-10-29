using MediatR;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Application.WBS.Commands;
using PMInsight.Application.WBS.Dtos;
using PMInsight.Application.WBS.Helpers;
using PMInsight.Domain.Common;

namespace PMInsight.Application.WBS.Handlers;

/// <summary>
/// Handler for calculating critical path
/// </summary>
public class CalculateCriticalPathCommandHandler : IRequestHandler<CalculateCriticalPathCommand, WBSDto>
{
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public CalculateCriticalPathCommandHandler(
        IRepository<Domain.Entities.WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<WBSDto> Handle(CalculateCriticalPathCommand request, CancellationToken cancellationToken)
    {
        var wbs = await _wbsRepository.GetByIdAsync(request.WBSId, cancellationToken);
        
        if (wbs == null || wbs.OrganizationId != _currentUserService.OrganizationId)
        {
            throw new UnauthorizedAccessException("WBS not found or access denied");
        }

        // Calculate critical path
        CriticalPathCalculator.CalculateCriticalPath(wbs.Tree);

        // Increment version and save
        wbs.Version++;
        await _wbsRepository.UpdateAsync(wbs.Id, wbs, cancellationToken);

        return WBSMapper.MapToDto(wbs);
    }
}
