using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Elibrary.Api.Data;
using Elibrary.Api.DTOs;
using Elibrary.Api.Models;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDb _db;
    private readonly IConfiguration _cfg;
    public AuthController(AppDb db, IConfiguration cfg) { _db = db; _cfg = cfg; }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _db.Users.SingleOrDefaultAsync(u => u.Username == dto.Username);
        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized();

        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(6),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            role = user.Role,
            username = user.Username
        });
    }

    // Public registration always creates a normal user
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Username and password are required.");

        var uname = dto.Username.Trim();

        if (await _db.Users.AnyAsync(u => u.Username == uname))
            return Conflict("Username already exists");

        var user = new User
        {
            Username = uname,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "User",
            DisplayName = string.IsNullOrWhiteSpace(dto.DisplayName) ? uname : dto.DisplayName!.Trim(),
            AvatarUrl = string.IsNullOrWhiteSpace(dto.AvatarUrl) ? null : dto.AvatarUrl!.Trim(),
            Bio = string.IsNullOrWhiteSpace(dto.Bio) ? null : dto.Bio!.Trim()
        };


        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Created($"/api/users/{user.Id}", new { user.Id, user.Username, user.Role });
    }
}
