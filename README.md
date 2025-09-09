# eLibrary — ASP.NET Core + React (MVP)

A simple online library:
- **Users** register/login, search books, borrow/return.
- **Admins** manage books (add/edit/delete).
- **Ratings & Reviews:** one per user/book, average stars on the list.
- Swagger with JWT “Authorize” button for easy testing.

## Tech
ASP.NET Core 8, EF Core, SQLite, React + Vite.

## Quick Start

### Backend (API)
1. Requirements: .NET 8 SDK.
2. Run:
   ```bash
   cd Elibrary.Api
   dotnet restore
   dotnet ef database update
   dotnet run
