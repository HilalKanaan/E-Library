using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Elibrary.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBorrowRenewals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastRenewedAt",
                table: "Borrows",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RenewalsCount",
                table: "Borrows",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastRenewedAt",
                table: "Borrows");

            migrationBuilder.DropColumn(
                name: "RenewalsCount",
                table: "Borrows");
        }
    }
}
