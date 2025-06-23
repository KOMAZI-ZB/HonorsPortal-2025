using API.Data;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Services
{
    public class RepositoryService : IRepositoryService
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;

        public RepositoryService(DataContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // ✅ External Repositories (Legacy)
        public async Task<IEnumerable<Repository>> GetAllAsync()
        {
            return await _context.Repositories.ToListAsync();
        }

        // ✅ External Repositories (Paginated)
        public async Task<PagedList<RepositoryDto>> GetPaginatedExternalAsync(QueryParams queryParams)
        {
            var query = _context.Repositories
                .OrderBy(r => r.Label)
                .ProjectTo<RepositoryDto>(_mapper.ConfigurationProvider)
                .AsQueryable();

            return await PagedList<RepositoryDto>.CreateAsync(query, queryParams.PageNumber, queryParams.PageSize);
        }

        public async Task<Repository> AddAsync(Repository repo)
        {
            _context.Repositories.Add(repo);
            await _context.SaveChangesAsync();
            return repo;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var repo = await _context.Repositories.FindAsync(id);
            if (repo == null) return false;

            _context.Repositories.Remove(repo);
            return await _context.SaveChangesAsync() > 0;
        }

        // ✅ Internal Repository Documents (Paginated)
        public async Task<PagedList<DocumentDto>> GetPaginatedInternalDocsAsync(QueryParams queryParams)
        {
            var query = _context.Documents
                .Where(d => d.Source == "Repository")
                .OrderByDescending(d => d.UploadedAt)
                .ProjectTo<DocumentDto>(_mapper.ConfigurationProvider)
                .AsQueryable();

            return await PagedList<DocumentDto>.CreateAsync(query, queryParams.PageNumber, queryParams.PageSize);
        }
    }
}
