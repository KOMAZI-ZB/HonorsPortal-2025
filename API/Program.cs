using API.Data;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Middleware;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization; // ✅ Needed for ReferenceHandler

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);

// ✅ Global support for TimeOnly, DateOnly, and object cycle prevention
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new TimeOnlyJsonConverter());
        opts.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
        opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; // ✅ Prevent cycles
    });

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();

app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod()
    .WithOrigins("http://localhost:4200", "https://localhost:4200"));

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;

try
{
    var context = services.GetRequiredService<DataContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    var roleManager = services.GetRequiredService<RoleManager<AppRole>>();

    await context.Database.MigrateAsync();

    // ✅ Seeding all supported tables
    await Seed.SeedModules(context);
    await Seed.SeedUsers(userManager, roleManager, context);
    await Seed.SeedFaqs(context);
    await Seed.SeedNotifications(context);
    await Seed.SeedLabBookings(context);
    await Seed.SeedRepositories(context); // ✅ NEW: Seeding recommended repositories
    await Seed.SeedAssessments(context); // ✅ NEW: Seeding assessments

}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred during migration");
}

app.Run();
