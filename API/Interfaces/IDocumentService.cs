using API.DTOs;
using API.Helpers;

namespace API.Interfaces
{
    public interface IDocumentService
    {
        Task<DocumentDto> UploadDocumentAsync(UploadDocumentDto dto, string uploaderUserNumber);

        Task<IEnumerable<DocumentDto>> GetDocumentsByModuleAsync(int moduleId);

        Task<PagedList<DocumentDto>> GetDocumentsByModulePaginatedAsync(int moduleId, PaginationParams paginationParams);

        Task<IEnumerable<DocumentDto>> GetInternalRepositoryDocumentsAsync();

        Task<bool> DeleteDocumentAsync(int documentId, string requesterUserNumber, bool isAdminOrCoordinator);
    }
}
