// API/Entities/Repository.cs
namespace API.Entities
{
    public class Repository
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;       // e.g., "JoVE"
        public string ImageUrl { get; set; } = string.Empty;    // e.g., "/assets/jove.png"
        public string LinkUrl { get; set; } = string.Empty;     // e.g., "https://www.jove.com/"
    }
}
