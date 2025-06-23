using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace API.DTOs;

public class CreateAnnouncementDto
{
    [Required(ErrorMessage = "Announcement type is required.")]
    public string Type { get; set; } = "General";

    [Required(ErrorMessage = "Title is required.")]
    [MinLength(3, ErrorMessage = "Title must be at least 3 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Message is required.")]
    [MinLength(5, ErrorMessage = "Message must be at least 5 characters.")]
    public string Message { get; set; } = string.Empty;

    public IFormFile? Image { get; set; }
    public int? ModuleId { get; set; }
}
