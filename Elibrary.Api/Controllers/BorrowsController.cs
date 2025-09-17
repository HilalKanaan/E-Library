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
    int MaxRenewals => int.Parse(_cfg["Borrowing:MaxRenewals"] ?? "2");

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> MyBorrows()
    {
        var uid = CurrentUserId;
        var items = await _db.Borrows.Include(b => b.Book)
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

        var borrow = new Borrow
        {
            UserId = uid,
            BookId = book.Id,
            BorrowedAt = DateTime.UtcNow,
            DueAt = DateTime.UtcNow.AddDays(DaysLoan),
            Status = "Borrowed",
            RenewalsCount = 0
        };

        _db.Borrows.Add(borrow);
        book.AvailableCopies -= 1;
        await _db.SaveChangesAsync();
        return Ok(borrow);
    }

    [Authorize]
    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> Return(Guid id)
    {
        var borrow = await _db.Borrows.Include(b => b.Book)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == CurrentUserId);
        if (borrow is null) return NotFound("Borrow not found.");

        if (borrow.ReturnedAt != null) return BadRequest("Already returned.");
        borrow.ReturnedAt = DateTime.UtcNow;
        borrow.Status = DateTime.UtcNow > borrow.DueAt ? "Overdue" : "Returned";
        borrow.Book.AvailableCopies += 1;
        await _db.SaveChangesAsync();
        return Ok(borrow);
    }

    // ✅ NEW: Renew an active borrow
    [Authorize]
    [HttpPost("{id:guid}/renew")]
    public async Task<IActionResult> Renew(Guid id)
    {
        var isAdmin = User.IsInRole("Admin");
        var borrow = await _db.Borrows.FindAsync(id);
        if (borrow is null) return NotFound("Borrow not found.");

        // Only owner or admin
        if (!isAdmin && borrow.UserId != CurrentUserId) return Forbid();

        // Only active borrows can be renewed
        if (borrow.ReturnedAt != null || borrow.Status != "Borrowed")
            return BadRequest("Only active borrows can be renewed.");

        // Cannot renew overdue
        if (borrow.DueAt < DateTime.UtcNow)
            return BadRequest("Cannot renew overdue borrows.");

        // Respect max renewals
        if (borrow.RenewalsCount >= MaxRenewals)
            return BadRequest("Maximum renewals reached.");

        // Extend due date
        borrow.DueAt = borrow.DueAt.AddDays(DaysLoan);
        borrow.RenewalsCount++;
        borrow.LastRenewedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Borrow renewed successfully.",
            newDueAt = borrow.DueAt,
            renewalsCount = borrow.RenewalsCount
        });
    }

    // Admin overview
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> All([FromQuery] string? status, [FromQuery] Guid? userId, [FromQuery] Guid? bookId)
    {
        var q = _db.Borrows.Include(b => b.Book).Include(b => b.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(b => b.Status == status);
        if (userId is not null) q = q.Where(b => b.UserId == userId);
        if (bookId is not null) q = q.Where(b => b.BookId == bookId);
        var items = await q.OrderByDescending(b => b.BorrowedAt).ToListAsync();
        return Ok(items);
    }
}
