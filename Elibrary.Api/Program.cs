using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;
using Elibrary.Api.Data;
using Elibrary.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// Controllers + JSON cycle handling
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// EF Core (SQLite)
builder.Services.AddDbContext<AppDb>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=elibrary.db"));

// JWT
var jwtKey = builder.Configuration["Jwt:Key"]
             ?? "0123456789abcdefghijklmnopqrstuv0123456789abcdef"; // >= 32 chars
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// CORS for the frontend (Vite dev server)
builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// Swagger + JWT security (shows the Authorize button)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Elibrary API", Version = "v1" });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();               // ⚠️ Enable CORS before auth/endpoints
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed admin + sample books
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    db.Database.Migrate();

    if (!db.Users.Any())
    {
        db.Users.Add(new User
        {
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = "Admin",
            FullName = "System Admin"
        });
        db.SaveChanges();
    }

    if (!db.Books.Any())
    {
        db.Books.AddRange(
            new Book
            {
                Isbn = "9780141439600",
                Title = "Pride and Prejudice",
                Author = "Jane Austen",
                Genre = "Classic",
                TotalCopies = 3,
                AvailableCopies = 3
            },
            new Book
            {
                Isbn = "9780553386790",
                Title = "Sapiens",
                Author = "Yuval Noah Harari",
                Genre = "History",
                TotalCopies = 2,
                AvailableCopies = 2
            }
        );
        db.SaveChanges();
    }
}

app.Run();
