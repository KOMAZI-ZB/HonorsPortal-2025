using API.DTOs;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class SchedulerController(
    ILabBookingService bookingService,
    ISchedulerService schedulerService
) : BaseApiController
{
    private readonly ILabBookingService _bookingService = bookingService;
    private readonly ISchedulerService _schedulerService = schedulerService;

    // ✅ Get all lab bookings (Admin view)
    [HttpGet("lab")]
    public async Task<ActionResult<IEnumerable<LabBookingDto>>> GetAllBookings()
    {
        var bookings = await _bookingService.GetAllBookingsAsync();
        return Ok(bookings);
    }

    // ✅ Get lab bookings for the current user
    [HttpGet("lab/user")]
    public async Task<ActionResult<IEnumerable<LabBookingDto>>> GetMyBookings()
    {
        var userNumber = User.GetUsername();
        var bookings = await _bookingService.GetBookingsByUserAsync(userNumber);
        return Ok(bookings);
    }

    // ✅ Create a lab booking (self)
    [Authorize(Roles = "Lecturer,Coordinator,Admin")]
    [HttpPost("lab")]
    public async Task<ActionResult> CreateBooking([FromBody] CreateLabBookingDto dto)
    {
        var userNumber = User.GetUsername();
        var success = await _bookingService.CreateBookingAsync(userNumber, dto);
        if (!success) return BadRequest("Booking overlaps with an existing entry.");
        return Ok(new { message = "Booking created successfully." });
    }

    // ✅ Create a lab booking on behalf of another user
    [Authorize(Roles = "Admin")]
    [HttpPost("lab/assign/{userNumber}")]
    public async Task<ActionResult> CreateBookingForUser(string userNumber, [FromBody] CreateLabBookingDto dto)
    {
        var success = await _bookingService.CreateBookingAsync(userNumber, dto);
        if (!success) return BadRequest("Booking overlaps with an existing entry.");
        return Ok(new { message = $"Booking created for user {userNumber}." });
    }

    // ✅ Delete a lab booking (self or admin/coordinator)
    [HttpDelete("lab/{id}")]
    public async Task<ActionResult> DeleteBooking(int id)
    {
        var userNumber = User.GetUsername();
        var isPrivileged = User.IsInRole("Coordinator") || User.IsInRole("Admin");

        var success = await _bookingService.DeleteBookingAsync(id, userNumber, isPrivileged);
        if (!success) return Forbid("You do not have permission to delete this booking.");
        return Ok(new { message = "Booking deleted successfully." });
    }

    // ✅ Get class schedule for user
    [HttpGet("class/{semester}")]
    public async Task<ActionResult<IEnumerable<ClassScheduleDto>>> GetClassSchedule(int semester)
    {
        var userIdString = User.GetUserId();
        if (!int.TryParse(userIdString, out var userId)) return Unauthorized("Invalid user ID");

        var result = await _schedulerService.GetClassScheduleForUserAsync(userId, semester);
        return Ok(result);
    }

    // ✅ Get assessment schedule for user (REPLACED TestSchedule)
    [HttpGet("assessment/{semester}")]
    public async Task<ActionResult<IEnumerable<AssessmentDto>>> GetAssessmentSchedule(int semester)
    {
        var userIdString = User.GetUserId();
        if (!int.TryParse(userIdString, out var userId)) return Unauthorized("Invalid user ID");

        var result = await _schedulerService.GetAssessmentScheduleForUserAsync(userId, semester);
        return Ok(result);
    }
}
