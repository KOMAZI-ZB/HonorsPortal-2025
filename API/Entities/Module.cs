using System;

namespace API.Entities
{
    public class Module
    {
        public int Id { get; set; }
        public string ModuleCode { get; set; } = string.Empty;
        public string ModuleName { get; set; } = string.Empty;
        public int Semester { get; set; }

        public string? ClassVenue { get; set; }

        // ✅ Day-specific class scheduling
        public string? WeekDays { get; set; }     // e.g. "Monday,Wednesday,Friday"
        public string? StartTimes { get; set; }   // e.g. "08:00,10:00,14:00"
        public string? EndTimes { get; set; }     // e.g. "09:00,11:00,15:00"

        // ✅ Test 1 with explicit Start and End
        public string? Test1Venue { get; set; }
        public DateOnly? Test1Date { get; set; }
        public TimeOnly? Test1StartTime { get; set; }
        public TimeOnly? Test1EndTime { get; set; }

        // ✅ Test 2 with explicit Start and End
        public string? Test2Venue { get; set; }
        public DateOnly? Test2Date { get; set; }
        public TimeOnly? Test2StartTime { get; set; }
        public TimeOnly? Test2EndTime { get; set; }

        // ✅ Supplementary with explicit Start and End
        public string? SupplementaryVenue { get; set; }
        public DateOnly? SupplementaryDate { get; set; }
        public TimeOnly? SupplementaryStartTime { get; set; }
        public TimeOnly? SupplementaryEndTime { get; set; }

        public ICollection<UserModule> UserModules { get; set; } = new List<UserModule>();
    }
}
