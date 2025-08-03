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
        if (await userManager.Users.AnyAsync(x =>
            x.UserNumber == dto.UserNumber || x.Email == dto.Email.Trim().ToLower()))
        {
            return BadRequest(new { message = "User with this UserNumber or Email already exists." });
        }

        var user = new AppUser
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            UserNumber = dto.UserNumber,
            Email = dto.Email.Trim().ToLower(),
            UserName = dto.UserNumber,
            NormalizedEmail = dto.Email.Trim().ToUpper(),
            NormalizedUserName = dto.UserNumber.ToUpper(),
            JoinDate = DateOnly.FromDateTime(DateTime.UtcNow) // ✅ Set JoinDate on registration
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
                UserNumber = user.UserNumber,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                Token = "",
                JoinDate = user.JoinDate, // ✅ Include JoinDate
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
                UserNumber = user.UserNumber,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                Token = "",
                JoinDate = user.JoinDate, // ✅ Include JoinDate
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
                UserNumber = user.UserNumber,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = new[] { role },
                Token = "",
                JoinDate = user.JoinDate, // ✅ Include JoinDate
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
                UserNumber = user.UserNumber,
                Name = user.FirstName,
                Surname = user.LastName,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                Token = "",
                JoinDate = user.JoinDate, // ✅ Include JoinDate
                Modules = new List<ModuleDto>()
            });
        }

        return result;
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPut("update-modules/{userNumber}")]
    public async Task<ActionResult> UpdateModules(string userNumber, UpdateUserModulesDto dto)
    {
        var user = await context.Users.Include(u => u.UserModules).FirstOrDefaultAsync(u => u.UserNumber == userNumber);
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
    [HttpPut("update-roles/{userNumber}")]
    public async Task<ActionResult> UpdateRoles(string userNumber, List<string> roles)
    {
        var user = await userManager.FindByNameAsync(userNumber);
        if (user == null) return NotFound("User not found");

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRolesAsync(user, roles);

        await context.SaveChangesAsync();
        return Ok(new { message = "Roles updated successfully" });
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPut("update-user/{userNumber}")]
    public async Task<ActionResult> UpdateUser(string userNumber, UpdateUserDto dto)
    {
        var user = await userManager.Users.FirstOrDefaultAsync(u => u.UserNumber == userNumber);
        if (user == null) return NotFound("User not found");

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.Email = dto.Email.ToLower();
        user.NormalizedEmail = dto.Email.ToUpper();
        user.UserName = userNumber;
        user.NormalizedUserName = userNumber.ToUpper();

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
    [HttpDelete("delete-user/{userNumber}")]
    public async Task<ActionResult> DeleteUser(string userNumber)
    {
        var user = await userManager.FindByNameAsync(userNumber);
        if (user == null) return NotFound(new { message = "User not found" });

        context.Users.Remove(user);
        await context.SaveChangesAsync();

        return Ok(new { message = $"User {userNumber} deleted." });
    }
}
