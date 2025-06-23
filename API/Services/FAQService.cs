using API.Data;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Services;

public class FAQService(DataContext context, IMapper mapper) : IFAQService
{
    private readonly DataContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<PagedList<FaqEntryDto>> GetAllPaginatedFAQsAsync(QueryParams queryParams)
    {
        var query = _context.FaqEntries
            .OrderByDescending(f => f.LastUpdated)
            .ProjectTo<FaqEntryDto>(_mapper.ConfigurationProvider)
            .AsQueryable();

        return await PagedList<FaqEntryDto>.CreateAsync(query, queryParams.PageNumber, queryParams.PageSize);
    }

    public async Task<IEnumerable<FaqEntryDto>> GetAllFAQsAsync()
    {
        return await _context.FaqEntries
            .OrderByDescending(f => f.LastUpdated)
            .ProjectTo<FaqEntryDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<bool> CreateFaqAsync(string question, string answer)
    {
        var newEntry = new FaqEntry
        {
            Question = question,
            Answer = answer,
            LastUpdated = DateTime.UtcNow
        };

        _context.FaqEntries.Add(newEntry);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateFaqAsync(int id, string question, string answer)
    {
        var entry = await _context.FaqEntries.FindAsync(id);
        if (entry == null) return false;

        entry.Question = question;
        entry.Answer = answer;
        entry.LastUpdated = DateTime.UtcNow;

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteFaqAsync(int id)
    {
        var entry = await _context.FaqEntries.FindAsync(id);
        if (entry == null) return false;

        _context.FaqEntries.Remove(entry);
        return await _context.SaveChangesAsync() > 0;
    }
}
