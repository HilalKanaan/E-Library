using Elibrary.Api.Data;
using Elibrary.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthorsController : ControllerBase
{
    private readonly AppDb _db;
    public AuthorsController(AppDb db) { _db = db; }

    private static string Norm(string? s) => (s ?? "").Trim().ToLowerInvariant();

    // Public list/search (for pickers)
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? q, [FromQuery] int take = 200)
    {
        var qry = _db.Authors.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var t = Norm(q);
            qry = qry.Where(a => a.NameNormalized.Contains(t));
        }

        var items = await qry
            .OrderBy(a => a.Name)
            .Take(Math.Clamp(take, 1, 500))
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.PhotoUrl,
                BooksCount = a.Books.Count
            })
            .ToListAsync();

        return Ok(items);
    }

    // Public details
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var a = await _db.Authors.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Bio,
                x.PhotoUrl,
                BooksCount = x.Books.Count,
                FirstYear = x.Books.Min(b => (int?)b.PublishedYear),
                LastYear = x.Books.Max(b => (int?)b.PublishedYear)
            })
            .SingleOrDefaultAsync();

        return a is null ? NotFound() : Ok(a);
    }

    // Admin create/update/delete
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Author dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Name required");
        var norm = Norm(dto.Name);
        var exists = await _db.Authors.AnyAsync(a => a.NameNormalized == norm);
        if (exists) return Conflict("Author already exists.");

        var a = new Author
        {
            Name = dto.Name.Trim(),
            NameNormalized = norm,
            Bio = dto.Bio,
            PhotoUrl = dto.PhotoUrl
        };
        _db.Authors.Add(a);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = a.Id }, a);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Author dto)
    {
        var a = await _db.Authors.FindAsync(id);
        if (a is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            var norm = Norm(dto.Name);
            var exists = await _db.Authors.AnyAsync(x => x.Id != id && x.NameNormalized == norm);
            if (exists) return Conflict("Another author with this name exists.");
            a.Name = dto.Name.Trim();
            a.NameNormalized = norm;
        }
        a.Bio = dto.Bio;
        a.PhotoUrl = dto.PhotoUrl;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // We restrict delete if any books still point to this author.
        var hasBooks = await _db.Books.AnyAsync(b => b.AuthorId == id);
        if (hasBooks) return BadRequest("Cannot delete author with books. Reassign or delete books first.");

        var author = await _db.Authors.FindAsync(id);
        if (author is null) return NotFound();

        _db.Authors.Remove(author);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
