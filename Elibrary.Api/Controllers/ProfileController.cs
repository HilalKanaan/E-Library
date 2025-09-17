using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Elibrary.Api.Data;
using Elibrary.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Elibrary.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly AppDb _db;
        public ProfileController(AppDb db) { _db = db; }

        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = CurrentUserId;

            // user basic (these fields exist or are null-safe if you haven’t added them yet)
            var u = await _db.Users.AsNoTracking()
                .Where(x => x.Id == userId)
                .Select(x => new UserInfoDto(
                    x.Id,
                    x.Username,
                    x.DisplayName,
                    x.AvatarUrl,
                    x.Bio
                ))
                .SingleAsync();

            // Books finished (returned)
            var finished = await _db.Borrows.AsNoTracking()
                .Where(b => b.UserId == userId && b.ReturnedAt != null)
                .OrderBy(b => b.ReturnedAt)
                .Select(b => new { b.BorrowedAt, b.ReturnedAt, b.BookId })
                .ToListAsync();

            var booksRead = finished.Count;

            // Hours read (approx): duration between BorrowedAt and ReturnedAt in hours
            double hours = finished.Sum(x => (x.ReturnedAt!.Value - x.BorrowedAt).TotalHours);
            double hoursRounded = Math.Round(hours, 1);

            // Avg rating (user’s reviews)
            double avgRating = Math.Round(
                await _db.Reviews.AsNoTracking()
                    .Where(r => r.UserId == userId)
                    .Select(r => (double?)r.Rating)
                    .AverageAsync() ?? 0.0, 1);

            // Top genres from finished borrows
            var topGenres = await _db.Borrows.AsNoTracking()
                .Where(b => b.UserId == userId && b.ReturnedAt != null)
                .Join(_db.Books.AsNoTracking(),
                      b => b.BookId, bk => bk.Id,
                      (b, bk) => bk.Genre ?? "")
                .Where(g => g != "")
                .GroupBy(g => g)
                .Select(g => new { Name = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ThenBy(x => x.Name)
                .Take(5)
                .Select(x => x.Name)
                .ToListAsync();

            // ----- Badges (derived) -----
            // Bookworm I (5 books)
            DateTime? books5At = null;
            if (booksRead >= 5)
            {
                // the return date of the 5th finished book
                var ordered = finished.Select(x => x.ReturnedAt!.Value).OrderBy(d => d).ToList();
                books5At = ordered.ElementAt(4);
            }

            // Timekeeper I (10 hours)
            DateTime? hours10At = null;
            if (hours >= 10.0)
            {
                // approximate: accumulate finished durations until >=10h
                double acc = 0;
                foreach (var f in finished.OrderBy(x => x.ReturnedAt))
                {
                    acc += (f.ReturnedAt!.Value - f.BorrowedAt).TotalHours;
                    if (acc >= 10.0) { hours10At = f.ReturnedAt!.Value; break; }
                }
            }

            // Critic I (first review)
            var hasReview = await _db.Reviews.AsNoTracking()
                .AnyAsync(r => r.UserId == userId);

            var badges = new[]
            {
                new BadgeDto("books_5", "Bookworm I", "Read 5 books", booksRead >= 5, books5At),
                new BadgeDto("hours_10", "Timekeeper I", "Read for 10 hours", hours >= 10.0, hours10At),
                new BadgeDto("first_review", "Critic I", "Write your first review", hasReview, null)
            };

            var dto = new ProfileMeDto(
                u,
                new ProfileStatsDto(booksRead, hoursRounded, avgRating, topGenres.ToArray()),
                badges
            );

            return Ok(dto);
        }
    }
}
