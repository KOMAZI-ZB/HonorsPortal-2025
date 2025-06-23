// API/DTOs/TestScheduleDto.cs
namespace API.DTOs
{
    public class TestScheduleDto
    {
        public string ModuleCode { get; set; } = string.Empty;
        public string ModuleName { get; set; } = string.Empty;
        public int Semester { get; set; }

        public string? TestType { get; set; } // "Test 1", "Test 2", or "Supplementary"
        public string? TestDate { get; set; } // "2025-07-20"
        public string? StartTime { get; set; } // "10:00:00"
        public string? EndTime { get; set; }   // "11:00:00"
        public string? Venue { get; set; }     // "BKB100"
    }
}
