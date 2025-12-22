/* =========================================================
   Minimal MAG-Control DB (stateless) — MSSQL Create Script
   Tables:
     - device
     - zone
     - users
     - user_zones   (user↔zone mapping)
   Notes:
     - No FKs (all relations handled in app logic)
     - Minimal indexing: only UNIQUE constraints where required
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
    [tag]    NVARCHAR(64)       NULL,

    CONSTRAINT UQ_zone_name UNIQUE ([name])
  );
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
    [tag]      NVARCHAR(64)       NULL,

    CONSTRAINT UQ_users_username UNIQUE ([username])
  );
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
    [blob]     VARCHAR(512)       NOT NULL,   -- rc-code-req blob (hex)
    [zone]     INT                NULL,       -- no FK; handled in app logic
    [isOnline] BIT                NOT NULL CONSTRAINT DF_device_isOnline DEFAULT (0),
    [tag]      NVARCHAR(64)       NULL,
    [label]    NVARCHAR(128)      NULL,

    CONSTRAINT UQ_device_name    UNIQUE ([name]),
    CONSTRAINT UQ_device_ip UNIQUE ([ip]),
    CONSTRAINT UQ_device_blob    UNIQUE ([blob])
  );
END
GO


-- user_zones (user_id, zone_id mapping; no FKs)
IF OBJECT_ID(N'dbo.[user_zones]', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.[user_zones] (
    [id]      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_zones PRIMARY KEY,
    [user_id] INT                NOT NULL,
    [zone_id] INT                NOT NULL,
    [label]   NVARCHAR(128)      NULL,
    [tag]     NVARCHAR(64)       NULL,

    CONSTRAINT UQ_user_zones_user_zone UNIQUE ([user_id], [zone_id])
  );
END
GO
