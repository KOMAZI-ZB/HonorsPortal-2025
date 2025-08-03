using API.Data;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class LabBookingService(DataContext context, IMapper mapper) : ILabBookingService
{
    private readonly DataContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<IEnumerable<LabBookingDto>> GetAllBookingsAsync()
    {
        return await _context.LabBookings
            .OrderBy(b => b.BookingDate)
            .ThenBy(b => b.StartTime)
            .ProjectTo<LabBookingDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<IEnumerable<LabBookingDto>> GetBookingsByUserAsync(string userNumber)
    {
        return await _context.LabBookings
            .Where(b => b.UserNumber == userNumber)
            .OrderByDescending(b => b.BookingDate)
            .ProjectTo<LabBookingDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<bool> CreateBookingAsync(string userNumber, CreateLabBookingDto dto)
    {
        var conflict = await _context.LabBookings.AnyAsync(b =>
            b.BookingDate == dto.BookingDate &&
            b.WeekDays == dto.WeekDays &&
            ((dto.StartTime >= b.StartTime && dto.StartTime < b.EndTime) ||
             (dto.EndTime > b.StartTime && dto.EndTime <= b.EndTime)));

        if (conflict) return false;

        var booking = new LabBooking
        {
            UserNumber = userNumber,
            WeekDays = dto.WeekDays,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            BookingDate = dto.BookingDate,
            Description = dto.Description // ✅ NEW: Add this line
        };

        _context.LabBookings.Add(booking);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteBookingAsync(int id, string userNumber, bool isPrivileged)
    {
        var booking = await _context.LabBookings.FindAsync(id);
        if (booking == null) return false;

        if (!isPrivileged && booking.UserNumber != userNumber) return false;

        _context.LabBookings.Remove(booking);
        return await _context.SaveChangesAsync() > 0;
    }
}
