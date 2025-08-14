using API.DTOs;
using API.Helpers;

namespace API.Interfaces
{
    public interface IAnnouncementService
    {
        Task<PagedList<AnnouncementDto>> GetAllPaginatedAsync(QueryParams queryParams);
        Task<AnnouncementDto?> CreateAsync(CreateAnnouncementDto dto, string createdByUserNumber);
        Task<bool> DeleteAsync(int id, string requesterUserNumber, bool isAdmin);

        // 🆕 Read receipts
        Task<bool> MarkAsReadAsync(int announcementId, int userId);
    }
}
