namespace API.DTOs
{
    public class LoginDto
    {
        public string UserNumber { get; set; } = string.Empty; // Used as username
        public string Password { get; set; } = string.Empty;
    }
}
