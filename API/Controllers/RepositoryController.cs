using API.DTOs;
using API.Extensions;
using API.Interfaces;
using API.Helpers;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class RepositoryController(
    IDocumentService documentService,
    IAnnouncementService announcementService,
    IRepositoryService repositoryService,
    IMapper mapper) : BaseApiController
{
    private readonly IDocumentService _documentService = documentService;
    private readonly IAnnouncementService _announcementService = announcementService;
    private readonly IRepositoryService _repositoryService = repositoryService;
    private readonly IMapper _mapper = mapper;

    // ============================
    // ✅ Internal Repository Documents
    // ============================

    [Authorize(Roles = "Lecturer,Coordinator,Admin")]
    [HttpPost("upload")]
    public async Task<ActionResult<DocumentDto>> UploadToRepository([FromForm] UploadDocumentDto dto)
    {
        var userNumber = User.GetUsername();
        dto.Source = "Repository";
        dto.ModuleId = null;

        var result = await _documentService.UploadDocumentAsync(dto, userNumber);
        if (result == null)
            return BadRequest("Upload failed.");

        var announcement = new CreateAnnouncementDto
        {
            Type = "RepositoryUpdate",
            Title = "Internal Repository Updated",
            Message = $"A new document was uploaded by {userNumber} to the internal repository.",
            Image = null,
            ModuleId = null
        };

        await _announcementService.CreateAsync(announcement, userNumber);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<PagedList<DocumentDto>>> GetRepositoryDocs([FromQuery] QueryParams queryParams)
    {
        var result = await _repositoryService.GetPaginatedInternalDocsAsync(queryParams);
        Response.AddPaginationHeader(result);
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("{documentId}")]
    public async Task<ActionResult> Delete(int documentId)
    {
        var userNumber = User.GetUsername();
        var isPrivileged = User.IsInRole("Coordinator") || User.IsInRole("Admin");

        var success = await _documentService.DeleteDocumentAsync(documentId, userNumber, isPrivileged);
        if (!success)
            return StatusCode(403, new { message = "You are not authorized to delete this document." });

        return Ok(new { message = "Document deleted successfully." });
    }

    // ============================
    // ✅ External Repository Links
    // ============================

    [AllowAnonymous]
    [HttpGet("external")]
    public async Task<ActionResult<PagedList<RepositoryDto>>> GetExternalRepositories([FromQuery] QueryParams queryParams)
    {
        var result = await _repositoryService.GetPaginatedExternalAsync(queryParams);
        Response.AddPaginationHeader(result);
        return Ok(result);
    }

    [Authorize(Roles = "Coordinator,Admin")]
    [HttpPost("external")]
    public async Task<ActionResult<RepositoryDto>> AddExternalRepository([FromForm] RepositoryDto dto)
    {
        // Fallback if no image is uploaded
        if (dto.Image == null)
        {
            dto.ImageUrl = "/assets/database.png";
        }
        else
        {
            dto.ImageUrl = await _repositoryService.UploadImageAsync(dto.Image);
        }

        var created = await _repositoryService.AddAsync(dto);
        return CreatedAtAction(nameof(GetExternalRepositories), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Coordinator,Admin")]
    [HttpDelete("external/{id}")]
    public async Task<ActionResult> DeleteExternalRepository(int id)
    {
        var success = await _repositoryService.DeleteAsync(id);
        if (!success)
            return NotFound(new { message = "Repository link not found or already removed." });

        return Ok(new { message = "External repository removed." });
    }
}
