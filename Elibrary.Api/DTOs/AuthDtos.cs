namespace Elibrary.Api.DTOs;

public record LoginDto(string Username, string Password);

// No role here: everyone who registers becomes a normal user
public record RegisterDto(string Username, string Password, string? FullName);
