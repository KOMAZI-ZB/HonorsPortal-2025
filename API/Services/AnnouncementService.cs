using API.Data;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly DataContext _context;
    private readonly IMapper _mapper;
    private readonly Cloudinary _cloudinary;

    public AnnouncementService(DataContext context, IMapper mapper, IConfiguration config)
    {
        _context = context;
        _mapper = mapper;

        var acc = new Account(
            config["CloudinarySettings:CloudName"],
            config["CloudinarySettings:ApiKey"],
            config["CloudinarySettings:ApiSecret"]
        );

        _cloudinary = new Cloudinary(acc);
    }

    public async Task<PagedList<AnnouncementDto>> GetAllPaginatedAsync(QueryParams queryParams)
    {
        // ✅ Fetch current user with modules and roles
        var user = await _context.Users
            .Include(u => u.UserModules)
            .FirstOrDefaultAsync(u => u.UserNumber == queryParams.CurrentUserNumber);

        if (user == null)
        {
            return new PagedList<AnnouncementDto>(new List<AnnouncementDto>(), 0, queryParams.PageNumber, queryParams.PageSize);
        }

        var userId = user.Id;
        var joinDate = user.JoinDate;
        var registeredModuleIds = user.UserModules.Select(um => um.ModuleId).ToList();

        var roles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        bool isStudent = roles.Contains("Student");
        bool isStaff = roles.Contains("Lecturer") || roles.Contains("Coordinator") || roles.Contains("Admin");

        var query = _context.Announcements.AsQueryable();

        // ✅ Filter by join date
        if (joinDate is not null)
        {
            var joinDateTime = joinDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.CreatedAt >= joinDateTime);
        }

        // ✅ Base module scoping (global = null, else must be a registered module)
        query = query.Where(a => a.ModuleId == null || registeredModuleIds.Contains(a.ModuleId.Value));

        // ✅ Filter by type (announcement vs notification)
        if (!string.IsNullOrEmpty(queryParams.TypeFilter))
        {
            var filter = queryParams.TypeFilter.ToLower();
            if (filter == "announcement")
            {
                query = query.Where(a =>
                    a.Type.ToLower() == "general" || a.Type.ToLower() == "system");
            }
            else if (filter == "notification")
            {
                query = query.Where(a =>
                    a.Type.ToLower() != "general" && a.Type.ToLower() != "system");
            }
        }

        // ✅ Audience filtering
        query = query.Where(a =>
            a.Audience == "All" ||
            (a.Audience == "Students" && isStudent) ||
            (a.Audience == "Staff" && isStaff) ||
            (a.Audience == "ModuleStudents" && isStudent && a.ModuleId != null && registeredModuleIds.Contains(a.ModuleId.Value))
        );

        // ✅ Left-join read receipts to compute IsRead
        var readsForUser = _context.AnnouncementReads.Where(r => r.UserId == userId);

        var dtoQuery = from a in query.OrderByDescending(a => a.CreatedAt)
                       join r in readsForUser on a.Id equals r.AnnouncementId into gj
                       from read in gj.DefaultIfEmpty()
                       select new AnnouncementDto
                       {
                           Id = a.Id,
                           Type = a.Type,
                           Title = a.Title,
                           Message = a.Message,
                           ImagePath = a.ImagePath,
                           CreatedBy = a.CreatedBy,
                           CreatedAt = a.CreatedAt,
                           ModuleId = a.ModuleId,
                           Audience = a.Audience,
                           IsRead = read != null
                       };

        return await PagedList<AnnouncementDto>.CreateAsync(
            dtoQuery,
            queryParams.PageNumber,
            queryParams.PageSize
        );
    }

    public async Task<AnnouncementDto?> CreateAsync(CreateAnnouncementDto dto, string createdByUserNumber)
    {
        // Upload image if present
        string? imagePath = null;
        if (dto.Image != null)
        {
            using var stream = dto.Image.OpenReadStream();
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(dto.Image.FileName, stream),
                Folder = "academic-portal-announcements"
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            if (uploadResult.Error != null)
                throw new Exception(uploadResult.Error.Message);

            imagePath = uploadResult.SecureUrl.AbsoluteUri;
        }

        // Normalize audience
        var audience = string.IsNullOrWhiteSpace(dto.Audience) ? "All" : dto.Audience;

        // If this is a document upload, ensure it's module-scoped to students and includes module code.
        if (dto.Type.Equals("DocumentUpload", StringComparison.OrdinalIgnoreCase) && dto.ModuleId is not null)
        {
            audience = "ModuleStudents"; // only students registered for the module

            var module = await _context.Modules.FindAsync(dto.ModuleId.Value);
            if (module != null)
            {
                // Prefix module code to title if not already present
                var codeTag = $"[{module.ModuleCode}] ";
                if (!dto.Title.StartsWith(codeTag, StringComparison.OrdinalIgnoreCase))
                    dto.Title = codeTag + dto.Title;

                // Ensure module code is in message
                if (!dto.Message.Contains(module.ModuleCode, StringComparison.OrdinalIgnoreCase))
                    dto.Message = $"{dto.Message} (Module: {module.ModuleCode})";
            }
        }

        // If created by a lecturer, verify module allocation (defence-in-depth)
        var creator = await _context.Users
            .Include(u => u.UserModules)
            .FirstOrDefaultAsync(u => u.UserNumber == createdByUserNumber);

        if (creator == null) throw new Exception("Creator not found.");

        var creatorRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == creator.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        if (creatorRoles.Contains("Lecturer"))
        {
            if (dto.ModuleId is null)
                throw new Exception("Lecturers must target a specific module.");
            var lecturerModuleIds = creator.UserModules
                .Where(um => um.RoleContext == "Lecturer")
                .Select(um => um.ModuleId)
                .ToHashSet();
            if (!lecturerModuleIds.Contains(dto.ModuleId.Value))
                throw new Exception("You are not assigned as Lecturer for the selected module.");

            audience = "ModuleStudents";
        }

        var announcement = new Announcement
        {
            Type = dto.Type,
            Title = dto.Title.Trim(),
            Message = dto.Message,
            ImagePath = imagePath,
            CreatedBy = createdByUserNumber,
            CreatedAt = DateTime.UtcNow,
            ModuleId = dto.ModuleId,
            Audience = audience
        };

        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        return _mapper.Map<AnnouncementDto>(announcement);
    }

    public async Task<bool> DeleteAsync(int id, string requesterUserNumber, bool isAdmin)
    {
        var announcement = await _context.Announcements.FindAsync(id);
        if (announcement == null) return false;

        if (!isAdmin && announcement.CreatedBy != requesterUserNumber)
            return false;

        _context.Announcements.Remove(announcement);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> MarkAsReadAsync(int announcementId, int userId)
    {
        var exists = await _context.Announcements.AnyAsync(a => a.Id == announcementId);
        if (!exists) return false;

        var already = await _context.AnnouncementReads
            .AnyAsync(r => r.AnnouncementId == announcementId && r.UserId == userId);
        if (already) return true; // idempotent

        _context.AnnouncementReads.Add(new AnnouncementRead
        {
            AnnouncementId = announcementId,
            UserId = userId,
            ReadAt = DateTime.UtcNow
        });

        return await _context.SaveChangesAsync() > 0;
    }
}
