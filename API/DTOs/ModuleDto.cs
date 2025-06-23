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

    public string? Test1Venue { get; set; }
    public DateOnly? Test1Date { get; set; }
    public TimeOnly? Test1StartTime { get; set; }
    public TimeOnly? Test1EndTime { get; set; }

    public string? Test2Venue { get; set; }
    public DateOnly? Test2Date { get; set; }
    public TimeOnly? Test2StartTime { get; set; }
    public TimeOnly? Test2EndTime { get; set; }

    public string? SupplementaryVenue { get; set; }
    public DateOnly? SupplementaryDate { get; set; }
    public TimeOnly? SupplementaryStartTime { get; set; }
    public TimeOnly? SupplementaryEndTime { get; set; }
}
