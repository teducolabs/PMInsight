using MediatR;
using PMInsight.Application.Activities.Commands;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;
using PMInsight.Domain.Enums;

namespace PMInsight.Application.Activities.Commands.Handlers;

/// <summary>
/// Calculates Critical Path using CPM (Critical Path Method) algorithm
/// </summary>
public class CalculateCriticalPathCommandHandler : IRequestHandler<CalculateCriticalPathCommand, Unit>
{
    private readonly IRepository<ScheduleActivity> _activityRepository;

    public CalculateCriticalPathCommandHandler(IRepository<ScheduleActivity> activityRepository)
    {
        _activityRepository = activityRepository;
    }

    public async Task<Unit> Handle(CalculateCriticalPathCommand request, CancellationToken cancellationToken)
    {
        // Get all activities for the project
        var activities = await _activityRepository.FindAsync(
            a => a.ProjectId == request.ProjectId,
            cancellationToken);

        if (!activities.Any())
        {
            return Unit.Value;
        }

        // Create lookup dictionary
        var activityDict = activities.ToDictionary(a => a.Id);

        // Step 1: Forward Pass - Calculate Early Start (ES) and Early Finish (EF)
        CalculateForwardPass(activities, activityDict);

        // Step 2: Backward Pass - Calculate Late Start (LS) and Late Finish (LF)
        CalculateBackwardPass(activities, activityDict);

        // Step 3: Calculate Float and Mark Critical Activities
        CalculateFloatAndCriticalPath(activities);

        // Step 4: Update all activities in database
        foreach (var activity in activities)
        {
            await _activityRepository.UpdateAsync(activity.Id, activity, cancellationToken);
        }

        return Unit.Value;
    }

    private void CalculateForwardPass(List<ScheduleActivity> activities, Dictionary<string, ScheduleActivity> activityDict)
    {
        // Find start activities (no predecessors)
        var startActivities = activities.Where(a => !a.Predecessors.Any()).ToList();

        // Set project start date (earliest start date or today)
        var projectStart = startActivities
            .Where(a => a.PlannedStartDate.HasValue)
            .Select(a => a.PlannedStartDate!.Value)
            .DefaultIfEmpty(DateTime.UtcNow)
            .Min();

        // Initialize start activities
        foreach (var activity in startActivities)
        {
            activity.EarlyStart = activity.PlannedStartDate ?? projectStart;
            activity.EarlyFinish = activity.EarlyStart.Value.AddDays(activity.DurationDays);
        }

        // Process activities in topological order
        var processed = new HashSet<string>();
        var queue = new Queue<ScheduleActivity>(startActivities);

        while (queue.Any())
        {
            var activity = queue.Dequeue();
            if (processed.Contains(activity.Id))
                continue;

            // Check if all predecessors are processed
            var allPredecessorsProcessed = activity.Predecessors.All(p =>
                activityDict.ContainsKey(p.ActivityId) &&
                processed.Contains(p.ActivityId));

            if (!allPredecessorsProcessed)
            {
                queue.Enqueue(activity); // Re-queue
                continue;
            }

            // Calculate ES based on predecessors
            if (activity.Predecessors.Any())
            {
                var maxEarlyFinish = DateTime.MinValue;

                foreach (var pred in activity.Predecessors)
                {
                    if (!activityDict.TryGetValue(pred.ActivityId, out var predActivity))
                        continue;

                    DateTime predFinish;

                    switch (pred.Type)
                    {
                        case DependencyType.FS: // Finish-to-Start
                            predFinish = predActivity.EarlyFinish!.Value.AddDays(pred.LagDays);
                            break;
                        case DependencyType.SS: // Start-to-Start
                            predFinish = predActivity.EarlyStart!.Value.AddDays(pred.LagDays);
                            break;
                        case DependencyType.FF: // Finish-to-Finish
                            predFinish = predActivity.EarlyFinish!.Value.AddDays(pred.LagDays - activity.DurationDays);
                            break;
                        case DependencyType.SF: // Start-to-Finish
                            predFinish = predActivity.EarlyStart!.Value.AddDays(pred.LagDays - activity.DurationDays);
                            break;
                        default:
                            predFinish = predActivity.EarlyFinish!.Value.AddDays(pred.LagDays);
                            break;
                    }

                    if (predFinish > maxEarlyFinish)
                        maxEarlyFinish = predFinish;
                }

                activity.EarlyStart = maxEarlyFinish;
                activity.EarlyFinish = activity.EarlyStart.Value.AddDays(activity.DurationDays);
            }

            processed.Add(activity.Id);

            // Enqueue successors
            foreach (var succ in activity.Successors)
            {
                if (activityDict.TryGetValue(succ.ActivityId, out var succActivity))
                {
                    queue.Enqueue(succActivity);
                }
            }
        }
    }

