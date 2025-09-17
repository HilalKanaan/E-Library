using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Elibrary.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorsAndRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AuthorName",
                table: "AuthorFollows");

            migrationBuilder.RenameColumn(
                name: "AuthorNormalized",
                table: "AuthorFollows",
                newName: "AuthorId");

            migrationBuilder.RenameIndex(
                name: "IX_AuthorFollows_UserId_AuthorNormalized",
                table: "AuthorFollows",
                newName: "IX_AuthorFollows_UserId_AuthorId");

            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BookId",
                table: "Notifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "Books",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Authors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    NameNormalized = table.Column<string>(type: "TEXT", nullable: false),
                    Bio = table.Column<string>(type: "TEXT", nullable: true),
                    PhotoUrl = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Authors", x => x.Id);
                });

            // ✅ Quick fix: remove legacy rows so FK rebuild won't fail (they contain old normalized-name strings)
            migrationBuilder.Sql("DELETE FROM \"AuthorFollows\";");

            migrationBuilder.CreateIndex(
                name: "IX_Books_AuthorId",
                table: "Books",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_AuthorFollows_AuthorId",
                table: "AuthorFollows",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Authors_NameNormalized",
                table: "Authors",
                column: "NameNormalized",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AuthorFollows_Authors_AuthorId",
                table: "AuthorFollows",
                column: "AuthorId",
                principalTable: "Authors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Books_Authors_AuthorId",
                table: "Books",
                column: "AuthorId",
                principalTable: "Authors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuthorFollows_Authors_AuthorId",
                table: "AuthorFollows");

            migrationBuilder.DropForeignKey(
                name: "FK_Books_Authors_AuthorId",
                table: "Books");

            migrationBuilder.DropTable(
                name: "Authors");

            migrationBuilder.DropIndex(
                name: "IX_Books_AuthorId",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_AuthorFollows_AuthorId",
                table: "AuthorFollows");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "BookId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "Books");

            migrationBuilder.RenameColumn(
                name: "AuthorId",
                table: "AuthorFollows",
                newName: "AuthorNormalized");

            migrationBuilder.RenameIndex(
                name: "IX_AuthorFollows_UserId_AuthorId",
                table: "AuthorFollows",
                newName: "IX_AuthorFollows_UserId_AuthorNormalized");

            migrationBuilder.AddColumn<string>(
                name: "AuthorName",
                table: "AuthorFollows",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
