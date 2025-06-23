namespace API.DTOs
{
    public class RepositoryDto
    {
        public int Id { get; set; }                     // Database ID
        public string Label { get; set; } = string.Empty;    // e.g., "JoVE"
        public string ImageUrl { get; set; } = string.Empty; // e.g., "/assets/jove.png"
        public string LinkUrl { get; set; } = string.Empty;  // e.g., "https://www.jove.com/"
    }
}
