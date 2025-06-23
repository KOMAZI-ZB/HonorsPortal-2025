using System.Text.Json;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class Seed
{
    public static async Task SeedModules(DataContext context)
    {
        if (await context.Modules.AnyAsync()) return;

        var moduleDataPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData", "ModuleSeedData.json");
        if (!File.Exists(moduleDataPath)) return;

        var moduleData = await File.ReadAllTextAsync(moduleDataPath);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var modules = JsonSerializer.Deserialize<List<Module>>(moduleData, options);

        if (modules is null) return;

        context.Modules.AddRange(modules);
        await context.SaveChangesAsync();
    }

    public static async Task SeedUsers(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager, DataContext context)
    {
        var roles = new List<string> { "Admin", "Student", "Lecturer", "Coordinator" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new AppRole { Name = role });
        }

        var adminExists = await userManager.Users.AnyAsync(u => u.UserNumber == "admin");
        if (!adminExists)
        {
            var admin = new AppUser
            {
                FirstName = "Admin",
                LastName = "User",
                UserNumber = "admin",
                Email = "admin@portal.com",
                UserName = "admin",
                NormalizedEmail = "ADMIN@PORTAL.COM",
                NormalizedUserName = "ADMIN"
            };

            var result = await userManager.CreateAsync(admin, "Pa$$w0rd");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }

        if (!await userManager.Users.AnyAsync(u => u.UserNumber != "admin"))
        {
            var userDataPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData", "UserSeedData.json");
            if (!File.Exists(userDataPath)) return;

            var userData = await File.ReadAllTextAsync(userDataPath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var users = JsonSerializer.Deserialize<List<RegisterUserDto>>(userData, options);

            if (users is null) return;

            foreach (var dto in users)
            {
                var user = new AppUser
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    UserNumber = dto.UserNumber,
                    Email = dto.Email.ToLower(),
                    UserName = dto.UserNumber,
                    NormalizedEmail = dto.Email.ToUpper(),
                    NormalizedUserName = dto.UserNumber.ToUpper()
                };

                var result = await userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded) continue;

                await userManager.AddToRoleAsync(user, dto.Role);

                if (!string.Equals(dto.Role, "Admin", StringComparison.OrdinalIgnoreCase))
                {
                    var moduleIds = dto.Semester1ModuleIds.Concat(dto.Semester2ModuleIds).Distinct();
                    foreach (var moduleId in moduleIds)
                    {
                        context.UserModules.Add(new UserModule
                        {
                            AppUserId = user.Id,
                            ModuleId = moduleId,
                            RoleContext = dto.Role
                        });
                    }
                }
            }

            await context.SaveChangesAsync();
        }
    }

    public static async Task SeedFaqs(DataContext context)
    {
        if (await context.FaqEntries.AnyAsync()) return;

        var faqDataPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData", "FaqSeedData.json");
        if (!File.Exists(faqDataPath)) return;

        var faqJson = await File.ReadAllTextAsync(faqDataPath);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var faqs = JsonSerializer.Deserialize<List<FaqEntry>>(faqJson, options);

        if (faqs is null) return;

        // ✅ FIX: Make sure Answer is not null
        foreach (var faq in faqs)
        {
            faq.Answer ??= string.Empty;
        }

        context.FaqEntries.AddRange(faqs);
        await context.SaveChangesAsync();
    }

    public static async Task SeedAnnouncements(DataContext context)
    {
        if (await context.Announcements.AnyAsync()) return;

        var dataPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData", "AnnouncementSeedData.json");
        if (!File.Exists(dataPath)) return;

        var json = await File.ReadAllTextAsync(dataPath);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var announcements = JsonSerializer.Deserialize<List<Announcement>>(json, options);

        if (announcements is null) return;

        context.Announcements.AddRange(announcements);
        await context.SaveChangesAsync();
    }

    public static async Task SeedLabBookings(DataContext context)
    {
        if (await context.LabBookings.AnyAsync()) return;

        var path = Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData", "LabBookingSeedData.json");
        if (!File.Exists(path)) return;

        var json = await File.ReadAllTextAsync(path);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var bookings = JsonSerializer.Deserialize<List<LabBooking>>(json, options);

        if (bookings is null) return;

        context.LabBookings.AddRange(bookings);
        await context.SaveChangesAsync();
    }

    public static async Task SeedRepositories(DataContext context)
    {
        if (await context.Repositories.AnyAsync()) return;

        var path = Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData", "RepositorySeedData.json");
        if (!File.Exists(path)) return;

        var json = await File.ReadAllTextAsync(path);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var repositories = JsonSerializer.Deserialize<List<Repository>>(json, options);

        if (repositories is null) return;

        context.Repositories.AddRange(repositories);
        await context.SaveChangesAsync();
    }
}
