namespace Elibrary.Api.DTOs;

public class BookCreateUpdateDto
{
    public string Isbn { get; set; } = "";
    public string Title { get; set; } = "";
    public Guid? AuthorId { get; set; }   // NEW
    public string? Author { get; set; }   // kept for compat
    public string? Genre { get; set; }
    public int? PublishedYear { get; set; }
    public string? Description { get; set; }
    public string? CoverUrl { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
}
