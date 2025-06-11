IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Group] (
    [Code] varchar(32) NOT NULL,
    [Type] varchar(32) NOT NULL,
    [Avatar] varchar(max) NULL,
    [Name] nvarchar(250) NULL,
    [Created] datetime NOT NULL,
    [CreatedBy] varchar(32) NOT NULL,
    [LastActive] datetime NOT NULL,
    CONSTRAINT [PK_Group] PRIMARY KEY ([Code])
);
DECLARE @defaultSchema AS sysname;
SET @defaultSchema = SCHEMA_NAME();
DECLARE @description AS sql_variant;
SET @description = CONCAT(N'single: chat 1-1', NCHAR(13), NCHAR(10), N'multi: chat 1-n');
EXEC sp_addextendedproperty 'MS_Description', @description, 'SCHEMA', @defaultSchema, 'TABLE', N'Group', 'COLUMN', N'Type';
GO

CREATE TABLE [GroupCall] (
    [Code] varchar(32) NOT NULL,
    [Type] varchar(32) NOT NULL,
    [Avatar] varchar(max) NULL,
    [Name] nvarchar(250) NULL,
    [Created] datetime NOT NULL,
    [CreatedBy] varchar(32) NOT NULL,
    [LastActive] datetime NOT NULL,
    CONSTRAINT [PK_GroupCall] PRIMARY KEY ([Code])
);
DECLARE @defaultSchema AS sysname;
SET @defaultSchema = SCHEMA_NAME();
DECLARE @description AS sql_variant;
SET @description = CONCAT(N'single: chat 1-1', NCHAR(13), NCHAR(10), N'multi: chat 1-n');
EXEC sp_addextendedproperty 'MS_Description', @description, 'SCHEMA', @defaultSchema, 'TABLE', N'GroupCall', 'COLUMN', N'Type';
GO

CREATE TABLE [User] (
    [Code] varchar(32) NOT NULL,
    [UserName] varchar(32) NULL,
    [Password] varchar(124) NULL,
    [FullName] nvarchar(50) NULL,
    [Dob] varchar(50) NULL,
    [Phone] varchar(50) NULL,
    [Email] varchar(50) NULL,
    [Address] nvarchar(255) NULL,
    [Avatar] varchar(max) NULL,
    [Gender] nvarchar(10) NULL,
    [LastLogin] datetime NULL,
    [CurrentSession] varchar(500) NULL,
    CONSTRAINT [PK_User] PRIMARY KEY ([Code])
);
GO

CREATE TABLE [Call] (
    [Id] int NOT NULL IDENTITY,
    [GroupCallCode] varchar(32) NOT NULL,
    [UserCode] varchar(32) NOT NULL,
    [Url] nvarchar(500) NOT NULL,
    [Status] varchar(32) NOT NULL,
    [Created] datetime NOT NULL,
    CONSTRAINT [PK_Call] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Call_GroupCall] FOREIGN KEY ([GroupCallCode]) REFERENCES [GroupCall] ([Code]),
    CONSTRAINT [FK_Call_User] FOREIGN KEY ([UserCode]) REFERENCES [User] ([Code])
);
GO

CREATE TABLE [Contact] (
    [Id] bigint NOT NULL IDENTITY,
    [UserCode] varchar(32) NOT NULL,
    [ContactCode] varchar(32) NOT NULL,
    [Created] datetime NOT NULL,
    CONSTRAINT [PK_Contact] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Contact_User] FOREIGN KEY ([UserCode]) REFERENCES [User] ([Code]),
    CONSTRAINT [FK_Contact_User1] FOREIGN KEY ([ContactCode]) REFERENCES [User] ([Code])
);
GO

CREATE TABLE [GroupUser] (
    [Id] bigint NOT NULL IDENTITY,
    [GroupCode] varchar(32) NOT NULL,
    [UserCode] varchar(32) NOT NULL,
    CONSTRAINT [PK_GroupUser] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_GroupUser_Group] FOREIGN KEY ([GroupCode]) REFERENCES [Group] ([Code]),
    CONSTRAINT [FK_GroupUser_User] FOREIGN KEY ([UserCode]) REFERENCES [User] ([Code])
);
GO

CREATE TABLE [Message] (
    [Id] bigint NOT NULL IDENTITY,
    [Type] varchar(10) NOT NULL,
    [GroupCode] varchar(32) NOT NULL,
    [Content] nvarchar(max) NULL,
    [Path] nvarchar(255) NULL,
    [Created] datetime NOT NULL,
    [CreatedBy] varchar(32) NOT NULL,
    CONSTRAINT [PK_Message] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Message_Group] FOREIGN KEY ([GroupCode]) REFERENCES [Group] ([Code]),
    CONSTRAINT [FK_Message_User] FOREIGN KEY ([CreatedBy]) REFERENCES [User] ([Code])
);
DECLARE @defaultSchema AS sysname;
SET @defaultSchema = SCHEMA_NAME();
DECLARE @description AS sql_variant;
SET @description = CONCAT(N'text', NCHAR(13), NCHAR(10), N'media', NCHAR(13), NCHAR(10), N'attachment');
EXEC sp_addextendedproperty 'MS_Description', @description, 'SCHEMA', @defaultSchema, 'TABLE', N'Message', 'COLUMN', N'Type';
GO

