using System.ComponentModel.DataAnnotations;

namespace PMInsight.Api.Models;

public record CreateProjectRequest
{
    [Required]
    public required string Code { get; init; }
    
    [Required]
    public required string Name { get; init; }
    
    public string? Description { get; init; }
    
    [Required]
    public required string Status { get; init; }
    
    [Required]
    public required string Priority { get; init; }
    
    [Required]
    public required DateTime StartDate { get; init; }
    
    [Required]
    public required DateTime EndDate { get; init; }
    
    public double? Budget { get; init; }
    
    [Required]
    public required string Currency { get; init; }
    
    [Required]
    public required string ProjectManagerId { get; init; }
    
    public string? SponsorId { get; init; }
    
    public string? TemplateId { get; init; }
}
