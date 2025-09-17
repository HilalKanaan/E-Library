namespace Elibrary.Api.Models;

public class Borrow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public Guid BookId { get; set; }
    public Book Book { get; set; } = default!;
    public DateTime BorrowedAt { get; set; } = DateTime.UtcNow;
    public DateTime DueAt { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public string Status { get; set; } = "Borrowed"; // Borrowed | Returned | Overdue
    public string? Notes { get; set; }
    public int RenewalsCount { get; set; } = 0;
    public DateTime? LastRenewedAt { get; set; }

}
