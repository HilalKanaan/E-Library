using Elibrary.Api.Data;
using Elibrary.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/admin/maintenance")]
[Authorize(Roles = "Admin")]
public class MaintenanceController : ControllerBase
{
    private readonly AppDb _db;
    public MaintenanceController(AppDb db) { _db = db; }

    private static string Norm(string? s) => (s ?? "").Trim().ToLowerInvariant();

    // POST /api/admin/maintenance/backfill-authors
    [HttpPost("backfill-authors")]
    public async Task<IActionResult> BackfillAuthors()
    {
        // Create missing authors from distinct book.Author strings
        var names = await _db.Books
            .Select(b => b.Author ?? "")
            .Distinct()
            .ToListAsync();

        foreach (var name in names)
        {
            var n = Norm(name);
            if (string.IsNullOrWhiteSpace(n)) continue;
            var exists = await _db.Authors.AnyAsync(a => a.NameNormalized == n);
            if (!exists)
                _db.Authors.Add(new Author { Name = name.Trim(), NameNormalized = n });
        }
        await _db.SaveChangesAsync();

        // Link books to AuthorId
        var authors = await _db.Authors.ToListAsync();
        var byNorm = authors.ToDictionary(a => a.NameNormalized, a => a);
        var books = await _db.Books.Where(b => b.AuthorId == null).ToListAsync();

        foreach (var b in books)
        {
            var n = Norm(b.Author);
            if (byNorm.TryGetValue(n, out var a))
                b.AuthorId = a.Id; // keep b.Author as a.Name for compat
        }
        await _db.SaveChangesAsync();

        return Ok(new { createdAuthors = authors.Count, linkedBooks = books.Count });
    }
}
