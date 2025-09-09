using System.Security.Claims;
using Elibrary.Api.Data;
using Elibrary.Api.DTOs;
using Elibrary.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly AppDb _db;
    public ReviewsController(AppDb db) => _db = db;

    // Upsert: one review per user per book
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Upsert(ReviewCreateDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5) return BadRequest("Rating must be 1..5");
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var bookExists = await _db.Books.AnyAsync(b => b.Id == dto.BookId);
        if (!bookExists) return NotFound("Book not found");

        var existing = await _db.Reviews
            .SingleOrDefaultAsync(r => r.UserId == userId && r.BookId == dto.BookId);

        if (existing is null)
        {
            var review = new Review
            {
                UserId = userId,
                BookId = dto.BookId,
                Rating = dto.Rating,
                Comment = string.IsNullOrWhiteSpace(dto.Comment) ? null : dto.Comment!.Trim(),
            };
            _db.Reviews.Add(review);
            await _db.SaveChangesAsync();
            return Ok(new { review.Id, review.Rating, review.Comment, review.CreatedAt });
        }
        else
        {
            existing.Rating = dto.Rating;
            existing.Comment = string.IsNullOrWhiteSpace(dto.Comment) ? null : dto.Comment!.Trim();
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { existing.Id, existing.Rating, existing.Comment, existing.CreatedAt });
        }
    }

    // Public: list reviews for a book
    [HttpGet("book/{bookId:guid}")]
    public async Task<IActionResult> ListForBook(Guid bookId)
    {
        var data = await _db.Reviews
            .Where(r => r.BookId == bookId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewItemDto(
                r.Id, r.Rating, r.Comment ?? "",
                r.User.Username, r.CreatedAt
            ))
            .ToListAsync();

        return Ok(data);
    }
}
