/* =========================================================
   MAG-Control DB — MSSQL Create Script (DEV friendly)
   Version: v1.1.0 (device grid positions 6x2 per zone)
   Tables:
     - categories
     - zones
     - users
     - user_zones
     - devices

   Notes:
     - DEV script: drops & recreates DB
     - Category is assigned ONLY to zones.
     - Devices belong ONLY to zones.
   ========================================================= */

-- Drop DB (DEV)
IF DB_ID(N'mag_control') IS NOT NULL
BEGIN
  ALTER DATABASE mag_control SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE mag_control;
END
GO

-- Create DB
CREATE DATABASE mag_control;
GO

USE mag_control;
GO

/* =======================
   Create tables
   ======================= */

-- categories
CREATE TABLE dbo.categories (
  id    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_categories PRIMARY KEY,
  name  NVARCHAR(64)       NOT NULL,
  label NVARCHAR(128)      NULL,
  tag   NVARCHAR(64)       NULL,

  CONSTRAINT UQ_categories_name UNIQUE (name)
);
GO

-- zones (zone belongs to category)
CREATE TABLE dbo.zones (
  id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_zones PRIMARY KEY,
  name        NVARCHAR(64)       NOT NULL,
  category_id INT                NOT NULL,
  layout      NVARCHAR(MAX)      NULL,
  label       NVARCHAR(128)      NULL,
  tag         NVARCHAR(64)       NULL,

  CONSTRAINT UQ_zones_name UNIQUE (name),
  CONSTRAINT FK_zones_category FOREIGN KEY (category_id)
    REFERENCES dbo.categories(id)
);
GO

-- users
CREATE TABLE dbo.users (
  id       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
  username NVARCHAR(64)       NOT NULL,
  password NVARCHAR(255)      NOT NULL,   -- store HASH (bcrypt)
  role     NVARCHAR(32)       NOT NULL CONSTRAINT DF_users_role DEFAULT N'operator',
  label    NVARCHAR(128)      NULL,
  tag      NVARCHAR(64)       NULL,

  CONSTRAINT UQ_users_username UNIQUE (username)
);
GO

-- user_zones (user ↔ zone mapping)
CREATE TABLE dbo.user_zones (
  id      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_zones PRIMARY KEY,
  user_id INT                NOT NULL,
  zone_id INT                NOT NULL,
  label   NVARCHAR(128)      NULL,
  tag     NVARCHAR(64)       NULL,

  CONSTRAINT UQ_user_zones_user_zone UNIQUE (user_id, zone_id),
  CONSTRAINT FK_user_zones_user FOREIGN KEY (user_id)
    REFERENCES dbo.users(id),
  CONSTRAINT FK_user_zones_zone FOREIGN KEY (zone_id)
    REFERENCES dbo.zones(id)
);
GO

-- devices (device belongs only to zone; category derived via zone.category_id)
CREATE TABLE dbo.devices (
  id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_devices PRIMARY KEY,
  name        NVARCHAR(64)       NOT NULL,
  ip          VARCHAR(45)        NOT NULL,
  zone_id     INT                NOT NULL,
  pos_index   INT                NULL,   -- 0..11 (6x2 grid). NULL = unplaced (treated as disabled)
  isOnline    BIT                NOT NULL CONSTRAINT DF_devices_isOnline DEFAULT (0),
  tag         NVARCHAR(64)       NULL,
  label       NVARCHAR(128)      NULL,

  CONSTRAINT UQ_devices_name UNIQUE (name),
  CONSTRAINT UQ_devices_ip   UNIQUE (ip),

  CONSTRAINT CK_devices_pos_index_range CHECK (pos_index IS NULL OR (pos_index >= 0 AND pos_index <= 11)),

  CONSTRAINT FK_devices_zone FOREIGN KEY (zone_id)
    REFERENCES dbo.zones(id)
);
GO

-- Enforce single device per cell per zone (only when pos_index is set)
CREATE UNIQUE INDEX UX_devices_zone_pos
  ON dbo.devices(zone_id, pos_index)
  WHERE pos_index IS NOT NULL;
GO

/* =======================
   Helpful indexes
   ======================= */
CREATE INDEX IX_zones_category_id     ON dbo.zones(category_id);
CREATE INDEX IX_devices_zone_id       ON dbo.devices(zone_id);
CREATE INDEX IX_devices_zone_pos      ON dbo.devices(zone_id, pos_index);
CREATE INDEX IX_user_zones_user_id    ON dbo.user_zones(user_id);
CREATE INDEX IX_user_zones_zone_id    ON dbo.user_zones(zone_id);
GO
