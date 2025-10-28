using MediatR;
using PMInsight.Application.Activities.Commands;
using PMInsight.Domain.Common;
using PMInsight.Domain.Entities;

namespace PMInsight.Application.Activities.Commands.Handlers;

public class AddDependencyCommandHandler : IRequestHandler<AddDependencyCommand, Unit>
{
    private readonly IRepository<ScheduleActivity> _activityRepository;

    public AddDependencyCommandHandler(IRepository<ScheduleActivity> activityRepository)
    {
        _activityRepository = activityRepository;
    }

    public async Task<Unit> Handle(
        AddDependencyCommand request,
        CancellationToken cancellationToken
    )
    {
        // Get successor activity
        var successor = await _activityRepository.GetByIdAsync(
            request.SuccessorId,
            cancellationToken
        );
        if (successor == null)
        {
            throw new KeyNotFoundException(
                $"Successor activity with ID {request.SuccessorId} not found"
            );
        }

        // Get predecessor activity (validate it exists)
        var predecessor = await _activityRepository.GetByIdAsync(
            request.PredecessorId,
            cancellationToken
        );
        if (predecessor == null)
        {
            throw new KeyNotFoundException(
                $"Predecessor activity with ID {request.PredecessorId} not found"
            );
        }

        // Check if dependency already exists
        if (successor.Predecessors.Any(p => p.ActivityId == request.PredecessorId))
        {
            throw new InvalidOperationException("Dependency already exists");
        }

        // Add dependency to successor
        successor.Predecessors.Add(
            new ActivityDependency
            {
                ActivityId = request.PredecessorId,
                Type = request.Type,
                LagDays = request.LagDays,
            }
        );

        // Add reverse dependency to predecessor (for easier queries)
        predecessor.Successors.Add(
            new ActivityDependency
            {
                ActivityId = request.SuccessorId,
                Type = request.Type,
                LagDays = request.LagDays,
            }
        );

        // Update both activities
        await _activityRepository.UpdateAsync(request.SuccessorId, successor, cancellationToken);
        await _activityRepository.UpdateAsync(
            request.PredecessorId,
            predecessor,
            cancellationToken
        );

        return Unit.Value;
    }
}
