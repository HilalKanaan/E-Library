using System;
using System.Collections.Generic;

namespace Elibrary.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "User";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Profile fields
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }

    // Nav props (make sure these other model files use the SAME namespace: Elibrary.Api.Models)
    public ICollection<Borrow> Borrows { get; set; } = new List<Borrow>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<AuthorFollow> Follows { get; set; } = new List<AuthorFollow>();
}
