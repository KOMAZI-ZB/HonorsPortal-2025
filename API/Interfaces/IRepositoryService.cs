using API.DTOs;
using API.Entities;
using API.Helpers;

namespace API.Interfaces
{
    public interface IRepositoryService
    {
        // External repositories (cards)
        Task<IEnumerable<Repository>> GetAllAsync();  // legacy - optional fallback
        Task<PagedList<RepositoryDto>> GetPaginatedExternalAsync(QueryParams queryParams); // ✅ paginated version
        Task<Repository> AddAsync(Repository repo);
        Task<bool> DeleteAsync(int id);

        // Internal repository documents
        Task<PagedList<DocumentDto>> GetPaginatedInternalDocsAsync(QueryParams queryParams); // ✅ added
    }
}
