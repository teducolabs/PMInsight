using MediatR;
using PMInsight.Application.Projects.Dtos;

namespace PMInsight.Application.Projects.Queries;

public record GetProjectByIdQuery(string Id) : IRequest<ProjectDto>;