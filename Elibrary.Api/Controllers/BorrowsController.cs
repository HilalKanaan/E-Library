using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Elibrary.Api.Data;
using Elibrary.Api.DTOs;
using Elibrary.Api.Models;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BorrowsController : ControllerBase
{
    private readonly AppDb _db;
    private readonly IConfiguration _cfg;
    public BorrowsController(AppDb db, IConfiguration cfg) { _db = db; _cfg = cfg; }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    int MaxActiveBorrows => int.Parse(_cfg["Borrowing:MaxActive"] ?? "5");
    int DaysLoan => int.Parse(_cfg["Borrowing:LoanDays"] ?? "14");

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> MyBorrows()
    {
        var uid = CurrentUserId;
        var items = await _db.Borrows.Include(b=>b.Book)
            .Where(b => b.UserId == uid)
            .OrderByDescending(b => b.BorrowedAt)
            .ToListAsync();
        return Ok(items);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Borrow(BorrowRequestDto dto)
    {
        var uid = CurrentUserId;

        var activeCount = await _db.Borrows.CountAsync(b => b.UserId == uid && b.ReturnedAt == null);
        if (activeCount >= MaxActiveBorrows) return BadRequest("Borrow limit reached.");

        var book = await _db.Books.FindAsync(dto.BookId);
        if (book is null) return NotFound("Book not found.");
        if (book.AvailableCopies <= 0) return BadRequest("Book unavailable.");

        var borrow = new Borrow {
            UserId = uid, BookId = book.Id,
            BorrowedAt = DateTime.UtcNow,
            DueAt = DateTime.UtcNow.AddDays(DaysLoan),
            Status = "Borrowed"
        };

        _db.Borrows.Add(borrow);
        book.AvailableCopies -= 1;
        await _db.SaveChangesAsync();
        return Ok(borrow);
    }

    [Authorize]
    [HttpPost("{id}/return")]
    public async Task<IActionResult> Return(Guid id)
    {
        var borrow = await _db.Borrows.Include(b=>b.Book)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == CurrentUserId);
        if (borrow is null) return NotFound();

        if (borrow.ReturnedAt != null) return BadRequest("Already returned.");
        borrow.ReturnedAt = DateTime.UtcNow;
        borrow.Status = DateTime.UtcNow > borrow.DueAt ? "Overdue" : "Returned";
        borrow.Book.AvailableCopies += 1;
        await _db.SaveChangesAsync();
        return Ok(borrow);
    }

    // Admin overview
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> All([FromQuery] string? status, [FromQuery] Guid? userId, [FromQuery] Guid? bookId)
    {
        var q = _db.Borrows.Include(b=>b.Book).Include(b=>b.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(b => b.Status == status);
        if (userId is not null) q = q.Where(b => b.UserId == userId);
        if (bookId is not null) q = q.Where(b => b.BookId == bookId);
        var items = await q.OrderByDescending(b=>b.BorrowedAt).ToListAsync();
        return Ok(items);
    }
}
