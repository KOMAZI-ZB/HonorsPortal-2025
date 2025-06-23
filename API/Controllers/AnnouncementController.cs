using API.DTOs;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnnouncementsController(IAnnouncementService announcementService) : BaseApiController
{
    private readonly IAnnouncementService _announcementService = announcementService;

    private static readonly string[] AllowedTypes = new[]
    {
        "General", "System",
        "DocumentUpload", "RepositoryUpdate", "SchedulerUpdate"
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AnnouncementDto>>> GetAll([FromQuery] QueryParams queryParams)
    {
        var result = await _announcementService.GetAllPaginatedAsync(queryParams);
        Response.AddPaginationHeader(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer,Coordinator,Admin")]
    public async Task<ActionResult<AnnouncementDto>> Create([FromForm] CreateAnnouncementDto dto)
    {
        var userNumber = User.GetUsername();

        if (!AllowedTypes.Any(t => string.Equals(t, dto.Type, StringComparison.OrdinalIgnoreCase)))
            return BadRequest("Invalid announcement type.");

        if (dto.Type.Equals("System", StringComparison.OrdinalIgnoreCase) && !User.IsInRole("Admin"))
            return Forbid("Only Admins can post System announcements.");

        var result = await _announcementService.CreateAsync(dto, userNumber);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var userNumber = User.GetUsername();
        var isAdmin = User.IsInRole("Admin");

        var success = await _announcementService.DeleteAsync(id, userNumber, isAdmin);

        if (!success)
            return Forbid("You are not authorized to delete this announcement.");

        return Ok(new { message = "Announcement deleted successfully." });
    }
}
