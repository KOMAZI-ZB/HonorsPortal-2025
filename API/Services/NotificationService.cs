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

public class NotificationService : INotificationService
{
    private readonly DataContext _context;
    private readonly IMapper _mapper;
    private readonly Cloudinary _cloudinary;

    public NotificationService(DataContext context, IMapper mapper, IConfiguration config)
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

    public async Task<PagedList<NotificationDto>> GetAllPaginatedAsync(QueryParams queryParams)
    {
        var user = await _context.Users
            .Include(u => u.UserModules)
            .FirstOrDefaultAsync(u => u.UserName == queryParams.CurrentUserName);

        if (user == null)
            return new PagedList<NotificationDto>(new List<NotificationDto>(), 0, queryParams.PageNumber, queryParams.PageSize);

        var userId = user.Id;
        var userName = user.UserName;
        var joinDate = user.JoinDate;
        var registeredModuleIds = user.UserModules.Select(um => um.ModuleId).ToList();

        var roles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        bool isStudent = roles.Contains("Student");
        bool isStaff = roles.Contains("Lecturer") || roles.Contains("Coordinator") || roles.Contains("Admin");

        var query = _context.Notifications.AsQueryable();

        // Join date filter
        if (joinDate is not null)
        {
            var joinDateTime = joinDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.CreatedAt >= joinDateTime);
        }

        // Module scoping — include author’s own posts regardless of module linkage
        query = query.Where(a =>
            a.CreatedBy == userName || // author can always see
            a.ModuleId == null ||
            registeredModuleIds.Contains(a.ModuleId.Value)
        );

        // Announcements vs notifications filter
        if (!string.IsNullOrWhiteSpace(queryParams.TypeFilter))
        {
            var filter = queryParams.TypeFilter.Trim().ToLowerInvariant();
            if (filter == "announcements")
            {
                query = query.Where(a => a.Type.ToLower() == "general" || a.Type.ToLower() == "system");
            }
            else if (filter == "notifications")
            {
                query = query.Where(a => a.Type.ToLower() != "general" && a.Type.ToLower() != "system");
            }
        }

        // Audience targeting — include author’s own posts regardless of audience
        query = query.Where(a =>
            a.CreatedBy == userName ||
            a.Audience == "All" ||
            (a.Audience == "Students" && isStudent) ||
            (a.Audience == "Staff" && isStaff) ||
            (a.Audience == "ModuleStudents" && isStudent && a.ModuleId != null && registeredModuleIds.Contains(a.ModuleId.Value))
        );

        var readsForUser = _context.NotificationReads.Where(r => r.UserId == userId);

        var dtoQuery =
            from a in query.OrderByDescending(a => a.CreatedAt)
            join r in readsForUser on a.Id equals r.NotificationId into gj
            from read in gj.DefaultIfEmpty()
            select new NotificationDto
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

        return await PagedList<NotificationDto>.CreateAsync(
            dtoQuery,
            queryParams.PageNumber,
            queryParams.PageSize
        );
    }

    public async Task<NotificationDto?> CreateAsync(CreateNotificationDto dto, string createdByUserName)
    {
        // Upload image if present — now strictly images
        string? imagePath = null;
        if (dto.Image != null)
        {
            using var stream = dto.Image.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(dto.Image.FileName, stream),
                Folder = "academic-portal-notifications",
                UseFilename = true,
                UniqueFilename = false,
                Overwrite = false
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            if (uploadResult.Error != null)
                throw new Exception(uploadResult.Error.Message);

            imagePath = uploadResult.SecureUrl?.AbsoluteUri;
        }

        var audience = string.IsNullOrWhiteSpace(dto.Audience) ? "All" : dto.Audience;

        // If document upload (system side), scope to module students and tag module
        if (dto.Type.Equals("DocumentUpload", StringComparison.OrdinalIgnoreCase) && dto.ModuleId is not null)
        {
            audience = "ModuleStudents";

            var module = await _context.Modules.FindAsync(dto.ModuleId.Value);
            if (module != null)
            {
                var codeTag = $"[{module.ModuleCode}] ";
                if (!dto.Title.StartsWith(codeTag, StringComparison.OrdinalIgnoreCase))
                    dto.Title = codeTag + dto.Title;

                if (!dto.Message.Contains(module.ModuleCode, StringComparison.OrdinalIgnoreCase))
                    dto.Message = $"{dto.Message} (Module: {module.ModuleCode})";
            }
        }

        // Defence-in-depth for Lecturer
        var creator = await _context.Users
            .Include(u => u.UserModules)
            .FirstOrDefaultAsync(u => u.UserName == createdByUserName);

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

        var notification = new Notification
        {
            Type = dto.Type,
            Title = dto.Title.Trim(),
            Message = dto.Message,
            ImagePath = imagePath,
            CreatedBy = createdByUserName,
            CreatedAt = DateTime.UtcNow,
            ModuleId = dto.ModuleId,
            Audience = audience
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return _mapper.Map<NotificationDto>(notification);
    }

    public async Task<bool> DeleteAsync(int id, string requesterUserName, bool isAdmin)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null) return false;

        if (!isAdmin && notification.CreatedBy != requesterUserName)
            return false;

        _context.Notifications.Remove(notification);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
    {
        var exists = await _context.Notifications.AnyAsync(a => a.Id == notificationId);
        if (!exists) return false;

        var already = await _context.NotificationReads
            .AnyAsync(r => r.NotificationId == notificationId && r.UserId == userId);
        if (already) return true;

        _context.NotificationReads.Add(new NotificationRead
        {
            NotificationId = notificationId,
            UserId = userId,
            ReadAt = DateTime.UtcNow
        });

        return await _context.SaveChangesAsync() > 0;
    }

    // 🆕 Persist "unread" by removing the read receipt
    public async Task<bool> UnmarkAsReadAsync(int notificationId, int userId)
    {
        var rec = await _context.NotificationReads
            .FirstOrDefaultAsync(r => r.NotificationId == notificationId && r.UserId == userId);

        if (rec == null)
        {
            // not found is effectively "already unread" — report false only if the notification itself doesn't exist
            var exists = await _context.Notifications.AnyAsync(a => a.Id == notificationId);
            return exists;
        }

        _context.NotificationReads.Remove(rec);
        return await _context.SaveChangesAsync() > 0;
    }
}
