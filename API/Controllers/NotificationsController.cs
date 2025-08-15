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
public class NotificationsController(INotificationService notificationService) : BaseApiController
{
    private readonly INotificationService _notificationService = notificationService;

    private static readonly string[] AllowedTypes = new[]
    {
        "General", "System",
        "DocumentUpload", "RepositoryUpdate", "SchedulerUpdate", "ScheduleUpdate"
    };

    private static readonly string[] AllowedAudiences = new[]
    {
        "All", "Students", "Staff", "ModuleStudents"
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetAll([FromQuery] QueryParams queryParams)
    {
        // ✅ Ensure current user's UserName is set for filtering by JoinDate
        queryParams.CurrentUserName = User.GetUsername();

        var result = await _notificationService.GetAllPaginatedAsync(queryParams);
        Response.AddPaginationHeader(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Lecturer,Coordinator,Admin")]
    public async Task<ActionResult<NotificationDto>> Create([FromForm] CreateNotificationDto dto)
    {
        var userName = User.GetUsername();

        // Type guard
        if (!AllowedTypes.Any(t => string.Equals(t, dto.Type, StringComparison.OrdinalIgnoreCase)))
            return BadRequest("Invalid notification type.");

        // Audience guard (default safely to All if not provided)
        if (string.IsNullOrWhiteSpace(dto.Audience)) dto.Audience = "All";
        if (!AllowedAudiences.Any(a => string.Equals(a, dto.Audience, StringComparison.OrdinalIgnoreCase)))
            return BadRequest("Invalid audience. Allowed: All, Students, Staff, ModuleStudents.");

        // Only Admins may post 'System'
        if (dto.Type.Equals("System", StringComparison.OrdinalIgnoreCase) && !User.IsInRole("Admin"))
            return Forbid("Only Admins can post System notifications.");

        // Role-based constraint for Lecturers:
        // Lecturers may only post module-scoped items, visible to STUDENTS of that module.
        if (User.IsInRole("Lecturer"))
        {
            if (dto.ModuleId is null)
                return BadRequest("Lecturers must select a specific Module for their post.");

            // Force audience to ModuleStudents for lecturers
            dto.Audience = "ModuleStudents";
        }

        var result = await _notificationService.CreateAsync(dto, userName);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var userName = User.GetUsername();
        var isAdmin = User.IsInRole("Admin");

        var success = await _notificationService.DeleteAsync(id, userName, isAdmin);

        if (!success)
            return Forbid("You are not authorized to delete this notification.");

        return Ok(new { message = "Notification deleted successfully." });
    }

    // ✅ Optional: mark notification/notification as read
    [HttpPost("{id}/read")]
    public async Task<ActionResult> MarkRead(int id)
    {
        var userId = int.Parse(User.GetUserId());
        var ok = await _notificationService.MarkAsReadAsync(id, userId);
        if (!ok) return NotFound(new { message = "Notification not found." });
        return Ok(new { message = "Marked as read." });
    }
}