    private void CalculateBackwardPass(List<ScheduleActivity> activities, Dictionary<string, ScheduleActivity> activityDict)
    {
        // Find end activities (no successors)
        var endActivities = activities.Where(a => !a.Successors.Any()).ToList();

        // Set project end date (latest early finish)
        var projectEnd = endActivities
            .Where(a => a.EarlyFinish.HasValue)
            .Select(a => a.EarlyFinish!.Value)
            .DefaultIfEmpty(DateTime.UtcNow.AddDays(100))
            .Max();

        // Initialize end activities
        foreach (var activity in endActivities)
        {
            activity.LateFinish = activity.EarlyFinish ?? projectEnd;
            activity.LateStart = activity.LateFinish.Value.AddDays(-activity.DurationDays);
        }

        // Process activities in reverse topological order
        var processed = new HashSet<string>();
        var queue = new Queue<ScheduleActivity>(endActivities);

        while (queue.Any())
        {
            var activity = queue.Dequeue();
            if (processed.Contains(activity.Id))
                continue;

            // Check if all successors are processed
            var allSuccessorsProcessed = activity.Successors.All(s =>
                activityDict.ContainsKey(s.ActivityId) &&
                processed.Contains(s.ActivityId));

            if (!allSuccessorsProcessed)
            {
                queue.Enqueue(activity); // Re-queue
                continue;
            }

            // Calculate LF based on successors
            if (activity.Successors.Any())
            {
                var minLateStart = DateTime.MaxValue;

                foreach (var succ in activity.Successors)
                {
                    if (!activityDict.TryGetValue(succ.ActivityId, out var succActivity))
                        continue;

                    DateTime succStart;

                    switch (succ.Type)
                    {
                        case DependencyType.FS: // Finish-to-Start
                            succStart = succActivity.LateStart!.Value.AddDays(-succ.LagDays);
                            break;
                        case DependencyType.SS: // Start-to-Start
                            succStart = succActivity.LateStart!.Value.AddDays(-succ.LagDays + activity.DurationDays);
                            break;
                        case DependencyType.FF: // Finish-to-Finish
                            succStart = succActivity.LateFinish!.Value.AddDays(-succ.LagDays);
                            break;
                        case DependencyType.SF: // Start-to-Finish
                            succStart = succActivity.LateFinish!.Value.AddDays(-succ.LagDays + activity.DurationDays);
                            break;
                        default:
                            succStart = succActivity.LateStart!.Value.AddDays(-succ.LagDays);
                            break;
                    }

                    if (succStart < minLateStart)
                        minLateStart = succStart;
                }

                activity.LateFinish = minLateStart;
                activity.LateStart = activity.LateFinish.Value.AddDays(-activity.DurationDays);
            }

            processed.Add(activity.Id);

            // Enqueue predecessors
            foreach (var pred in activity.Predecessors)
            {
                if (activityDict.TryGetValue(pred.ActivityId, out var predActivity))
                {
                    queue.Enqueue(predActivity);
                }
            }
        }
    }

    private void CalculateFloatAndCriticalPath(List<ScheduleActivity> activities)
    {
        foreach (var activity in activities)
        {
            if (!activity.LateStart.HasValue || !activity.EarlyStart.HasValue)
                continue;

            // Total Float = LS - ES (or LF - EF)
            activity.TotalFloat = (decimal)(activity.LateStart.Value - activity.EarlyStart.Value).TotalDays;

            // Free Float = ES(successor) - EF(current)
            if (activity.Successors.Any())
            {
                var minSuccessorES = activity.Successors
                    .Select(s => activities.FirstOrDefault(a => a.Id == s.ActivityId))
                    .Where(a => a?.EarlyStart.HasValue == true)
                    .Select(a => a!.EarlyStart!.Value)
                    .DefaultIfEmpty(DateTime.MaxValue)
                    .Min();

                if (activity.EarlyFinish.HasValue && minSuccessorES != DateTime.MaxValue)
                {
                    activity.FreeFloat = (decimal)(minSuccessorES - activity.EarlyFinish.Value).TotalDays;
                }
            }
            else
            {
                activity.FreeFloat = activity.TotalFloat;
            }

            // Activity is critical if Total Float is approximately 0
            activity.IsCritical = Math.Abs(activity.TotalFloat) < 0.1m;
        }
    }
}
