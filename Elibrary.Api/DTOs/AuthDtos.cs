namespace Elibrary.Api.DTOs;

public class LoginDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}

public class RegisterDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";

    // Optional profile fields
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
}
