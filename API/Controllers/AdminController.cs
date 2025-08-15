using API.Data;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController(
    UserManager<AppUser> userManager,
    RoleManager<AppRole> roleManager,
    DataContext context
) : BaseApiController
{
    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost("register-user")]
    public async Task<ActionResult> RegisterUser(RegisterUserDto dto)
    {
        var userNameTrimmed = dto.UserName?.Trim();
        var emailLower = dto.Email?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(userNameTrimmed) || string.IsNullOrWhiteSpace(emailLower))
            return BadRequest(new { message = "UserName and Email are required." });

        // Check using normalized values to avoid case/culture issues
        var exists = await userManager.Users.AnyAsync(x =>
            x.NormalizedUserName == userNameTrimmed.ToUpperInvariant() ||
            x.NormalizedEmail == emailLower.ToUpperInvariant());

        if (exists)
            return BadRequest(new { message = "User with this UserName or Email already exists." });

        var user = new AppUser
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            UserName = userNameTrimmed,                               // ✅ never null
            Email = emailLower,                                        // normalized lower
            NormalizedEmail = emailLower.ToUpperInvariant(),
            NormalizedUserName = userNameTrimmed.ToUpperInvariant(),
            JoinDate = DateOnly.FromDateTime(DateTime.UtcNow)          // ✅ set on registration
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to create user", errors = result.Errors });

        if (!await roleManager.RoleExistsAsync(dto.Role))
            return BadRequest(new { message = "Invalid role" });

        await userManager.AddToRoleAsync(user, dto.Role);

        foreach (var moduleId in dto.Semester1ModuleIds)
        {
            context.UserModules.Add(new UserModule
            {
                AppUserId = user.Id,
                ModuleId = moduleId,
                RoleContext = dto.Role
            });
        }

        foreach (var moduleId in dto.Semester2ModuleIds)
        {
            context.UserModules.Add(new UserModule
            {
                AppUserId = user.Id,
                ModuleId = moduleId,
                RoleContext = dto.Role
            });
        }

        await context.SaveChangesAsync();
        return Ok(new { message = "User registered and linked to modules." });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet("users-with-roles")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersWithRoles()
    {
        var users = await userManager.Users.OrderBy(u => u.UserName).ToListAsync();
        var result = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);

            result.Add(new UserDto
            {
                UserName = user.UserName ?? string.Empty,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                Token = "",
                JoinDate = user.JoinDate,
                Modules = new List<ModuleDto>()
            });
        }

        return Ok(result);
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet("all-users")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
    {
        var users = await context.Users
            .Include(u => u.UserModules)
                .ThenInclude(um => um.Module)
            .ToListAsync();

        var result = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);

            result.Add(new UserDto
            {
                UserName = user.UserName ?? string.Empty,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                Token = "",
                JoinDate = user.JoinDate,
                Modules = user.UserModules.Select(um => new ModuleDto
                {
                    Id = um.Module.Id,
                    ModuleCode = um.Module.ModuleCode,
                    ModuleName = um.Module.ModuleName,
                    Semester = um.Module.Semester
                }).ToList()
            });
        }

        return result;
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet("users-by-role/{role}")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersByRole(string role)
    {
        var users = await userManager.GetUsersInRoleAsync(role);
        var result = new List<UserDto>();

        foreach (var user in users)
        {
            await context.Entry(user).Collection(u => u.UserModules).LoadAsync();
            foreach (var um in user.UserModules)
            {
                await context.Entry(um).Reference(um => um.Module).LoadAsync();
            }

            result.Add(new UserDto
            {
                UserName = user.UserName ?? string.Empty,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = new[] { role },
                Token = "",
                JoinDate = user.JoinDate,
                Modules = user.UserModules.Select(um => new ModuleDto
                {
                    Id = um.Module.Id,
                    ModuleCode = um.Module.ModuleCode,
                    ModuleName = um.Module.ModuleName,
                    Semester = um.Module.Semester
                }).ToList()
            });
        }

        return result;
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet("users-with-no-modules")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsersWithNoModules()
    {
        var users = await context.Users
            .Include(u => u.UserModules)
            .Where(u => !u.UserModules.Any())
            .ToListAsync();

        var result = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);

            result.Add(new UserDto
            {
                UserName = user.UserName ?? string.Empty,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                Token = "",
                JoinDate = user.JoinDate,
                Modules = new List<ModuleDto>()
            });
        }

        return result;
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPut("update-modules/{userName}")]
    public async Task<ActionResult> UpdateModules(string userName, UpdateUserModulesDto dto)
    {
        var routeUserName = userName?.Trim();
        if (string.IsNullOrWhiteSpace(routeUserName))
            return BadRequest("UserName is required.");

        var user = await context.Users
            .Include(u => u.UserModules)
            .FirstOrDefaultAsync(u => u.UserName == routeUserName);

        if (user == null) return NotFound("User not found");

        context.UserModules.RemoveRange(user.UserModules);

        var newModuleIds = dto.Semester1ModuleIds.Concat(dto.Semester2ModuleIds).Distinct();
        var roles = await userManager.GetRolesAsync(user);
        var roleContext = roles.FirstOrDefault() ?? "";

        foreach (var moduleId in newModuleIds)
        {
            context.UserModules.Add(new UserModule
            {
                AppUserId = user.Id,
                ModuleId = moduleId,
                RoleContext = roleContext
            });
        }

        await context.SaveChangesAsync();
        return Ok(new { message = "Modules updated successfully" });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPut("update-roles/{userName}")]
    public async Task<ActionResult> UpdateRoles(string userName, List<string> roles)
    {
        var routeUserName = userName?.Trim();
        if (string.IsNullOrWhiteSpace(routeUserName))
            return BadRequest("UserName is required.");

        var user = await userManager.FindByNameAsync(routeUserName);
        if (user == null) return NotFound("User not found");

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRolesAsync(user, roles);

        await context.SaveChangesAsync();
        return Ok(new { message = "Roles updated successfully" });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPut("update-user/{userName}")]
    public async Task<ActionResult> UpdateUser(string userName, UpdateUserDto dto)
    {
        var routeUserName = userName?.Trim();
        if (string.IsNullOrWhiteSpace(routeUserName))
            return BadRequest("UserName is required.");

        var user = await userManager.Users.FirstOrDefaultAsync(u => u.UserName == routeUserName);
        if (user == null) return NotFound("User not found");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;

        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest("Email is required.");

        user.Email = dto.Email.ToLower();                  // keep behavior
        user.NormalizedEmail = dto.Email.ToUpper();        // keep behavior
        user.UserName = routeUserName;                     // ✅ cannot become null
        user.NormalizedUserName = routeUserName.ToUpperInvariant();

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return BadRequest(updateResult.Errors);

        if (!string.IsNullOrWhiteSpace(dto.UpdatePassword))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var passwordResult = await userManager.ResetPasswordAsync(user, token, dto.UpdatePassword);
            if (!passwordResult.Succeeded)
                return BadRequest(passwordResult.Errors);
        }

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRolesAsync(user, dto.Roles);

        return Ok(new { message = "User updated successfully." });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpDelete("delete-user/{userName}")]
    public async Task<ActionResult> DeleteUser(string userName)
    {
        var routeUserName = userName?.Trim();
        if (string.IsNullOrWhiteSpace(routeUserName))
            return BadRequest(new { message = "UserName is required." });

        var user = await userManager.FindByNameAsync(routeUserName);
        if (user == null) return NotFound(new { message = "User not found" });

        context.Users.Remove(user);
        await context.SaveChangesAsync();

        return Ok(new { message = $"User {routeUserName} deleted." });
    }
}
