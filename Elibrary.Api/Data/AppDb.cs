using Elibrary.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Elibrary.Api.Data;

public class AppDb : DbContext
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<Borrow> Borrows => Set<Borrow>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<AuthorFollow> AuthorFollows => Set<AuthorFollow>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // Users
        b.Entity<User>().HasIndex(u => u.Username).IsUnique();

        // Borrows (renewals)
        b.Entity<Borrow>().Property(x => x.RenewalsCount).HasDefaultValue(0);
        b.Entity<Borrow>().Property(x => x.LastRenewedAt).IsRequired(false);

        // Authors
        b.Entity<Author>().HasIndex(a => a.NameNormalized).IsUnique();

        // Books ↔ Authors
        b.Entity<Book>()
            .HasOne(x => x.AuthorEntity)
            .WithMany(a => a.Books)
            .HasForeignKey(x => x.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Reviews
        b.Entity<Review>()
            .HasOne(r => r.User).WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Review>()
            .HasOne(r => r.Book).WithMany(bk => bk.Reviews)
            .HasForeignKey(r => r.BookId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Review>().HasIndex(r => new { r.UserId, r.BookId }).IsUnique();

        // Follows: unique per (user, author)
        b.Entity<AuthorFollow>()
            .HasIndex(f => new { f.UserId, f.AuthorId })
            .IsUnique();

        // Notifications
        b.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
    }
}
