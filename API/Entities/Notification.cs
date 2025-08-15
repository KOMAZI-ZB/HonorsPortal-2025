namespace API.Entities
{
    public class Notification
    {
        public int Id { get; set; }

        public string Type { get; set; } = "General"; // General, System, DocumentUpload, etc.

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string? ImagePath { get; set; }

        public string CreatedBy { get; set; } = string.Empty; // UserName

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? ModuleId { get; set; }
        public Module? Module { get; set; }

        // 🆕 Targeting
        // All | Students | Staff | ModuleStudents
        public string Audience { get; set; } = "All";
    }
}
