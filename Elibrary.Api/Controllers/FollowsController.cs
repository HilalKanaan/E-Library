using System.Security.Claims;
using Elibrary.Api.Data;
using Elibrary.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowsController : ControllerBase
{
    private readonly AppDb _db;
    public FollowsController(AppDb db) { _db = db; }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static string Norm(string? s) => (s ?? "").Trim().ToLowerInvariant();

    // Return just author names for backward-compat (your UI expects strings)
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var uid = CurrentUserId;
        var names = await _db.AuthorFollows
            .Where(f => f.UserId == uid)
            .Select(f => f.Author!.Name)
            .OrderBy(n => n)
            .ToListAsync();
        return Ok(names);
    }

    public record FollowDto(Guid? AuthorId, string? AuthorName);

    [HttpPost]
    public async Task<IActionResult> Follow([FromBody] FollowDto dto)
    {
        var uid = CurrentUserId;
        Elibrary.Api.Models.Author? author = null;

        if (dto.AuthorId is { } aid && aid != Guid.Empty)
            author = await _db.Authors.FindAsync(aid);
        else if (!string.IsNullOrWhiteSpace(dto.AuthorName))
        {
            var norm = Norm(dto.AuthorName);
            author = await _db.Authors.FirstOrDefaultAsync(a => a.NameNormalized == norm);
        }
        if (author is null) return BadRequest("Author not found.");

        var exists = await _db.AuthorFollows.AnyAsync(f => f.UserId == uid && f.AuthorId == author.Id);
        if (!exists)
        {
            _db.AuthorFollows.Add(new AuthorFollow { UserId = uid, AuthorId = author.Id });
            await _db.SaveChangesAsync();
        }
        return Ok(new { followed = true });
    }

    // Allow DELETE by id or by name (compat)
    [HttpDelete("{key}")]
    public async Task<IActionResult> Unfollow(string key)
    {
        var uid = CurrentUserId;

        AuthorFollow? follow = null;
        if (Guid.TryParse(key, out var id))
            follow = await _db.AuthorFollows.FirstOrDefaultAsync(f => f.UserId == uid && f.AuthorId == id);
        else
        {
            var norm = Norm(key);
            follow = await _db.AuthorFollows
                .Include(f => f.Author)
                .FirstOrDefaultAsync(f => f.UserId == uid && f.Author!.NameNormalized == norm);
        }

        if (follow is null) return NotFound();
        _db.AuthorFollows.Remove(follow);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
