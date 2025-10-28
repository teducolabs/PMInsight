using System.ComponentModel.DataAnnotations;

namespace PMInsight.Api.Models;

public record UpdateProjectRequest
{
    public string? Code { get; init; }
    
    public string? Name { get; init; }
    
    public string? Description { get; init; }
    
    public string? Status { get; init; }
    
    public string? Priority { get; init; }
    
    public DateTime? StartDate { get; init; }
    
    public DateTime? EndDate { get; init; }
    
    public DateTime? ActualStartDate { get; init; }
    
    public DateTime? ActualEndDate { get; init; }
    
    public double? Budget { get; init; }
    
    public string? Currency { get; init; }
    
    public int? Progress { get; init; }
    
    public string? Health { get; init; } // Green, Yellow, Red
    
    public string? ProjectManagerId { get; init; }
    
    public string? SponsorId { get; init; }
}
