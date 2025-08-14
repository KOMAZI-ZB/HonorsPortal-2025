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
            // ✅ Use explicit INNER JOINs to avoid SQL APPLY (not supported by SQLite)
            var rows = await (
                from um in _context.UserModules
                join m in _context.Modules on um.ModuleId equals m.Id
                join s in _context.ClassSessions on m.Id equals s.ModuleId
                where um.AppUserId == userId && m.Semester == semester
                select new ClassScheduleDto
                {
                    ModuleCode = m.ModuleCode,
                    ModuleName = m.ModuleName,
                    Semester = m.Semester,
                    Venue = s.Venue,
                    WeekDay = s.WeekDay,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime
                }
            )
            .OrderBy(r => r.StartTime)
            .ThenBy(r => r.EndTime)
            .ThenBy(r => r.WeekDay)
            .ToListAsync();

            return rows;
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
                    Description = a.Description, // ✅ include description
                    Date = a.Date.ToString("yyyy-MM-dd"),
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    DueTime = a.DueTime,
                    Venue = a.Venue,
                    IsTimed = a.IsTimed,
                    ModuleCode = a.Module.ModuleCode
                })
                .OrderBy(a => a.Date)
                .ThenBy(a => a.StartTime ?? a.DueTime)
                .ToList();

            return result;
        }
    }
}
