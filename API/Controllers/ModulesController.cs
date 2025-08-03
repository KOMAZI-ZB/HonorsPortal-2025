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
            EndTimes = dto.EndTimes != null ? string.Join(",", dto.EndTimes) : null
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
            EndTimes = m.EndTimes?.Split(',') ?? []
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
                EndTimes = m.EndTimes?.Split(',') ?? []
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
            EndTimes = m.EndTimes?.Split(',') ?? []
        }).ToList());
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteModule(int id)
    {
        var module = await context.Modules.FindAsync(id);
        if (module == null) return NotFound("Module not found.");

        var userLinks = await context.UserModules.Where(x => x.ModuleId == id).ToListAsync();
        var docs = await context.Documents.Where(x => x.ModuleId == id).ToListAsync();
        var announcements = await context.Announcements.Where(x => x.ModuleId == id).ToListAsync();
        var assessments = await context.Assessments.Where(x => x.ModuleId == id).ToListAsync();

        context.UserModules.RemoveRange(userLinks);
        context.Documents.RemoveRange(docs);
        context.Announcements.RemoveRange(announcements);
        context.Assessments.RemoveRange(assessments);

        context.Modules.Remove(module);

        await context.SaveChangesAsync();
        return Ok(new { message = "Module deleted." });
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
            module.EndTimes != string.Join(",", dto.EndTimes ?? []);

        module.ModuleCode = dto.ModuleCode ?? module.ModuleCode;
        module.ModuleName = dto.ModuleName ?? module.ModuleName;
        module.Semester = dto.Semester != 0 ? dto.Semester : module.Semester;
        module.ClassVenue = dto.ClassVenue;
        module.WeekDays = dto.WeekDays != null ? string.Join(",", dto.WeekDays) : null;
        module.StartTimes = dto.StartTimes != null ? string.Join(",", dto.StartTimes) : null;
        module.EndTimes = dto.EndTimes != null ? string.Join(",", dto.EndTimes) : null;

        // 🔁 Replace all assessments with the new ones
        var existingAssessments = await context.Assessments.Where(a => a.ModuleId == id).ToListAsync();
        context.Assessments.RemoveRange(existingAssessments);

        if (dto.Assessments != null)
        {
            foreach (var a in dto.Assessments)
            {
                context.Assessments.Add(new Assessment
                {
                    Title = a.Title,
                    Date = DateOnly.Parse(a.Date),
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    DueTime = a.DueTime,
                    Venue = a.Venue,
                    IsTimed = a.IsTimed,
                    ModuleId = id
                });
            }
        }

        Announcement? announcement = null;
        if (scheduleChanged)
        {
            announcement = new Announcement
            {
                Title = $"Schedule Updated for {module.ModuleCode}",
                Message = $"The class timetable for module {module.ModuleCode} has been changed. Please check your schedule.",
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
            EndTimes = m.EndTimes?.Split(',') ?? []
        }).ToList();
    }

    [Authorize(Roles = "Admin,Lecturer,Coordinator")]
    [HttpGet("{id}/assessments")]
    public async Task<ActionResult<IEnumerable<AssessmentDto>>> GetAssessmentsByModule(int id)
    {
        var assessments = await context.Assessments
            .Where(a => a.ModuleId == id)
            .ToListAsync();

        var results = assessments.Select(a => new AssessmentDto
        {
            Title = a.Title,
            Date = a.Date.ToString("yyyy-MM-dd"),
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            DueTime = a.DueTime,
            Venue = a.Venue,
            IsTimed = a.IsTimed
        });

        return Ok(results);
    }

    [Authorize(Roles = "Admin,Lecturer,Coordinator")]
    [HttpGet("{id}")]
    public async Task<ActionResult<ModuleDto>> GetModuleById(int id)
    {
        var module = await context.Modules
            .Include(m => m.Assessments)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (module == null) return NotFound();

        return new ModuleDto
        {
            Id = module.Id,
            ModuleCode = module.ModuleCode,
            ModuleName = module.ModuleName,
            Semester = module.Semester,
            ClassVenue = module.ClassVenue,
            WeekDays = module.WeekDays?.Split(',') ?? [],
            StartTimes = module.StartTimes?.Split(',') ?? [],
            EndTimes = module.EndTimes?.Split(',') ?? [],
            Assessments = module.Assessments.Select(a => new AssessmentDto
            {
                Id = a.Id,
                Title = a.Title,
                Date = a.Date.ToString("yyyy-MM-dd"),
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                DueTime = a.DueTime,
                Venue = a.Venue,
                IsTimed = a.IsTimed
            }).ToList()
        };
    }
}
