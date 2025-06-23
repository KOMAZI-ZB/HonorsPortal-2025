using System;
using API.DTOs;

namespace API.Interfaces;

public interface ILabBookingService
{
    Task<IEnumerable<LabBookingDto>> GetAllBookingsAsync();
    Task<IEnumerable<LabBookingDto>> GetBookingsByUserAsync(string userNumber);
    Task<bool> CreateBookingAsync(string userNumber, CreateLabBookingDto dto);
    Task<bool> DeleteBookingAsync(int id, string userNumber, bool isAllowed);
}