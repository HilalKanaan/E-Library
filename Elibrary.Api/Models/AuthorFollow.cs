namespace Elibrary.Api.Models;

public class AuthorFollow
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AuthorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Author? Author { get; set; }
}
