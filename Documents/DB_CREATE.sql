/* =========================================================
   Minimal MAG-Control DB (stateless) — MSSQL Create Script
   Tables (as in your diagram):
     - device
     - zone
     - users
     - user_zones   (user↔zone mapping)
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
   2) Create tables
   ======================= */

-- zone
IF OBJECT_ID(N'dbo.[zone]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[zone] (
    [id]     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_zone PRIMARY KEY,
    [name]   NVARCHAR(64)       NOT NULL,
    [layout] NVARCHAR(MAX)      NULL,         -- JSON/string layout if you want
    [label]  NVARCHAR(128)      NULL,
    [tag]    NVARCHAR(64)       NULL
  );

  -- unique zone name (optional but recommended)
  CREATE UNIQUE INDEX UX_zone_name ON dbo.[zone]([name]);
END
GO


-- users
IF OBJECT_ID(N'dbo.[users]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[users] (
    [id]       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
    [username] NVARCHAR(64)       NOT NULL,
    [password] NVARCHAR(255)      NOT NULL,   -- store HASH, not plain text
    [role]     NVARCHAR(32)       NOT NULL CONSTRAINT DF_users_role DEFAULT N'operator',
    [label]    NVARCHAR(128)      NULL,
    [tag]      NVARCHAR(64)       NULL
  );

  CREATE UNIQUE INDEX UX_users_username ON dbo.[users]([username]);
END
GO


-- device
IF OBJECT_ID(N'dbo.[device]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[device] (
    [id]       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_device PRIMARY KEY,
    [name]     NVARCHAR(64)       NOT NULL,
    [ip]       VARCHAR(45)        NOT NULL,   -- IPv4/IPv6
    [port]     INT                NOT NULL,
    [blob]     NVARCHAR(MAX)      NULL,       -- rc-code-req blob (hex/base64/etc)
    [zone]     INT                NULL,       -- FK to zone.id (your "zone" column)
    [isOnline] BIT                NOT NULL CONSTRAINT DF_device_isOnline DEFAULT (0),
    [tag]      NVARCHAR(64)       NULL,
    [label]    NVARCHAR(128)      NULL
  );

  -- Helpful indexes
  CREATE UNIQUE INDEX UX_device_ipPort ON dbo.[device]([ip],[port]);
  CREATE INDEX IX_device_zone ON dbo.[device]([zone]);

  -- FK (optional but recommended)
  ALTER TABLE dbo.[device]
    ADD CONSTRAINT FK_device_zone
    FOREIGN KEY ([zone]) REFERENCES dbo.[zone]([id]);
END
GO


-- user_zones (by your columns: user_id, zone_id)
IF OBJECT_ID(N'dbo.[user_zones]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[user_zones] (
    [id]      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_zones PRIMARY KEY,
    [user_id] INT                NOT NULL,
    [zone_id] INT                NOT NULL,
    [label]   NVARCHAR(128)      NULL,
    [tag]     NVARCHAR(64)       NULL
  );

  -- FKs
  ALTER TABLE dbo.[user_zones]
    ADD CONSTRAINT FK_user_zones_user
    FOREIGN KEY ([user_id]) REFERENCES dbo.[users]([id]);

  ALTER TABLE dbo.[user_zones]
    ADD CONSTRAINT FK_user_zones_zone
    FOREIGN KEY ([zone_id]) REFERENCES dbo.[zone]([id]);

  -- Prevent duplicates: same user assigned to same zone twice
  CREATE UNIQUE INDEX UX_user_zones_user_zone
    ON dbo.[user_zones]([user_id],[zone_id]);

  CREATE INDEX IX_user_zones_zone
    ON dbo.[user_zones]([zone_id]);
END
GO
