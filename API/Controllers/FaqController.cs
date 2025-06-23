using API.DTOs;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FaqController : ControllerBase
{
    private readonly IFAQService _faqService;

    public FaqController(IFAQService faqService)
    {
        _faqService = faqService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedList<FaqEntryDto>>> GetAll([FromQuery] QueryParams queryParams)
    {
        var result = await _faqService.GetAllPaginatedFAQsAsync(queryParams);

        // ✅ Set pagination header for client-side parsing
        Response.AddPaginationHeader(result);

        // ✅ Return paginated list directly
        return Ok(result);
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost("create")]
    public async Task<ActionResult> Create([FromBody] FaqEntryDto dto)
    {
        var success = await _faqService.CreateFaqAsync(dto.Question, dto.Answer ?? string.Empty);

        if (!success)
            return BadRequest("Failed to create FAQ.");

        return Ok(new { message = "FAQ created successfully." });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPut("update/{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] FaqEntryDto dto)
    {
        var success = await _faqService.UpdateFaqAsync(id, dto.Question, dto.Answer ?? string.Empty);

        if (!success)
            return BadRequest("Failed to update FAQ.");

        return Ok(new { message = "FAQ updated successfully." });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _faqService.DeleteFaqAsync(id);

        if (!success)
            return BadRequest("Failed to delete FAQ entry.");

        return Ok(new { message = "FAQ entry deleted successfully." });
    }
}
