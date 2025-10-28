using MediatR;
using PMInsight.Application.Activities.Dtos;
using PMInsight.Application.Activities.Queries;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Activities.Queries.Handlers;

public class GetActivityByIdQueryHandler : IRequestHandler<GetActivityByIdQuery, ActivityDto?>
{
    private readonly IRepository<ScheduleActivity> _activityRepository;
    private readonly IRepository<Domain.Entities.WBS> _wbsRepository;
    private readonly IRepository<User> _userRepository;

    public GetActivityByIdQueryHandler(
        IRepository<ScheduleActivity> activityRepository,
        IRepository<Domain.Entities.WBS> wbsRepository,
        IRepository<User> userRepository
    )
    {
        _activityRepository = activityRepository;
        _wbsRepository = wbsRepository;
        _userRepository = userRepository;
    }

    public async Task<ActivityDto?> Handle(
        GetActivityByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        var activity = await _activityRepository.GetByIdAsync(request.Id, cancellationToken);
        if (activity == null || activity.ProjectId != request.ProjectId)
        {
            return null;
        }

        // Get all activities for dependency mapping
        var allActivities = await _activityRepository.FindAsync(
            a => a.ProjectId == request.ProjectId,
            cancellationToken
        );

        // Get WBS data
        var wbsList = await _wbsRepository.FindAsync(
            w => w.ProjectId == request.ProjectId,
            cancellationToken
        );
        var wbsDict = new Dictionary<string, WBSNode>();
        foreach (var wbs in wbsList)
        {
            FlattenWBSNodes(wbs.Tree, wbsDict);
        }

        // Get user names
        var users = await _userRepository.FindAsync(
            u => activity.AssignedUserIds.Contains(u.Id),
            cancellationToken
        );
        var userDict = users.ToDictionary(u => u.Id, u => u.Name);

        return MapToDto(activity, wbsDict, userDict, allActivities);
    }

    private void FlattenWBSNodes(List<WBSNode> nodes, Dictionary<string, WBSNode> dict)
    {
        foreach (var node in nodes)
        {
            dict[node.Id] = node;
            if (node.Children.Any())
            {
                FlattenWBSNodes(node.Children, dict);
            }
        }
    }

    private ActivityDto MapToDto(
        ScheduleActivity activity,
        Dictionary<string, WBSNode> wbsDict,
        Dictionary<string, string> userDict,
        List<ScheduleActivity> allActivities
    )
    {
        var dto = new ActivityDto
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
            AssignedUserNames = activity
                .AssignedUserIds.Select(id =>
                    userDict.TryGetValue(id, out var name) ? name : "Unknown"
                )
                .ToList(),
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
        };

        // Add WBS info
        if (
            !string.IsNullOrEmpty(activity.WbsNodeId)
            && wbsDict.TryGetValue(activity.WbsNodeId, out var wbsNode)
        )
        {
            dto.WbsNodeName = wbsNode.Name;
            dto.WbsNodeCode = wbsNode.Code;
        }

        // Map predecessors
        dto.Predecessors = activity
            .Predecessors.Select(p =>
            {
                var predActivity = allActivities.FirstOrDefault(a => a.Id == p.ActivityId);
                return new ActivityDependencyDto
                {
                    ActivityId = p.ActivityId,
                    ActivityName = predActivity?.Name ?? "Unknown",
                    ActivityCode = predActivity?.Code,
                    Type = p.Type,
                    LagDays = p.LagDays,
                };
            })
            .ToList();

        // Map successors
        dto.Successors = activity
            .Successors.Select(s =>
            {
                var succActivity = allActivities.FirstOrDefault(a => a.Id == s.ActivityId);
                return new ActivityDependencyDto
                {
                    ActivityId = s.ActivityId,
                    ActivityName = succActivity?.Name ?? "Unknown",
                    ActivityCode = succActivity?.Code,
                    Type = s.Type,
                    LagDays = s.LagDays,
                };
            })
            .ToList();

        // Map constraint
        if (activity.Constraint != null)
        {
            dto.Constraint = new ActivityConstraintDto
            {
                Type = activity.Constraint.Type,
                ConstraintDate = activity.Constraint.ConstraintDate,
            };
        }

        // Map baseline
        if (activity.Baseline != null)
        {
            dto.Baseline = new ActivityBaselineDto
            {
                StartDate = activity.Baseline.StartDate,
                EndDate = activity.Baseline.EndDate,
                DurationDays = activity.Baseline.DurationDays,
                PlannedCost = activity.Baseline.PlannedCost,
                BaselineDate = activity.Baseline.BaselineDate,
                BaselineVersion = activity.Baseline.BaselineVersion,
            };
        }

        return dto;
    }
}
