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
            CreateMap<Document, DocumentDto>()
                .ForMember(dest => dest.UploadedByUserNumber, opt => opt.MapFrom(src => src.UploadedByUserNumber));
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

            // ✅ External Repository Mapping
            CreateMap<Repository, RepositoryDto>();
            CreateMap<RepositoryDto, Repository>();

            // ✅ Assessment Mapping
            CreateMap<Assessment, AssessmentDto>()
                .ForMember(dest => dest.ModuleCode, opt => opt.MapFrom(src => src.Module.ModuleCode));

            CreateMap<CreateAssessmentDto, Assessment>();
            CreateMap<UpdateAssessmentDto, Assessment>();
        }
    }
}
