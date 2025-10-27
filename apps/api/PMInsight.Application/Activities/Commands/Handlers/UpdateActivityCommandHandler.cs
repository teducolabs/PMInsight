using MediatR;
using PMInsight.Application.Activities.Commands;
using PMInsight.Application.Activities.Dtos;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Activities.Commands.Handlers;

public class UpdateActivityCommandHandler : IRequestHandler<UpdateActivityCommand, ActivityDto>
{
    private readonly IRepository<ScheduleActivity> _activityRepository;

    public UpdateActivityCommandHandler(IRepository<ScheduleActivity> activityRepository)
    {
        _activityRepository = activityRepository;
    }

    public async Task<ActivityDto> Handle(UpdateActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await _activityRepository.GetByIdAsync(request.Id, cancellationToken);
        if (activity == null)
        {
            throw new KeyNotFoundException($"Activity with ID {request.Id} not found");
        }

        // Update only provided fields
        if (request.Name != null) activity.Name = request.Name;
        if (request.Code != null) activity.Code = request.Code;
        if (request.Description != null) activity.Description = request.Description;
        if (request.WbsNodeId != null) activity.WbsNodeId = request.WbsNodeId;
        if (request.PlannedStartDate.HasValue) activity.PlannedStartDate = request.PlannedStartDate;
        if (request.PlannedEndDate.HasValue) activity.PlannedEndDate = request.PlannedEndDate;
        if (request.DurationDays.HasValue) activity.DurationDays = request.DurationDays.Value;
        if (request.ActualStartDate.HasValue) activity.ActualStartDate = request.ActualStartDate;
        if (request.ActualEndDate.HasValue) activity.ActualEndDate = request.ActualEndDate;
        if (request.PercentComplete.HasValue) activity.PercentComplete = request.PercentComplete.Value;
        if (request.Status.HasValue) activity.Status = request.Status.Value;
        if (request.AssignedUserIds != null) activity.AssignedUserIds = request.AssignedUserIds;
        if (request.EstimatedHours.HasValue) activity.EstimatedHours = request.EstimatedHours.Value;
        if (request.ActualHours.HasValue) activity.ActualHours = request.ActualHours.Value;
        if (request.PlannedCost.HasValue) activity.PlannedCost = request.PlannedCost;
        if (request.ActualCost.HasValue) activity.ActualCost = request.ActualCost;
        if (request.Notes != null) activity.Notes = request.Notes;

        await _activityRepository.UpdateAsync(request.Id, activity, cancellationToken);

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
