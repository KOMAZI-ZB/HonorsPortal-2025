using API.Data;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace API.Services
{
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

        public async Task<IEnumerable<AssessmentDto>> GetAssessmentScheduleForUserAsync(int userId, int semester)
        {
            var moduleIds = await _context.UserModules
                .Where(um => um.AppUserId == userId && um.Module.Semester == semester)
                .Select(um => um.ModuleId)
                .ToListAsync();

            var assessments = await _context.Assessments
                .Include(a => a.Module)
                .Where(a => moduleIds.Contains(a.ModuleId))
                .ToListAsync();

            var result = assessments
                .Select(a => new AssessmentDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Date = a.Date.ToString("yyyy-MM-dd"), // ✅ Convert DateOnly to string
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    DueTime = a.DueTime,
                    Venue = a.Venue,
                    IsTimed = a.IsTimed,
                    ModuleCode = a.Module.ModuleCode
                })
                .OrderBy(a => a.Date)
                .ThenBy(a => a.StartTime ?? a.DueTime) // If no start time, fallback to due time
                .ToList();

            return result;
        }
    }
}
