namespace API.DTOs
{
    public class DocumentDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string FilePath { get; set; } = string.Empty;

        public DateTime UploadedAt { get; set; }

        public string UploadedBy { get; set; } = string.Empty;

        public int? ModuleId { get; set; } // null for Repository files
    }
}
