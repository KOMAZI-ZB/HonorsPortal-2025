using System.Collections.Generic;

namespace API.DTOs
{
    public class ModuleDto
    {
        public int Id { get; set; }
        public string ModuleCode { get; set; } = string.Empty;
        public string ModuleName { get; set; } = string.Empty;
        public int Semester { get; set; }

        // Legacy (unused by schedule; may be dropped later)
        public string? ClassVenue { get; set; }
        public string[]? WeekDays { get; set; }
        public string[]? StartTimes { get; set; }
        public string[]? EndTimes { get; set; }

        // ✅ New
        public List<ClassSessionDto>? ClassSessions { get; set; }

        // Existing
        public List<AssessmentDto>? Assessments { get; set; }
    }
}
