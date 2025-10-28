using MediatR;
using PMInsight.Application.WBS.Dtos;

namespace PMInsight.Application.WBS.Queries;

public record GetWBSByProjectIdQuery(string ProjectId) : IRequest<WBSDto?>;
