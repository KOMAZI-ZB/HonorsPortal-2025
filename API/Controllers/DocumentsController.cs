using API.DTOs;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class DocumentsController(
    IDocumentService documentService,
    INotificationService notificationService) : BaseApiController
{
    private readonly IDocumentService _documentService = documentService;
    private readonly INotificationService _notificationService = notificationService;

    // ✅ Upload a document to a module (Lecturer, Coordinator, Admin)
    [Authorize(Roles = "Lecturer,Coordinator,Admin")]
    [HttpPost("upload")]
    public async Task<ActionResult<DocumentDto>> Upload([FromForm] UploadDocumentDto dto)
    {
        var userName = User.GetUsername();
        var result = await _documentService.UploadDocumentAsync(dto, userName);

        if (result == null)
            return BadRequest("Upload failed.");

        var notification = new CreateNotificationDto
        {
            Type = "DocumentUpload",
            Title = "New Module Document Uploaded",
            Message = $"A new document has been uploaded with title: {dto.Title}.",
            Image = null,
            ModuleId = dto.ModuleId
        };

        await _notificationService.CreateAsync(notification, userName);

        return Ok(result);
    }

    // ✅ Get all documents for a specific module (non-paginated)
    [HttpGet("module/{moduleId}")]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> GetByModule(int moduleId)
    {
        var result = await _documentService.GetDocumentsByModuleAsync(moduleId);
        return Ok(result);
    }

    // ✅ Get all documents for a specific module (paginated)
    [HttpGet("module/{moduleId}/paged")]
    public async Task<ActionResult<PagedList<DocumentDto>>> GetByModulePaged(
        int moduleId, [FromQuery] PaginationParams paginationParams)
    {
        var pagedResult = await _documentService.GetDocumentsByModulePaginatedAsync(moduleId, paginationParams);

        Response.AddPaginationHeader(pagedResult);
        return Ok(pagedResult);
    }

    // ✅ Delete document from a module (Uploader, Coordinator, Admin)
    [Authorize]
    [HttpDelete("{documentId}")]
    public async Task<ActionResult> Delete(int documentId)
    {
        var userName = User.GetUsername();
        var isPrivileged = User.IsInRole("Coordinator") || User.IsInRole("Admin");

        var success = await _documentService.DeleteDocumentAsync(documentId, userName, isPrivileged);

        if (!success)
        {
            // ❗ FIXED: Don't use `Forbid("...")`, which causes 500
            return StatusCode(403, new { message = "You do not have permission to delete this document." });
        }

        return Ok(new { message = "Document deleted successfully." });
    }

    // ✅ View all module documents (used in internal repository)
    [Authorize(Roles = "Lecturer,Coordinator,Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<IEnumerable<DocumentDto>>> GetAllModuleDocuments()
    {
        var allModuleDocs = await _documentService.GetDocumentsByModuleAsync(0);
        return Ok(allModuleDocs);
    }
}
