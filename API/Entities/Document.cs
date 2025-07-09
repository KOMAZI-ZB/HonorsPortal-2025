using System;

namespace API.Entities
{
    public class Document
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        // Cloudinary FilePath
        public string FilePath { get; set; } = string.Empty;

        // Date uploaded (for sorting if needed)
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Uploader (LastName for traceability)
        public string UploadedBy { get; set; } = string.Empty;
        // ✅ NEW FIELD to correctly track uploader by identity
        public string UploadedByUserNumber { get; set; } = string.Empty;

        // Nullable → If null, this is a Repository document
        public int? ModuleId { get; set; }
        public Module? Module { get; set; }

        // Used to distinguish between ModulesTab vs Repository uploads
        public string Source { get; set; } = "Module"; // or "Repository"
    }
}
