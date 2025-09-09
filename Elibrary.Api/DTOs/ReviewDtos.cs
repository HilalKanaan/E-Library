namespace Elibrary.Api.DTOs;

public record ReviewCreateDto(Guid BookId, int Rating, string? Comment);

public record ReviewItemDto(
    Guid Id,
    int Rating,
    string? Comment,
    string Username,
    DateTime CreatedAt
);

public record BookListItemDto(
    Guid Id,
    string Isbn,
    string Title,
    string Author,
    string? Genre,
    int PublishedYear,
    string? Description,
    string? CoverUrl,
    int TotalCopies,
    int AvailableCopies,
    double AvgRating
);

public record BookDetailDto(
    Guid Id,
    string Isbn,
    string Title,
    string Author,
    string? Genre,
    int PublishedYear,
    string? Description,
    string? CoverUrl,
    int TotalCopies,
    int AvailableCopies,
    double AvgRating,
    int ReviewsCount
);
