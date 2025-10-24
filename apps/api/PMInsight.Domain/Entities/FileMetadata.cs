using PMInsight.Domain.Common;

namespace PMInsight.Domain.Entities;

public class FileMetadata : TenantEntity
{
    public required string Key { get; set; } // S3/R2 key
    public required string Name { get; set; }
    public long Size { get; set; }
    public required string MimeType { get; set; }
    public required string UploadedBy { get; set; }
    public string? ProjectId { get; set; }
    public List<string> Tags { get; set; } = new();
}
