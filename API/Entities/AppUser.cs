using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Entities;

[Index(nameof(UserNumber), IsUnique = true)]
public class AppUser : IdentityUser<int>
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string UserNumber { get; set; }

    public ICollection<AppUserRole> UserRoles { get; set; } = new List<AppUserRole>();

    // ✅ NEW: Used to link users to modules (Phase 2)
    public ICollection<UserModule> UserModules { get; set; } = new List<UserModule>();
}
