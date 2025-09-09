namespace Elibrary.Api.DTOs;
public record BookCreateUpdateDto(string Isbn, string Title, string Author, string? Genre, int PublishedYear, string? Description, string? CoverUrl, int TotalCopies, int AvailableCopies);
