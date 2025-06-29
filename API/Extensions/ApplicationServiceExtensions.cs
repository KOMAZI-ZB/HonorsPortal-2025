using API.Data;
using API.Helpers;
using API.Interfaces;
using API.Services;
using Microsoft.EntityFrameworkCore;

namespace API.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<DataContext>(opt =>
        {
            opt.UseSqlite(config.GetConnectionString("DefaultConnection"));
        });

        services.AddCors();
        services.AddControllers();

        // ✅ Register AutoMapper
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

        // Core Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IDocumentService, DocumentRepository>();
        services.AddScoped<IFAQService, FAQService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<ILabBookingService, LabBookingService>();
        services.AddScoped<ISchedulerService, SchedulerService>();
        services.AddScoped<IRepositoryService, RepositoryService>(); // ✅ NEW

        // Cloudinary
        services.Configure<CloudinarySettings>(config.GetSection("CloudinarySettings"));

        return services;
    }
}
