namespace API.DTOs;

public class FaqEntryDto
{
    public int Id { get; set; }

    public string Question { get; set; } = string.Empty;

    public string Answer { get; set; } = string.Empty;

    public DateTime LastUpdated { get; set; }
}
