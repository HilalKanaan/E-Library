using System.Text.Json.Serialization;

namespace Elibrary.Api.Models;

public class Book
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Isbn { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Author { get; set; } = default!;
    public string? Genre { get; set; }
    public int PublishedYear { get; set; }
    public string? Description { get; set; }
    public string? CoverUrl { get; set; }
    public int TotalCopies { get; set; } = 1;
    public int AvailableCopies { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [JsonIgnore]                         // break the self-reference loop
    public ICollection<Borrow> Borrows { get; set; } = new List<Borrow>();
    [JsonIgnore] public ICollection<Review> Reviews { get; set; } = new List<Review>();

}
