/* =========================================================
   MAG-Control DB — MSSQL Create Script (v1.3.0)

   Notes:
   - Intended for DEV reset (DROP/CREATE is OK).
   - Seeds channels_map with 1..64 if empty.
   ========================================================= */

-- 1) Create DB (if not exists)
IF DB_ID(N'mag_control') IS NULL
BEGIN
  CREATE DATABASE [mag_control];
END
GO

USE [mag_control];
GO

/* =======================
   2) Drop tables (safe dev reset)
   ======================= */

IF OBJECT_ID(N'dbo.[user_zones]', N'U') IS NOT NULL DROP TABLE dbo.[user_zones];
IF OBJECT_ID(N'dbo.[devices]', N'U') IS NOT NULL DROP TABLE dbo.[devices];
IF OBJECT_ID(N'dbo.[zones]', N'U') IS NOT NULL DROP TABLE dbo.[zones];
IF OBJECT_ID(N'dbo.[categories]', N'U') IS NOT NULL DROP TABLE dbo.[categories];
IF OBJECT_ID(N'dbo.[channels_map]', N'U') IS NOT NULL DROP TABLE dbo.[channels_map];
IF OBJECT_ID(N'dbo.[users]', N'U') IS NOT NULL DROP TABLE dbo.[users];
GO

/* =======================
   3) Create tables
   ======================= */

-- Categories
CREATE TABLE dbo.[categories] (
  [id]   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_categories PRIMARY KEY,
  [name] NVARCHAR(64) NOT NULL
);
GO

-- Zones
CREATE TABLE dbo.[zones] (
  [id]          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_zones PRIMARY KEY,
  [name]        NVARCHAR(64) NOT NULL,
  [category_id] INT NOT NULL
);
GO

ALTER TABLE dbo.[zones]
  ADD CONSTRAINT FK_zones_category
  FOREIGN KEY ([category_id]) REFERENCES dbo.[categories]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Devices
CREATE TABLE dbo.[devices] (
  [id]        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_devices PRIMARY KEY,
  [name]      NVARCHAR(64) NOT NULL,
  [ip]        NVARCHAR(64) NOT NULL,
  [zone_id]   INT NOT NULL,
  [pos_index] INT NULL,
  [isOnline]  BIT NOT NULL CONSTRAINT DF_devices_isOnline DEFAULT(0),
  [tag]       NVARCHAR(64) NULL,
  [label]     NVARCHAR(64) NULL
);
GO

ALTER TABLE dbo.[devices]
  ADD CONSTRAINT FK_devices_zone
  FOREIGN KEY ([zone_id]) REFERENCES dbo.[zones]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- pos_index 0..11 when not null
ALTER TABLE dbo.[devices]
  ADD CONSTRAINT CK_devices_pos_index
  CHECK ([pos_index] IS NULL OR ([pos_index] >= 0 AND [pos_index] <= 11));
GO

-- Unique position per zone (only when pos_index is NOT NULL)
CREATE UNIQUE INDEX UX_devices_zone_pos
ON dbo.[devices]([zone_id], [pos_index])
WHERE [pos_index] IS NOT NULL;
GO

-- Users
CREATE TABLE dbo.[users] (
  [id]       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
  [username] NVARCHAR(64) NOT NULL,
  [password] NVARCHAR(256) NOT NULL,
  [role]     NVARCHAR(16) NOT NULL,
  [label]    NVARCHAR(64) NULL,
  [tag]      NVARCHAR(64) NULL
);
GO

CREATE UNIQUE INDEX UX_users_username
ON dbo.[users]([username]);
GO

-- User ↔ Zones mapping
CREATE TABLE dbo.[user_zones] (
  [user_id] INT NOT NULL,
  [zone_id] INT NOT NULL,
  CONSTRAINT PK_user_zones PRIMARY KEY ([user_id], [zone_id])
);
GO

ALTER TABLE dbo.[user_zones]
  ADD CONSTRAINT FK_user_zones_user
  FOREIGN KEY ([user_id]) REFERENCES dbo.[users]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.[user_zones]
  ADD CONSTRAINT FK_user_zones_zone
  FOREIGN KEY ([zone_id]) REFERENCES dbo.[zones]([id])
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Channels map
CREATE TABLE dbo.[channels_map] (
  [channel_number] INT NOT NULL CONSTRAINT PK_channels_map PRIMARY KEY,
  [name]           NVARCHAR(64) NULL
);
GO

ALTER TABLE dbo.[channels_map]
  ADD CONSTRAINT CK_channels_map_number
  CHECK ([channel_number] >= 1 AND [channel_number] <= 64);
GO

/* =======================
   4) Seed data
   ======================= */

-- Seed channels 1..64 if empty
IF NOT EXISTS (SELECT 1 FROM dbo.[channels_map])
BEGIN
  DECLARE @i INT = 1;
  WHILE @i <= 64
  BEGIN
    INSERT INTO dbo.[channels_map] (channel_number, name) VALUES (@i, NULL);
    SET @i = @i + 1;
  END
END
GO

/* =========================================================
   End of script
   ========================================================= */
