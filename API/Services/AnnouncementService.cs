using API.Data;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
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
        // ✅ Fetch user with registered modules
        var user = await _context.Users
            .Include(u => u.UserModules)
            .FirstOrDefaultAsync(u => u.UserNumber == queryParams.CurrentUserNumber);

        if (user == null)
        {
            return new PagedList<AnnouncementDto>(new List<AnnouncementDto>(), 0, queryParams.PageNumber, queryParams.PageSize);
        }


        var joinDate = user.JoinDate;
        var registeredModuleIds = user.UserModules.Select(um => um.ModuleId).ToList();

        var query = _context.Announcements.AsQueryable();

        // ✅ Filter by join date
        if (joinDate is not null)
        {
            var joinDateTime = joinDate.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(a => a.CreatedAt >= joinDateTime);
        }

        // ✅ Filter by module registration (null = global announcement, or user must be registered)
        query = query.Where(a => a.ModuleId == null || registeredModuleIds.Contains(a.ModuleId.Value));

        // ✅ Filter by type (announcement/notification)
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

        var projectedQuery = query
            .ProjectTo<AnnouncementDto>(_mapper.ConfigurationProvider)
            .OrderByDescending(a => a.CreatedAt);

        return await PagedList<AnnouncementDto>.CreateAsync(
            projectedQuery,
            queryParams.PageNumber,
            queryParams.PageSize
        );
    }

    public async Task<AnnouncementDto?> CreateAsync(CreateAnnouncementDto dto, string createdByUserNumber)
    {
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

        var announcement = new Announcement
        {
            Type = dto.Type,
            Title = dto.Title.Trim(),
            Message = dto.Message,
            ImagePath = imagePath,
            CreatedBy = createdByUserNumber,
            CreatedAt = DateTime.UtcNow,
            ModuleId = dto.ModuleId
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
}
