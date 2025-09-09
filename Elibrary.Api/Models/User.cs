using System.Text.Json.Serialization;

namespace Elibrary.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Role { get; set; } = "User"; // Admin or User
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [JsonIgnore] public ICollection<Review> Reviews { get; set; } = new List<Review>();


    [JsonIgnore]                         // break the self-reference loop
    public ICollection<Borrow> Borrows { get; set; } = new List<Borrow>();
}
