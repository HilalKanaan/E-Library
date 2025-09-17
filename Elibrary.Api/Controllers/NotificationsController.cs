using System.Security.Claims;
using Elibrary.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Elibrary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDb _db;
    public NotificationsController(AppDb db) { _db = db; }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // List notifications (default: newest first). ?unreadOnly=true
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool unreadOnly = false, [FromQuery] int take = 50)
    {
        var uid = CurrentUserId;
        var q = _db.Notifications.Where(n => n.UserId == uid);
        if (unreadOnly) q = q.Where(n => !n.IsRead);
        var items = await q.OrderByDescending(n => n.CreatedAt).Take(Math.Clamp(take, 1, 200)).ToListAsync();
        return Ok(items);
    }

    // Mark one as read
    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var uid = CurrentUserId;
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (n is null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // Mark all as read
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var uid = CurrentUserId;
        await _db.Notifications
            .Where(n => n.UserId == uid && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));
        return Ok();
    }
}
