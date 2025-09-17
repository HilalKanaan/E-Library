namespace Elibrary.Api.Models;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Kind { get; set; } = "author_new_book";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public Guid? BookId { get; set; }
    public Guid? AuthorId { get; set; }
    public string? DataJson { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
