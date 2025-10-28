using MediatR;
using PMInsight.Application.WBS.Dtos;

namespace PMInsight.Application.WBS.Queries;

public record GetWBSByIdQuery(string Id) : IRequest<WBSDto?>;
