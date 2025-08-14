using API.DTOs;
using API.Helpers;

namespace API.Interfaces
{
    public interface INotificationService
    {
        Task<PagedList<NotificationDto>> GetAllPaginatedAsync(QueryParams queryParams);
        Task<NotificationDto?> CreateAsync(CreateNotificationDto dto, string createdByUserNumber);
        Task<bool> DeleteAsync(int id, string requesterUserNumber, bool isAdmin);

        // 🆕 Read receipts
        Task<bool> MarkAsReadAsync(int notificationId, int userId);
    }
}