CREATE INDEX [IX_Call_GroupCallCode] ON [Call] ([GroupCallCode]);
GO

CREATE INDEX [IX_Call_UserCode] ON [Call] ([UserCode]);
GO

CREATE INDEX [IX_Contact_ContactCode] ON [Contact] ([ContactCode]);
GO

CREATE INDEX [IX_Contact_UserCode] ON [Contact] ([UserCode]);
GO

CREATE INDEX [IX_GroupUser_GroupCode] ON [GroupUser] ([GroupCode]);
GO

CREATE INDEX [IX_GroupUser_UserCode] ON [GroupUser] ([UserCode]);
GO

CREATE INDEX [IX_Message_CreatedBy] ON [Message] ([CreatedBy]);
GO

CREATE INDEX [IX_Message_GroupCode] ON [Message] ([GroupCode]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230320051622_InitialPNChatDb', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230328081737_FixAccessor', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230427051550_fix_Usercode', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230427052829_Usercode', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230427131855_fix_Nullable', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230427143314_fix_ModelNullable', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230427154848_fix_models', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Message]') AND [c].[name] = N'Type');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Message] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Message] ALTER COLUMN [Type] varchar(10) NULL;
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Message]') AND [c].[name] = N'GroupCode');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Message] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Message] ALTER COLUMN [GroupCode] varchar(32) NULL;
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Message]') AND [c].[name] = N'CreatedBy');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Message] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [Message] ALTER COLUMN [CreatedBy] varchar(32) NULL;
GO

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[GroupUser]') AND [c].[name] = N'UserCode');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [GroupUser] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [GroupUser] ALTER COLUMN [UserCode] varchar(32) NULL;
GO

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[GroupUser]') AND [c].[name] = N'GroupCode');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [GroupUser] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [GroupUser] ALTER COLUMN [GroupCode] varchar(32) NULL;
GO

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[GroupCall]') AND [c].[name] = N'Type');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [GroupCall] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [GroupCall] ALTER COLUMN [Type] varchar(32) NULL;
GO

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[GroupCall]') AND [c].[name] = N'CreatedBy');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [GroupCall] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [GroupCall] ALTER COLUMN [CreatedBy] varchar(32) NULL;
GO

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Group]') AND [c].[name] = N'Type');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Group] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [Group] ALTER COLUMN [Type] varchar(32) NULL;
GO

DECLARE @var8 sysname;
SELECT @var8 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Group]') AND [c].[name] = N'CreatedBy');
IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [Group] DROP CONSTRAINT [' + @var8 + '];');
ALTER TABLE [Group] ALTER COLUMN [CreatedBy] varchar(32) NULL;
GO

DECLARE @var9 sysname;
SELECT @var9 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contact]') AND [c].[name] = N'UserCode');
IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [Contact] DROP CONSTRAINT [' + @var9 + '];');
ALTER TABLE [Contact] ALTER COLUMN [UserCode] varchar(32) NULL;
GO

DECLARE @var10 sysname;
SELECT @var10 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Contact]') AND [c].[name] = N'ContactCode');
IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [Contact] DROP CONSTRAINT [' + @var10 + '];');
ALTER TABLE [Contact] ALTER COLUMN [ContactCode] varchar(32) NULL;
GO

DECLARE @var11 sysname;
SELECT @var11 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Call]') AND [c].[name] = N'UserCode');
IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [Call] DROP CONSTRAINT [' + @var11 + '];');
ALTER TABLE [Call] ALTER COLUMN [UserCode] varchar(32) NULL;
GO

DECLARE @var12 sysname;
SELECT @var12 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Call]') AND [c].[name] = N'Url');
IF @var12 IS NOT NULL EXEC(N'ALTER TABLE [Call] DROP CONSTRAINT [' + @var12 + '];');
ALTER TABLE [Call] ALTER COLUMN [Url] nvarchar(500) NULL;
GO

DECLARE @var13 sysname;
SELECT @var13 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Call]') AND [c].[name] = N'Status');
IF @var13 IS NOT NULL EXEC(N'ALTER TABLE [Call] DROP CONSTRAINT [' + @var13 + '];');
ALTER TABLE [Call] ALTER COLUMN [Status] varchar(32) NULL;
GO

DECLARE @var14 sysname;
SELECT @var14 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Call]') AND [c].[name] = N'GroupCallCode');
IF @var14 IS NOT NULL EXEC(N'ALTER TABLE [Call] DROP CONSTRAINT [' + @var14 + '];');
ALTER TABLE [Call] ALTER COLUMN [GroupCallCode] varchar(32) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230427173845_fix', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230428040757_fix_nullableV1', N'7.0.4');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20230428041931_fix_nullableV2', N'7.0.4');
GO

COMMIT;
GO

