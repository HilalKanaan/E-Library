using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Elibrary.Api.Data;
using Elibrary.Api.DTOs;
using Elibrary.Api.Models;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly AppDb _db;
    public BooksController(AppDb db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? q,
        [FromQuery] string? author,
        [FromQuery] string? genre,
        [FromQuery] bool availableOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var queryable = _db.Books.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var t = q.Trim();
            queryable = queryable.Where(b =>
                EF.Functions.Like(EF.Functions.Collate(b.Title, "NOCASE"), $"%{t}%") ||
                EF.Functions.Like(EF.Functions.Collate(b.Author, "NOCASE"), $"%{t}%") ||
                EF.Functions.Like(EF.Functions.Collate(b.Isbn, "NOCASE"), $"%{t}%") ||
                EF.Functions.Like(EF.Functions.Collate(b.Genre ?? string.Empty, "NOCASE"), $"%{t}%")
            );
        }

        if (!string.IsNullOrWhiteSpace(author))
        {
            var a = author.Trim();
            queryable = queryable.Where(b =>
                EF.Functions.Like(EF.Functions.Collate(b.Author, "NOCASE"), $"%{a}%"));
        }

        if (!string.IsNullOrWhiteSpace(genre))
        {
            var g = genre.Trim();
            queryable = queryable.Where(b =>
                EF.Functions.Like(EF.Functions.Collate(b.Genre ?? string.Empty, "NOCASE"), $"%{g}%"));
        }

        if (availableOnly)
            queryable = queryable.Where(b => b.AvailableCopies > 0);

        var total = await queryable.CountAsync();

        var items = await queryable
            .OrderBy(b => b.Title)
            .Select(b => new BookListItemDto(
                b.Id, b.Isbn, b.Title, b.Author, b.Genre, b.PublishedYear,
                b.Description, b.CoverUrl, b.TotalCopies, b.AvailableCopies,
                Math.Round(
                    b.Reviews.Select(r => (double?)r.Rating).Average() ?? 0.0, 2
                )
            ))
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { total, items, page, pageSize });
    }

    // lightweight details object with rating summary
    [HttpGet("{id:guid}/details")]
    public async Task<IActionResult> Details(Guid id)
    {
        var b = await _db.Books.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new BookDetailDto(
                x.Id, x.Isbn, x.Title, x.Author, x.Genre, x.PublishedYear,
                x.Description, x.CoverUrl, x.TotalCopies, x.AvailableCopies,
                Math.Round(x.Reviews.Select(r => (double?)r.Rating).Average() ?? 0.0, 2),
                x.Reviews.Count
            ))
            .SingleOrDefaultAsync();

        return b is null ? NotFound() : Ok(b);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var book = await _db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        return book is null ? NotFound() : Ok(book);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(BookCreateUpdateDto dto)
    {
        var entity = new Book
        {
            Isbn = dto.Isbn,
            Title = dto.Title,
            Author = dto.Author,
            Genre = dto.Genre,
            PublishedYear = dto.PublishedYear,
            Description = dto.Description,
            CoverUrl = dto.CoverUrl,
            TotalCopies = dto.TotalCopies,
            AvailableCopies = Math.Clamp(
                dto.AvailableCopies == 0 ? dto.TotalCopies : dto.AvailableCopies,
                0, dto.TotalCopies)
        };
        _db.Books.Add(entity);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, BookCreateUpdateDto dto)
    {
        var b = await _db.Books.FindAsync(id);
        if (b is null) return NotFound();
        b.Isbn = dto.Isbn; b.Title = dto.Title; b.Author = dto.Author;
        b.Genre = dto.Genre; b.PublishedYear = dto.PublishedYear;
        b.Description = dto.Description; b.CoverUrl = dto.CoverUrl;
        b.TotalCopies = dto.TotalCopies;
        b.AvailableCopies = Math.Clamp(dto.AvailableCopies, 0, b.TotalCopies);
        b.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var b = await _db.Books.FindAsync(id);
        if (b is null) return NotFound();
        _db.Books.Remove(b);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
