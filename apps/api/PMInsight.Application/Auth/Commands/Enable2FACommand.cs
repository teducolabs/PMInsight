using MediatR;

namespace PMInsight.Application.Auth.Commands;

public record Enable2FACommand : IRequest<Enable2FAResult>;

public record Enable2FAResult
{
    public required string Secret { get; init; }
    public required string QrCodeUrl { get; init; }
}