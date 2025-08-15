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
        // Join LabBookings to Users so we can include FirstName/LastName in the DTO
        return await (
            from b in _context.LabBookings
            join u in _context.Users on b.UserName equals u.UserName into gj
            from u in gj.DefaultIfEmpty()
            orderby b.BookingDate, b.StartTime
            select new LabBookingDto
            {
                Id = b.Id,
                UserName = b.UserName,
                WeekDays = b.WeekDays,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                BookingDate = b.BookingDate,
                Description = b.Description,
                FirstName = u != null ? u.FirstName : null,
                LastName = u != null ? u.LastName : null
            }
        ).ToListAsync();
    }

    public async Task<IEnumerable<LabBookingDto>> GetBookingsByUserAsync(string userName)
    {
        return await (
            from b in _context.LabBookings
            join u in _context.Users on b.UserName equals u.UserName into gj
            from u in gj.DefaultIfEmpty()
            where b.UserName == userName
            orderby b.BookingDate descending
            select new LabBookingDto
            {
                Id = b.Id,
                UserName = b.UserName,
                WeekDays = b.WeekDays,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                BookingDate = b.BookingDate,
                Description = b.Description,
                FirstName = u != null ? u.FirstName : null,
                LastName = u != null ? u.LastName : null
            }
        ).ToListAsync();
    }

    public async Task<bool> CreateBookingAsync(string userName, CreateLabBookingDto dto)
    {
        var conflict = await _context.LabBookings.AnyAsync(b =>
            b.BookingDate == dto.BookingDate &&
            b.WeekDays == dto.WeekDays &&
            ((dto.StartTime >= b.StartTime && dto.StartTime < b.EndTime) ||
             (dto.EndTime > b.StartTime && dto.EndTime <= b.EndTime)));

        if (conflict) return false;

        var booking = new LabBooking
        {
            UserName = userName,
            WeekDays = dto.WeekDays,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            BookingDate = dto.BookingDate,
            Description = dto.Description
        };

        _context.LabBookings.Add(booking);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteBookingAsync(int id, string userName, bool isPrivileged)
    {
        var booking = await _context.LabBookings.FindAsync(id);
        if (booking == null) return false;

        if (!isPrivileged && booking.UserName != userName) return false;

        _context.LabBookings.Remove(booking);
        return await _context.SaveChangesAsync() > 0;
    }
}
