using API.DTOs;
using API.Extensions;
using API.Interfaces;
using API.Helpers;
using AutoMapper;
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

        if (!AllowedTypes.Any(t => string.Equals(t, dto.Type, StringComparison.OrdinalIgnoreCase)))
            return BadRequest("Invalid notification type.");

        if (string.IsNullOrWhiteSpace(dto.Audience)) dto.Audience = "All";
        if (!AllowedAudiences.Any(a => string.Equals(a, dto.Audience, StringComparison.OrdinalIgnoreCase)))
            return BadRequest("Invalid audience. Allowed: All, Students, Staff, ModuleStudents.");

        // 🔹 Wording reflects that General/System are announcements
        if (dto.Type.Equals("System", StringComparison.OrdinalIgnoreCase) && !User.IsInRole("Admin"))
            return Forbid("Only Admins can post System announcements.");

        if (User.IsInRole("Lecturer"))
        {
            if (dto.ModuleId is null)
                return BadRequest("Lecturers must select a specific Module for their post.");
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
        if (!success) return Forbid("You are not authorized to delete this notification.");

        return Ok(new { message = "Notification deleted successfully." });
    }

    // ✅ Optional: mark notification/announcement as read
    [HttpPost("{id}/read")]
    public async Task<ActionResult> MarkRead(int id)
    {
        var userId = int.Parse(User.GetUserId());
        var ok = await _notificationService.MarkAsReadAsync(id, userId);
        if (!ok) return NotFound(new { message = "Notification not found." });
        return Ok(new { message = "Marked as read." });
    }
}
