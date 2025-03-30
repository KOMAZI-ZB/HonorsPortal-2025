using System;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;


//Asynchronous code
[ApiController]
[Route("api/[controller]")] // /api/users
public class UsersController(DataContext context) : ControllerBase
{
    //We need to create the endpoints
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()
    {
        var users = await context.Users.ToListAsync();
        return users;
    }

    [HttpGet("{id:int}")] //we need to add a route parameter to get the individual user => /api/users/1 
    public async Task<ActionResult<AppUser>> GetUser(int id)
    {
        var user = await context.Users.FindAsync(id);

        if (user == null) return NotFound();

        return user;
    }

}