namespace API.Helpers;

public class QueryParams
{
    // For Courses, Modules, and Schedule filters
    public int? Semester { get; set; }

    // For Admin Panel user filters
    public string? Role { get; set; } // Student, Lecturer, Coordinator

    public bool? HasModulesOnly { get; set; }

    // For Announcement or document sorting (if extended in future)
    public string? SortBy { get; set; }  // e.g., "date", "type"

    // For test grouping or specific type filtering
    public string? TestType { get; set; } // "Test1", "Test2", "Supplementary"

    // For role-based module view
    public string? RoleContext { get; set; } // "Lecturer", "Student", etc.

    // Future-proofing: pagination (optional)
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
