using System;

namespace Elibrary.Api.DTOs
{
    public record ProfileMeDto(
        UserInfoDto User,
        ProfileStatsDto Stats,
        BadgeDto[] Badges
    );

    public record UserInfoDto(
        Guid Id,
        string Username,
        string? DisplayName,
        string? AvatarUrl,
        string? Bio
    );

    public record ProfileStatsDto(
        int BooksRead,
        double HoursRead,           // rounded to 1 decimal
        double AvgRating,           // rounded to 1 decimal
        string[] TopGenres          // up to 5
    );

    public record BadgeDto(
        string Id,                  // e.g. "books_5"
        string Title,               // "Bookworm I"
        string Description,         // "Read 5 books"
        bool Achieved,
        DateTime? AchievedAt        // null if unknown
    );
}
