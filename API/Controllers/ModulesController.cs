
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

            // legacy fields optional/ignored for schedule rendering
            ClassVenue = dto.ClassVenue,
            WeekDays = dto.WeekDays != null ? string.Join(",", dto.WeekDays) : null,
            StartTimes = dto.StartTimes != null ? string.Join(",", dto.StartTimes) : null,
            EndTimes = dto.EndTimes != null ? string.Join(",", dto.EndTimes) : null
        };

        // ✅ Persist per-venue sessions
        if (dto.ClassSessions != null)
        {
            foreach (var s in dto.ClassSessions)
            {
                module.ClassSessions.Add(new ClassSession
                {
                    Venue = s.Venue,
                    WeekDay = s.WeekDay,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime
                });
            }
        }

        context.Modules.Add(module);
        await context.SaveChangesAsync();

        return Ok(new { message = "Module created successfully.", moduleId = module.Id });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetAllModules()
    {
        var modules = await context.Modules
            .Include(m => m.ClassSessions)
            .ToListAsync();

        var result = modules.Select(m => new ModuleDto
        {
            Id = m.Id,
            ModuleCode = m.ModuleCode,
            ModuleName = m.ModuleName,
            Semester = m.Semester,
            ClassVenue = m.ClassVenue,
            WeekDays = m.WeekDays?.Split(',') ?? [],
            StartTimes = m.StartTimes?.Split(',') ?? [],
            EndTimes = m.EndTimes?.Split(',') ?? [],
            ClassSessions = m.ClassSessions.Select(s => new ClassSessionDto
            {
                Id = s.Id,
                Venue = s.Venue,
                WeekDay = s.WeekDay,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            }).ToList()
        }).ToList();

        return Ok(result);
    }

    [Authorize]
    [HttpGet("semester/{semester}")]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetModulesBySemester(int semester)
    {
        var userId = int.Parse(User.GetUserId());

        if (User.IsInRole("Admin"))
        {
            var allModules = await context.Modules
                .Where(m => m.Semester == semester)
                .Include(m => m.ClassSessions)
                .ToListAsync();

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
                ClassSessions = m.ClassSessions.Select(s => new ClassSessionDto
                {
                    Id = s.Id,
                    Venue = s.Venue,
                    WeekDay = s.WeekDay,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime
                }).ToList()
            }).ToList());
        }

        var assignedModules = await context.UserModules
            .Where(um => um.AppUserId == userId && um.Module.Semester == semester)
            .Include(um => um.Module)
                .ThenInclude(m => m.ClassSessions)
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
            ClassSessions = m.ClassSessions.Select(s => new ClassSessionDto
            {
                Id = s.Id,
                Venue = s.Venue,
                WeekDay = s.WeekDay,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            }).ToList()
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
        var sessions = await context.ClassSessions.Where(x => x.ModuleId == id).ToListAsync();

        context.UserModules.RemoveRange(userLinks);
        context.Documents.RemoveRange(docs);
        context.Announcements.RemoveRange(announcements);
        context.Assessments.RemoveRange(assessments);
        context.ClassSessions.RemoveRange(sessions);
        context.Modules.Remove(module);

        await context.SaveChangesAsync();
        return Ok(new { message = "Module deleted." });
    }

    [Authorize(Roles = "Admin,Lecturer,Coordinator")]
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateModule(int id, UpdateModuleDto dto)
    {
        var module = await context.Modules
            .Include(m => m.ClassSessions)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (module == null) return NotFound(new { message = "Module not found." });

        // snapshot original sessions
        var original = module.ClassSessions
            .Select(s => new { s.Venue, s.WeekDay, s.StartTime, s.EndTime })
            .OrderBy(x => x.Venue).ThenBy(x => x.WeekDay).ThenBy(x => x.StartTime).ThenBy(x => x.EndTime)
            .ToList();

        // basic fields
        module.ModuleCode = dto.ModuleCode ?? module.ModuleCode;
        module.ModuleName = dto.ModuleName ?? module.ModuleName;
        module.Semester = dto.Semester != 0 ? dto.Semester : module.Semester;

        // legacy fields (kept writable)
        module.ClassVenue = dto.ClassVenue;
        module.WeekDays = dto.WeekDays != null ? string.Join(",", dto.WeekDays) : null;
        module.StartTimes = dto.StartTimes != null ? string.Join(",", dto.StartTimes) : null;
        module.EndTimes = dto.EndTimes != null ? string.Join(",", dto.EndTimes) : null;

        // replace sessions
        var existing = await context.ClassSessions.Where(s => s.ModuleId == id).ToListAsync();
        context.ClassSessions.RemoveRange(existing);

        if (dto.ClassSessions != null)
        {
            foreach (var s in dto.ClassSessions)
            {
                context.ClassSessions.Add(new ClassSession
                {
                    ModuleId = id,
                    Venue = s.Venue,
                    WeekDay = s.WeekDay,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime
                });
            }
        }

        // replace assessments (as before)
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

        await context.SaveChangesAsync();

        // compare sessions to decide announcement
        var current = await context.ClassSessions.Where(s => s.ModuleId == id)
            .Select(s => new { s.Venue, s.WeekDay, s.StartTime, s.EndTime })
            .OrderBy(x => x.Venue).ThenBy(x => x.WeekDay).ThenBy(x => x.StartTime).ThenBy(x => x.EndTime)
            .ToListAsync();

        bool scheduleChanged = original.Count != current.Count
            || original.Zip(current, (o, c) =>
                o.Venue != c.Venue || o.WeekDay != c.WeekDay || o.StartTime != c.StartTime || o.EndTime != c.EndTime)
               .Any(diff => diff);

        Announcement? announcement = null;
        if (scheduleChanged)
        {
            announcement = new Announcement
            {
                Title = $"Schedule Updated for {module.ModuleCode}",
                Message = $"The class timetable (venues/days/times) for {module.ModuleCode} has changed. Please check your schedule.",
                Type = "ScheduleUpdate",
                ModuleId = module.Id,
                CreatedBy = User.GetUsername(),
                CreatedAt = DateTime.UtcNow
            };
            context.Announcements.Add(announcement);
            await context.SaveChangesAsync();
        }

        return Ok(new { message = "Module updated successfully.", announcement });
    }

    // ⬇️ Restored EXACTLY as before (same route and roles)
    [Authorize(Roles = "Lecturer,Coordinator")]
    [HttpGet("assigned")]
    public async Task<ActionResult<IEnumerable<ModuleDto>>> GetAssignedModules()
    {
        var userId = int.Parse(User.GetUserId());

        var assignedModules = await context.UserModules
            .Where(um => um.AppUserId == userId &&
                         (um.RoleContext == "Lecturer" || um.RoleContext == "Coordinator"))
            .Include(um => um.Module)
                .ThenInclude(m => m.ClassSessions) // harmless include for modal convenience
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
            ClassSessions = m.ClassSessions.Select(s => new ClassSessionDto
            {
                Id = s.Id,
                Venue = s.Venue,
                WeekDay = s.WeekDay,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            }).ToList()
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
            Id = a.Id,
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
            .Include(m => m.ClassSessions)
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
            ClassSessions = module.ClassSessions.Select(s => new ClassSessionDto
            {
                Id = s.Id,
                Venue = s.Venue,
                WeekDay = s.WeekDay,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            }).ToList(),
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
