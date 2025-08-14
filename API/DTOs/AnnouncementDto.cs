namespace API.DTOs;

public class AnnouncementDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? ModuleId { get; set; }

    // 🆕 Target audience hint used by filtering and UI badges
    public string Audience { get; set; } = "All";

    // 🆕 Per-user read flag
    public bool IsRead { get; set; }
}
