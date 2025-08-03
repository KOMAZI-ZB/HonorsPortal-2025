using System;
using System.Collections.Generic;

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

        // ✅ Relationships
        public ICollection<UserModule> UserModules { get; set; } = new List<UserModule>();
        public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    }
}
