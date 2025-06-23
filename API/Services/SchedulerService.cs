using API.Data;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class SchedulerService : ISchedulerService
{
    private readonly DataContext _context;
    private readonly IMapper _mapper;

    public SchedulerService(DataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ClassScheduleDto>> GetClassScheduleForUserAsync(int userId, int semester)
    {
        var modules = await _context.UserModules
            .Include(um => um.Module)
            .Where(um => um.AppUserId == userId && um.Module.Semester == semester)
            .Select(um => um.Module)
            .ToListAsync();

        var result = modules.Select(m => new ClassScheduleDto
        {
            ModuleCode = m.ModuleCode,
            ModuleName = m.ModuleName,
            Semester = m.Semester,
            ClassVenue = m.ClassVenue,
            WeekDays = m.WeekDays?.Split(',') ?? Array.Empty<string>(),
            StartTimes = m.StartTimes?.Split(',') ?? Array.Empty<string>(),
            EndTimes = m.EndTimes?.Split(',') ?? Array.Empty<string>()
        });

        return result;
    }

    public async Task<IEnumerable<TestScheduleDto>> GetTestScheduleForUserAsync(int userId, int semester)
    {
        var modules = await _context.UserModules
            .Include(um => um.Module)
            .Where(um => um.AppUserId == userId && um.Module.Semester == semester)
            .Select(um => um.Module)
            .ToListAsync();

        var results = new List<TestScheduleDto>();

        foreach (var module in modules)
        {
            if (module.Test1Date != null && module.Test1StartTime != null && module.Test1EndTime != null)
            {
                results.Add(new TestScheduleDto
                {
                    ModuleCode = module.ModuleCode,
                    ModuleName = module.ModuleName,
                    Semester = module.Semester,
                    TestType = "Test 1",
                    TestDate = module.Test1Date?.ToString("yyyy-MM-dd"),
                    StartTime = module.Test1StartTime?.ToString("HH:mm:ss"),
                    EndTime = module.Test1EndTime?.ToString("HH:mm:ss"),
                    Venue = module.Test1Venue
                });
            }

            if (module.Test2Date != null && module.Test2StartTime != null && module.Test2EndTime != null)
            {
                results.Add(new TestScheduleDto
                {
                    ModuleCode = module.ModuleCode,
                    ModuleName = module.ModuleName,
                    Semester = module.Semester,
                    TestType = "Test 2",
                    TestDate = module.Test2Date?.ToString("yyyy-MM-dd"),
                    StartTime = module.Test2StartTime?.ToString("HH:mm:ss"),
                    EndTime = module.Test2EndTime?.ToString("HH:mm:ss"),
                    Venue = module.Test2Venue
                });
            }

            if (module.SupplementaryDate != null && module.SupplementaryStartTime != null && module.SupplementaryEndTime != null)
            {
                results.Add(new TestScheduleDto
                {
                    ModuleCode = module.ModuleCode,
                    ModuleName = module.ModuleName,
                    Semester = module.Semester,
                    TestType = "Supplementary",
                    TestDate = module.SupplementaryDate?.ToString("yyyy-MM-dd"),
                    StartTime = module.SupplementaryStartTime?.ToString("HH:mm:ss"),
                    EndTime = module.SupplementaryEndTime?.ToString("HH:mm:ss"),
                    Venue = module.SupplementaryVenue
                });
            }
        }

        return results.OrderBy(r => r.TestType).ThenBy(r => r.TestDate);
    }
}
