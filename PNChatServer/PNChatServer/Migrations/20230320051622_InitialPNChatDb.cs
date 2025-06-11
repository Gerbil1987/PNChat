using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PNChatServer.Migrations
{
    /// <inheritdoc />
    public partial class InitialPNChatDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Group",
                columns: table => new
                {
                    Code = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    Type = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false, comment: "single: chat 1-1\r\nmulti: chat 1-n"),
                    Avatar = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Created = table.Column<DateTime>(type: "datetime", nullable: false),
                    CreatedBy = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    LastActive = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Group", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "GroupCall",
                columns: table => new
                {
                    Code = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    Type = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false, comment: "single: chat 1-1\r\nmulti: chat 1-n"),
                    Avatar = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    Name = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Created = table.Column<DateTime>(type: "datetime", nullable: false),
                    CreatedBy = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    LastActive = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupCall", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    Code = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    UserName = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: true),
                    Password = table.Column<string>(type: "varchar(124)", unicode: false, maxLength: 124, nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Dob = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    Phone = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Avatar = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    LastLogin = table.Column<DateTime>(type: "datetime", nullable: true),
                    CurrentSession = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "Call",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupCallCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    UserCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    Created = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Call", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Call_GroupCall",
                        column: x => x.GroupCallCode,
                        principalTable: "GroupCall",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_Call_User",
                        column: x => x.UserCode,
                        principalTable: "User",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "Contact",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    ContactCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    Created = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contact", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contact_User",
                        column: x => x.UserCode,
                        principalTable: "User",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_Contact_User1",
                        column: x => x.ContactCode,
                        principalTable: "User",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "GroupUser",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    UserCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupUser", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupUser_Group",
                        column: x => x.GroupCode,
                        principalTable: "Group",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_GroupUser_User",
                        column: x => x.UserCode,
                        principalTable: "User",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "Message",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false, comment: "text\r\nmedia\r\nattachment"),
                    GroupCode = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Path = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Created = table.Column<DateTime>(type: "datetime", nullable: false),
                    CreatedBy = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Message", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Message_Group",
                        column: x => x.GroupCode,
                        principalTable: "Group",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_Message_User",
                        column: x => x.CreatedBy,
                        principalTable: "User",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Call_GroupCallCode",
                table: "Call",
                column: "GroupCallCode");

            migrationBuilder.CreateIndex(
                name: "IX_Call_UserCode",
                table: "Call",
                column: "UserCode");

            migrationBuilder.CreateIndex(
                name: "IX_Contact_ContactCode",
                table: "Contact",
                column: "ContactCode");

            migrationBuilder.CreateIndex(
                name: "IX_Contact_UserCode",
                table: "Contact",
                column: "UserCode");

            migrationBuilder.CreateIndex(
                name: "IX_GroupUser_GroupCode",
                table: "GroupUser",
                column: "GroupCode");

            migrationBuilder.CreateIndex(
                name: "IX_GroupUser_UserCode",
                table: "GroupUser",
                column: "UserCode");

            migrationBuilder.CreateIndex(
                name: "IX_Message_CreatedBy",
                table: "Message",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Message_GroupCode",
                table: "Message",
                column: "GroupCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Call");

            migrationBuilder.DropTable(
                name: "Contact");

            migrationBuilder.DropTable(
                name: "GroupUser");

            migrationBuilder.DropTable(
                name: "Message");

            migrationBuilder.DropTable(
                name: "GroupCall");

            migrationBuilder.DropTable(
                name: "Group");

            migrationBuilder.DropTable(
                name: "User");
        }
    }
}
