namespace API.DTOs;

public class UpdateModuleDto
{
    public string? ModuleCode { get; set; }
    public string? ModuleName { get; set; }
    public int Semester { get; set; }

    public string? ClassVenue { get; set; }

    public string[]? WeekDays { get; set; }
    public string[]? StartTimes { get; set; }
    public string[]? EndTimes { get; set; }

    public List<AssessmentDto>? Assessments { get; set; }
}
