using MediatR;
using PMInsight.Application.Activities.Commands;
using PMInsight.Application.Activities.Dtos;
using PMInsight.Application.Common.Interfaces;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Activities.Commands.Handlers;

public class CreateActivityCommandHandler : IRequestHandler<CreateActivityCommand, ActivityDto>
{
    private readonly IRepository<ScheduleActivity> _activityRepository;
    private readonly IRepository<WBS> _wbsRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateActivityCommandHandler(
        IRepository<ScheduleActivity> activityRepository,
        IRepository<WBS> wbsRepository,
        ICurrentUserService currentUserService)
    {
        _activityRepository = activityRepository;
        _wbsRepository = wbsRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ActivityDto> Handle(CreateActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = new ScheduleActivity
        {
            ProjectId = request.ProjectId,
            WbsNodeId = request.WbsNodeId,
            Name = request.Name,
            Code = request.Code,
            Description = request.Description,
            PlannedStartDate = request.PlannedStartDate,
            PlannedEndDate = request.PlannedEndDate,
            DurationDays = request.DurationDays,
            Status = request.Status,
            PercentComplete = request.PercentComplete,
            AssignedUserIds = request.AssignedUserIds,
            EstimatedHours = request.EstimatedHours,
            PlannedCost = request.PlannedCost,
            OrganizationId = _currentUserService.OrganizationId!
        };

        // Add constraint if specified
        if (request.ConstraintType.HasValue)
        {
            activity.Constraint = new ActivityConstraint
            {
                Type = request.ConstraintType.Value,
                ConstraintDate = request.ConstraintDate
            };
        }

        await _activityRepository.CreateAsync(activity);

        // Map to DTO
        return MapToDto(activity);
    }

    private ActivityDto MapToDto(ScheduleActivity activity)
    {
        return new ActivityDto
        {
            Id = activity.Id,
            ProjectId = activity.ProjectId,
            WbsNodeId = activity.WbsNodeId,
            Name = activity.Name,
            Code = activity.Code,
            Description = activity.Description,
            PlannedStartDate = activity.PlannedStartDate,
            PlannedEndDate = activity.PlannedEndDate,
            DurationDays = activity.DurationDays,
            ActualStartDate = activity.ActualStartDate,
            ActualEndDate = activity.ActualEndDate,
            ActualDurationDays = activity.ActualDurationDays,
            PercentComplete = activity.PercentComplete,
            Status = activity.Status,
            AssignedUserIds = activity.AssignedUserIds,
            EstimatedHours = activity.EstimatedHours,
            ActualHours = activity.ActualHours,
            PlannedCost = activity.PlannedCost,
            ActualCost = activity.ActualCost,
            IsCritical = activity.IsCritical,
            TotalFloat = activity.TotalFloat,
            FreeFloat = activity.FreeFloat,
            EarlyStart = activity.EarlyStart,
            EarlyFinish = activity.EarlyFinish,
            LateStart = activity.LateStart,
            LateFinish = activity.LateFinish,
            Notes = activity.Notes,
            Tags = activity.Tags,
            CreatedAt = activity.CreatedAt,
            UpdatedAt = activity.UpdatedAt,
            Predecessors = activity.Predecessors.Select(p => new ActivityDependencyDto
            {
                ActivityId = p.ActivityId,
                Type = p.Type,
                LagDays = p.LagDays
            }).ToList(),
            Constraint = activity.Constraint != null ? new ActivityConstraintDto
            {
                Type = activity.Constraint.Type,
                ConstraintDate = activity.Constraint.ConstraintDate
            } : null,
            Baseline = activity.Baseline != null ? new ActivityBaselineDto
            {
                StartDate = activity.Baseline.StartDate,
                EndDate = activity.Baseline.EndDate,
                DurationDays = activity.Baseline.DurationDays,
                PlannedCost = activity.Baseline.PlannedCost,
                BaselineDate = activity.Baseline.BaselineDate,
                BaselineVersion = activity.Baseline.BaselineVersion
            } : null
        };
    }
}
