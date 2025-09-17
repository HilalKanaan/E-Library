namespace Elibrary.Api.Models;

public class Author
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string NameNormalized { get; set; } = "";
    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Book> Books { get; set; } = new List<Book>();
    public ICollection<AuthorFollow> Followers { get; set; } = new List<AuthorFollow>();
}
