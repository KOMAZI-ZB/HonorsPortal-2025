namespace API.DTOs;

public class ClassScheduleDto
{
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int Semester { get; set; }

    public string? ClassVenue { get; set; }

    public string[] WeekDays { get; set; } = Array.Empty<string>();
    public string[] StartTimes { get; set; } = Array.Empty<string>();
    public string[] EndTimes { get; set; } = Array.Empty<string>();
}
