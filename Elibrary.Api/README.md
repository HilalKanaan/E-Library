
# eLibrary Web API (ASP.NET Core 8 + EF Core + SQLite + JWT)

This starter satisfies your internship requirements:
- Login (JWT) and client-side logout
- List/search books
- Borrow/Return with availability
- Profile + My Borrows
- Admin CRUD for books
- Admin overview of borrows (extra)

## Quick Start (Windows PowerShell)
```ps1
cd Elibrary.Api
dotnet restore
dotnet tool install -g dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```
Swagger: http://localhost:5000/swagger

### Default Admin
- username: admin
- password: admin123
