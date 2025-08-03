namespace API.DTOs;

public class ModuleDto
{
    public int Id { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int Semester { get; set; }

    public string? ClassVenue { get; set; }

    public string[]? WeekDays { get; set; }
    public string[]? StartTimes { get; set; }
    public string[]? EndTimes { get; set; }

    // ✅ Required for preloading assessments
    public List<AssessmentDto>? Assessments { get; set; }
}
