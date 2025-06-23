using API.DTOs;
using API.Entities;
using API.Data;
using API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize]
public class ModulesController(DataContext context) : BaseApiController
{
    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost]
    public async Task<ActionResult> AddModule(ModuleDto dto)
    {
        var module = new Module
        {
            ModuleCode = dto.ModuleCode,
            ModuleName = dto.ModuleName,
            Semester = dto.Semester,
            ClassVenue = dto.ClassVenue,
            WeekDays = dto.WeekDays != null ? string.Join(",", dto.WeekDays) : null,
            StartTimes = dto.StartTimes != null ? string.Join(",", dto.StartTimes) : null,
            EndTimes = dto.EndTimes != null ? string.Join(",", dto.EndTimes) : null,

            Test1Venue = dto.Test1Venue,
            Test1Date = dto.Test1Date,
            Test1StartTime = dto.Test1StartTime,
            Test1EndTime = dto.Test1EndTime,

            Test2Venue = dto.Test2Venue,
            Test2Date = dto.Test2Date,
            Test2StartTime = dto.Test2StartTime,
            Test2EndTime = dto.Test2EndTime,

            SupplementaryVenue = dto.SupplementaryVenue,
            SupplementaryDate = dto.SupplementaryDate,
            SupplementaryStartTime = dto.SupplementaryStartTime,
            SupplementaryEndTime = dto.SupplementaryEndTime
        };

        context.Modules.Add(module);
        await context.SaveChangesAsync();

        return Ok(new { message = "Module created successfully.", module });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetAllModules()
    {
        var modules = await context.Modules.ToListAsync();

        return modules.Select(m => new ModuleDto
        {
            Id = m.Id,
            ModuleCode = m.ModuleCode,
            ModuleName = m.ModuleName,
            Semester = m.Semester,
            ClassVenue = m.ClassVenue,
            WeekDays = m.WeekDays?.Split(',') ?? [],
            StartTimes = m.StartTimes?.Split(',') ?? [],
            EndTimes = m.EndTimes?.Split(',') ?? [],
            Test1Venue = m.Test1Venue,
            Test1Date = m.Test1Date,
            Test1StartTime = m.Test1StartTime,
            Test1EndTime = m.Test1EndTime,
            Test2Venue = m.Test2Venue,
            Test2Date = m.Test2Date,
            Test2StartTime = m.Test2StartTime,
            Test2EndTime = m.Test2EndTime,
            SupplementaryVenue = m.SupplementaryVenue,
            SupplementaryDate = m.SupplementaryDate,
            SupplementaryStartTime = m.SupplementaryStartTime,
            SupplementaryEndTime = m.SupplementaryEndTime
        }).ToList();
    }

    [Authorize]
    [HttpGet("semester/{semester}")]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetModulesBySemester(int semester)
    {
        var userId = int.Parse(User.GetUserId());

        if (User.IsInRole("Admin"))
        {
            var allModules = await context.Modules.Where(m => m.Semester == semester).ToListAsync();
            return Ok(allModules.Select(m => new ModuleDto
            {
                Id = m.Id,
                ModuleCode = m.ModuleCode,
                ModuleName = m.ModuleName,
                Semester = m.Semester,
                ClassVenue = m.ClassVenue,
                WeekDays = m.WeekDays?.Split(',') ?? [],
                StartTimes = m.StartTimes?.Split(',') ?? [],
                EndTimes = m.EndTimes?.Split(',') ?? [],
                Test1Venue = m.Test1Venue,
                Test1Date = m.Test1Date,
                Test1StartTime = m.Test1StartTime,
                Test1EndTime = m.Test1EndTime,
                Test2Venue = m.Test2Venue,
                Test2Date = m.Test2Date,
                Test2StartTime = m.Test2StartTime,
                Test2EndTime = m.Test2EndTime,
                SupplementaryVenue = m.SupplementaryVenue,
                SupplementaryDate = m.SupplementaryDate,
                SupplementaryStartTime = m.SupplementaryStartTime,
                SupplementaryEndTime = m.SupplementaryEndTime
            }).ToList());
        }

        var assignedModules = await context.UserModules
            .Where(um => um.AppUserId == userId && um.Module.Semester == semester)
            .Include(um => um.Module)
            .Select(um => um.Module)
            .ToListAsync();

        return Ok(assignedModules.Select(m => new ModuleDto
        {
            Id = m.Id,
            ModuleCode = m.ModuleCode,
            ModuleName = m.ModuleName,
            Semester = m.Semester,
            ClassVenue = m.ClassVenue,
            WeekDays = m.WeekDays?.Split(',') ?? [],
            StartTimes = m.StartTimes?.Split(',') ?? [],
            EndTimes = m.EndTimes?.Split(',') ?? [],
            Test1Venue = m.Test1Venue,
            Test1Date = m.Test1Date,
            Test1StartTime = m.Test1StartTime,
            Test1EndTime = m.Test1EndTime,
            Test2Venue = m.Test2Venue,
            Test2Date = m.Test2Date,
            Test2StartTime = m.Test2StartTime,
            Test2EndTime = m.Test2EndTime,
            SupplementaryVenue = m.SupplementaryVenue,
            SupplementaryDate = m.SupplementaryDate,
            SupplementaryStartTime = m.SupplementaryStartTime,
            SupplementaryEndTime = m.SupplementaryEndTime
        }).ToList());
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteModule(int id)
    {
        var module = await context.Modules.FindAsync(id);
        if (module == null) return NotFound("Module not found.");

        context.Modules.Remove(module);
        await context.SaveChangesAsync();
        return Ok("Module deleted.");
    }

    [Authorize(Roles = "Admin,Lecturer,Coordinator")]
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateModule(int id, UpdateModuleDto dto)
    {
        var module = await context.Modules.FindAsync(id);
        if (module == null) return NotFound(new { message = "Module not found." });

        bool scheduleChanged =
            module.ClassVenue != dto.ClassVenue ||
            module.WeekDays != string.Join(",", dto.WeekDays ?? []) ||
            module.StartTimes != string.Join(",", dto.StartTimes ?? []) ||
            module.EndTimes != string.Join(",", dto.EndTimes ?? []) ||
            module.Test1Venue != dto.Test1Venue ||
            module.Test1Date != dto.Test1Date ||
            module.Test1StartTime != dto.Test1StartTime ||
            module.Test1EndTime != dto.Test1EndTime ||
            module.Test2Venue != dto.Test2Venue ||
            module.Test2Date != dto.Test2Date ||
            module.Test2StartTime != dto.Test2StartTime ||
            module.Test2EndTime != dto.Test2EndTime ||
            module.SupplementaryVenue != dto.SupplementaryVenue ||
            module.SupplementaryDate != dto.SupplementaryDate ||
            module.SupplementaryStartTime != dto.SupplementaryStartTime ||
            module.SupplementaryEndTime != dto.SupplementaryEndTime;

        module.ModuleCode = dto.ModuleCode ?? module.ModuleCode;
        module.ModuleName = dto.ModuleName ?? module.ModuleName;
        module.Semester = dto.Semester != 0 ? dto.Semester : module.Semester;

        module.ClassVenue = dto.ClassVenue;
        module.WeekDays = dto.WeekDays != null ? string.Join(",", dto.WeekDays) : null;
        module.StartTimes = dto.StartTimes != null ? string.Join(",", dto.StartTimes) : null;
        module.EndTimes = dto.EndTimes != null ? string.Join(",", dto.EndTimes) : null;

        module.Test1Venue = dto.Test1Venue;
        module.Test1Date = dto.Test1Date;
        module.Test1StartTime = dto.Test1StartTime;
        module.Test1EndTime = dto.Test1EndTime;

        module.Test2Venue = dto.Test2Venue;
        module.Test2Date = dto.Test2Date;
        module.Test2StartTime = dto.Test2StartTime;
        module.Test2EndTime = dto.Test2EndTime;

        module.SupplementaryVenue = dto.SupplementaryVenue;
        module.SupplementaryDate = dto.SupplementaryDate;
        module.SupplementaryStartTime = dto.SupplementaryStartTime;
        module.SupplementaryEndTime = dto.SupplementaryEndTime;

        Announcement? announcement = null;
        if (scheduleChanged)
        {
            announcement = new Announcement
            {
                Title = $"Schedule Updated for {module.ModuleCode}",
                Message = $"The timetable or test schedule for module {module.ModuleCode} has been changed. Please check your timetable for updates.",
                Type = "ScheduleUpdate",
                ModuleId = module.Id,
                CreatedBy = User.GetUsername(),
                CreatedAt = DateTime.UtcNow
            };

            context.Announcements.Add(announcement);
        }

        await context.SaveChangesAsync();

        return Ok(new
        {
            message = "Module updated successfully.",
            announcement
        });
    }

    [Authorize(Roles = "Lecturer,Coordinator")]
    [HttpGet("assigned")]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetAssignedModules()
    {
        var userId = int.Parse(User.GetUserId());

        var assignedModules = await context.UserModules
            .Where(um => um.AppUserId == userId &&
                (um.RoleContext == "Lecturer" || um.RoleContext == "Coordinator"))
            .Include(um => um.Module)
            .Select(um => um.Module)
            .ToListAsync();

        return assignedModules.Select(m => new ModuleDto
        {
            Id = m.Id,
            ModuleCode = m.ModuleCode,
            ModuleName = m.ModuleName,
            Semester = m.Semester,
            ClassVenue = m.ClassVenue,
            WeekDays = m.WeekDays?.Split(',') ?? [],
            StartTimes = m.StartTimes?.Split(',') ?? [],
            EndTimes = m.EndTimes?.Split(',') ?? [],
            Test1Venue = m.Test1Venue,
            Test1Date = m.Test1Date,
            Test1StartTime = m.Test1StartTime,
            Test1EndTime = m.Test1EndTime,
            Test2Venue = m.Test2Venue,
            Test2Date = m.Test2Date,
            Test2StartTime = m.Test2StartTime,
            Test2EndTime = m.Test2EndTime,
            SupplementaryVenue = m.SupplementaryVenue,
            SupplementaryDate = m.SupplementaryDate,
            SupplementaryStartTime = m.SupplementaryStartTime,
            SupplementaryEndTime = m.SupplementaryEndTime
        }).ToList();
    }
}
