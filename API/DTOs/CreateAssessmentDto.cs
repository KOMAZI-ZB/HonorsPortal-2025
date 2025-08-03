using System;

namespace API.DTOs
{
    public class CreateAssessmentDto
    {
        public string Title { get; set; } = string.Empty;

        public DateOnly Date { get; set; }

        public string? StartTime { get; set; }
        public string? EndTime { get; set; }

        public string? DueTime { get; set; }

        public string? Venue { get; set; }

        public bool IsTimed { get; set; }

        public int ModuleId { get; set; }
    }
}
