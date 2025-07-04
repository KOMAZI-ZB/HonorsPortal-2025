namespace API.DTOs;

public class RegisterUserDto
{
    public string UserNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<int> Semester1ModuleIds { get; set; } = new();
    public List<int> Semester2ModuleIds { get; set; } = new();
}
