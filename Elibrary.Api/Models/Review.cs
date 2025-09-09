using System.Text.Json.Serialization;

namespace Elibrary.Api.Models;

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    [JsonIgnore] public User User { get; set; } = default!;

    public Guid BookId { get; set; }
    [JsonIgnore] public Book Book { get; set; } = default!;

    // 1..5
    public int Rating { get; set; }
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
