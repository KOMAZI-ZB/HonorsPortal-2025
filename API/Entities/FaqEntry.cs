namespace API.Entities;

public class FaqEntry
{
    public int Id { get; set; }

    public string Question { get; set; } = string.Empty;

    public string Answer { get; set; } = string.Empty;

    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
