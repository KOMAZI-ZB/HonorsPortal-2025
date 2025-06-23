using API.DTOs;
using API.Entities;
using AutoMapper;

namespace API.Helpers
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            // ✅ Module → ModuleDto
            CreateMap<Module, ModuleDto>()
                .ForMember(dest => dest.WeekDays, opt => opt.MapFrom(src =>
                    src.WeekDays != null ? src.WeekDays.Split(',', StringSplitOptions.None) : Array.Empty<string>()))
                .ForMember(dest => dest.StartTimes, opt => opt.MapFrom(src =>
                    src.StartTimes != null ? src.StartTimes.Split(',', StringSplitOptions.None) : Array.Empty<string>()))
                .ForMember(dest => dest.EndTimes, opt => opt.MapFrom(src =>
                    src.EndTimes != null ? src.EndTimes.Split(',', StringSplitOptions.None) : Array.Empty<string>()));

            // ✅ User → UserDto
            CreateMap<AppUser, UserDto>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.FirstName))
                .ForMember(dest => dest.Surname, opt => opt.MapFrom(src => src.LastName))
                .ForMember(dest => dest.Modules, opt => opt.MapFrom(src =>
                    src.UserModules.Select(um => um.Module)));

            // ✅ RegisterUserDto → AppUser
            CreateMap<RegisterUserDto, AppUser>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email.ToLower()))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.ToLower()))
                .ForMember(dest => dest.NormalizedEmail, opt => opt.MapFrom(src => src.Email.ToUpper()))
                .ForMember(dest => dest.NormalizedUserName, opt => opt.MapFrom(src => src.Email.ToUpper()));

            // ✅ Document Mapping
            CreateMap<Document, DocumentDto>();
            CreateMap<UploadDocumentDto, Document>();

            // ✅ FAQ and Announcement
            CreateMap<FaqEntry, FaqEntryDto>();
            CreateMap<Announcement, AnnouncementDto>();

            // ✅ Lab Booking
            CreateMap<LabBooking, LabBookingDto>().ReverseMap();
            CreateMap<CreateLabBookingDto, LabBooking>();

            // ✅ Class Schedule Mapping
            CreateMap<Module, ClassScheduleDto>()
                .ForMember(dest => dest.WeekDays, opt => opt.MapFrom(src =>
                    src.WeekDays != null ? src.WeekDays.Split(',', StringSplitOptions.None) : Array.Empty<string>()))
                .ForMember(dest => dest.StartTimes, opt => opt.MapFrom(src =>
                    src.StartTimes != null ? src.StartTimes.Split(',', StringSplitOptions.None) : Array.Empty<string>()))
                .ForMember(dest => dest.EndTimes, opt => opt.MapFrom(src =>
                    src.EndTimes != null ? src.EndTimes.Split(',', StringSplitOptions.None) : Array.Empty<string>()));

            // ✅ Test Schedule Mapping (Test 1 only – others handled manually)
            CreateMap<Module, TestScheduleDto>()
                .ForMember(dest => dest.TestType, opt => opt.MapFrom(src => "Test 1"))
                .ForMember(dest => dest.TestDate, opt => opt.MapFrom(src =>
                    src.Test1Date.HasValue ? src.Test1Date.Value.ToString("yyyy-MM-dd") : null))
                .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src =>
                    src.Test1StartTime.HasValue ? src.Test1StartTime.Value.ToString("HH:mm:ss") : null))
                .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src =>
                    src.Test1EndTime.HasValue ? src.Test1EndTime.Value.ToString("HH:mm:ss") : null))
                .ForMember(dest => dest.Venue, opt => opt.MapFrom(src => src.Test1Venue));

            // ✅ External Repository Mapping
            CreateMap<Repository, RepositoryDto>();
            CreateMap<RepositoryDto, Repository>(); // ✅ Fix: Add reverse mapping
        }
    }
}
