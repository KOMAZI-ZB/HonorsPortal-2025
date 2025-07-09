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

namespace API.Services
{
    public class DocumentRepository : IDocumentService
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        private readonly Cloudinary _cloudinary;

        public DocumentRepository(DataContext context, IMapper mapper, IConfiguration config)
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

        public async Task<DocumentDto> UploadDocumentAsync(UploadDocumentDto dto, string uploaderUserNumber)
        {
            var user = await _context.Users
                .Include(u => u.UserModules)
                .SingleOrDefaultAsync(u => u.UserNumber == uploaderUserNumber);

            if (user == null)
                throw new Exception("User not found.");

            if (dto.Source == "Module" && dto.ModuleId.HasValue)
            {
                var isAssigned = user.UserModules.Any(um =>
                    um.ModuleId == dto.ModuleId &&
                    (um.RoleContext == "Lecturer" || um.RoleContext == "Coordinator" || um.RoleContext == "Student"));

                if (!isAssigned)
                    throw new Exception("This document must be assigned to a valid module you are registered for.");
            }

            var uploadResult = new RawUploadResult();
            using var stream = dto.File.OpenReadStream();

            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(dto.File.FileName, stream),
                Folder = "academic-portal-docs"
            };

            uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
                throw new Exception(uploadResult.Error.Message);

            var document = new Document
            {
                Title = dto.Title,
                FilePath = uploadResult.SecureUrl.AbsoluteUri,
                UploadedBy = user.LastName,                // For display only
                UploadedByUserNumber = user.UserNumber,    // For access control
                UploadedAt = DateTime.UtcNow,
                ModuleId = dto.ModuleId,
                Source = dto.Source
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return _mapper.Map<DocumentDto>(document);
        }

        public async Task<IEnumerable<DocumentDto>> GetDocumentsByModuleAsync(int moduleId)
        {
            var query = _context.Documents.AsQueryable();

            if (moduleId > 0)
                query = query.Where(d => d.ModuleId == moduleId);
            else
                query = query.Where(d => d.ModuleId != null);

            return await query
                .OrderByDescending(d => d.UploadedAt)
                .ProjectTo<DocumentDto>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public async Task<PagedList<DocumentDto>> GetDocumentsByModulePaginatedAsync(int moduleId, PaginationParams paginationParams)
        {
            var query = _context.Documents.AsQueryable();

            if (moduleId > 0)
                query = query.Where(d => d.ModuleId == moduleId);
            else
                query = query.Where(d => d.ModuleId != null);

            query = query.OrderByDescending(d => d.UploadedAt);

            return await PagedList<DocumentDto>.CreateAsync(
                query.ProjectTo<DocumentDto>(_mapper.ConfigurationProvider),
                paginationParams.PageNumber,
                paginationParams.PageSize
            );
        }

        public async Task<IEnumerable<DocumentDto>> GetInternalRepositoryDocumentsAsync()
        {
            return await _context.Documents
                .Where(d => d.ModuleId == null)
                .OrderByDescending(d => d.UploadedAt)
                .ProjectTo<DocumentDto>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public async Task<bool> DeleteDocumentAsync(int documentId, string requesterUserNumber, bool isAdminOrCoordinator)
        {
            var document = await _context.Documents.FindAsync(documentId);
            if (document == null) return false;

            if (document.UploadedByUserNumber != requesterUserNumber && !isAdminOrCoordinator)
                return false;

            _context.Documents.Remove(document);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
