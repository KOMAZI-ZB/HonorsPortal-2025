using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using API.Entities;

namespace API.Data
{
    public class DataContext : IdentityDbContext<AppUser, AppRole, int,
        IdentityUserClaim<int>, AppUserRole, IdentityUserLogin<int>,
        IdentityRoleClaim<int>, IdentityUserToken<int>>
    {
        public DataContext(DbContextOptions options) : base(options) { }

        // ✅ Phase 2 Tables
        public DbSet<Module> Modules { get; set; }
        public DbSet<UserModule> UserModules { get; set; }

        // ✅ Phase 3 Tables
        public DbSet<Document> Documents { get; set; }

        // ✅ Phase 4 Tables
        public DbSet<FaqEntry> FaqEntries { get; set; }

        // ✅ Phase 5 Tables
        public DbSet<Announcement> Announcements { get; set; }

        // ✅ Phase 6 Tables
        public DbSet<LabBooking> LabBookings { get; set; }

        // ✅ NEW: External Repository Links
        public DbSet<Repository> Repositories { get; set; }

        // ✅ NEW: Dynamic Assessment Schedule
        public DbSet<Assessment> Assessments { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ✅ AppUser ↔ AppUserRole
            builder.Entity<AppUser>(b =>
            {
                b.HasMany(u => u.UserRoles)
                 .WithOne(ur => ur.User)
                 .HasForeignKey(ur => ur.UserId)
                 .IsRequired();

                b.HasMany(u => u.UserModules)
                 .WithOne(um => um.AppUser)
                 .HasForeignKey(um => um.AppUserId)
                 .IsRequired();
            });

            // ✅ AppRole ↔ AppUserRole
            builder.Entity<AppRole>(b =>
            {
                b.HasMany(r => r.UserRoles)
                 .WithOne(ur => ur.Role)
                 .HasForeignKey(ur => ur.RoleId)
                 .IsRequired();
            });

            // ✅ Module ↔ UserModule
            builder.Entity<Module>(b =>
            {
                b.HasMany(m => m.UserModules)
                 .WithOne(um => um.Module)
                 .HasForeignKey(um => um.ModuleId)
                 .IsRequired();
            });

            // ✅ Composite Key for UserModule
            builder.Entity<UserModule>()
                .HasKey(um => new { um.AppUserId, um.ModuleId });

            // ✅ Constraints for FAQ
            builder.Entity<FaqEntry>(b =>
            {
                b.Property(f => f.Question).IsRequired();
                b.Property(f => f.Answer).IsRequired();
                b.Property(f => f.LastUpdated).IsRequired();
            });

            // ✅ Constraints for Announcements
            builder.Entity<Announcement>(b =>
            {
                b.Property(a => a.Type).IsRequired();
                b.Property(a => a.Title).IsRequired();
                b.Property(a => a.Message).IsRequired();
                b.Property(a => a.CreatedBy).IsRequired();
            });

            // ✅ Constraints for Lab Bookings
            builder.Entity<LabBooking>(b =>
            {
                b.Property(lb => lb.UserNumber).IsRequired().HasMaxLength(20);
                b.Property(lb => lb.WeekDays).IsRequired().HasMaxLength(20);
                b.Property(lb => lb.BookingDate).IsRequired();
                b.Property(lb => lb.StartTime).IsRequired();
                b.Property(lb => lb.EndTime).IsRequired();
            });

            // ✅ Constraints for Repository Links
            builder.Entity<Repository>(b =>
            {
                b.Property(r => r.Label).IsRequired();
                b.Property(r => r.ImageUrl).IsRequired();
                b.Property(r => r.LinkUrl).IsRequired();
            });

            // ✅ Constraints for Assessments
            // ✅ Constraints for Assessments
            builder.Entity<Assessment>(b =>
            {
                b.Property(a => a.Title).IsRequired();
                b.Property(a => a.Date).IsRequired();
                b.Property(a => a.IsTimed).IsRequired();

                b.HasOne(a => a.Module)
                 .WithMany(m => m.Assessments)  // ✅ explicitly name the nav prop on Module
                 .HasForeignKey(a => a.ModuleId)
                 .IsRequired()
                 .OnDelete(DeleteBehavior.Cascade);
            });

        }
    }
}
