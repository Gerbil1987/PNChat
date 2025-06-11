using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PNChatServer.Migrations
{
    /// <inheritdoc />
    public partial class fix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Message",
                type: "varchar(10)",
                unicode: false,
                maxLength: 10,
                nullable: true,
                comment: "text\r\nmedia\r\nattachment",
                oldClrType: typeof(string),
                oldType: "varchar(10)",
                oldUnicode: false,
                oldMaxLength: 10,
                oldComment: "text\r\nmedia\r\nattachment");

            migrationBuilder.AlterColumn<string>(
                name: "GroupCode",
                table: "Message",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "Message",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "UserCode",
                table: "GroupUser",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "GroupCode",
                table: "GroupUser",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "GroupCall",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                comment: "single: chat 1-1\r\nmulti: chat 1-n",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldComment: "single: chat 1-1\r\nmulti: chat 1-n");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "GroupCall",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Group",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                comment: "single: chat 1-1\r\nmulti: chat 1-n",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldComment: "single: chat 1-1\r\nmulti: chat 1-n");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "Group",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "UserCode",
                table: "Contact",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "ContactCode",
                table: "Contact",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "UserCode",
                table: "Call",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "Url",
                table: "Call",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Call",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "GroupCallCode",
                table: "Call",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Message",
                type: "varchar(10)",
                unicode: false,
                maxLength: 10,
                nullable: false,
                defaultValue: "",
                comment: "text\r\nmedia\r\nattachment",
                oldClrType: typeof(string),
                oldType: "varchar(10)",
                oldUnicode: false,
                oldMaxLength: 10,
                oldNullable: true,
                oldComment: "text\r\nmedia\r\nattachment");

            migrationBuilder.AlterColumn<string>(
                name: "GroupCode",
                table: "Message",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "Message",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserCode",
                table: "GroupUser",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GroupCode",
                table: "GroupUser",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "GroupCall",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                comment: "single: chat 1-1\r\nmulti: chat 1-n",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true,
                oldComment: "single: chat 1-1\r\nmulti: chat 1-n");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "GroupCall",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Group",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                comment: "single: chat 1-1\r\nmulti: chat 1-n",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true,
                oldComment: "single: chat 1-1\r\nmulti: chat 1-n");

            migrationBuilder.AlterColumn<string>(
                name: "CreatedBy",
                table: "Group",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserCode",
                table: "Contact",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ContactCode",
                table: "Contact",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "UserCode",
                table: "Call",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Url",
                table: "Call",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Call",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "GroupCallCode",
                table: "Call",
                type: "varchar(32)",
                unicode: false,
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldUnicode: false,
                oldMaxLength: 32,
                oldNullable: true);
        }
    }
}
