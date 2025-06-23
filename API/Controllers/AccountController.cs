using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController(
    UserManager<AppUser> userManager,
    ITokenService tokenService
) : BaseApiController
{
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
        var user = await userManager.Users
            .Include(u => u.UserModules)
                .ThenInclude(um => um.Module)
            .FirstOrDefaultAsync(x => x.UserNumber == loginDto.UserNumber);

        if (user == null)
            return Unauthorized("Invalid user number or password.");

        var passwordValid = await userManager.CheckPasswordAsync(user, loginDto.Password);
        if (!passwordValid)
            return Unauthorized("Invalid user number or password.");

        var roles = await userManager.GetRolesAsync(user);

        return new UserDto
        {
            UserNumber = user.UserNumber,
            Name = user.FirstName,
            Surname = user.LastName,
            Email = user.Email ?? string.Empty,
            Roles = roles.ToArray(),
            Token = await tokenService.CreateToken(user),
            Modules = user.UserModules.Select(um => new ModuleDto
            {
                Id = um.Module.Id,
                ModuleCode = um.Module.ModuleCode,
                ModuleName = um.Module.ModuleName,
                Semester = um.Module.Semester
            }).ToList()
        };
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out (client must clear token)." });
    }
}
