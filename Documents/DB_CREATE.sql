/* =========================================================
   MAG-Control DB — MSSQL Create Script (DEV friendly)
   Version: v0.7.0 (Step 1 - schema)
   Tables:
     - categories
     - zones
     - users
     - user_zones
     - devices

   Notes:
     - DEV script: drops & recreates DB
     - Includes FKs (delete will fail if referenced)
   ========================================================= */

-- 1) Create DB
CREATE DATABASE mag_control;
GO

USE mag_control;
GO

/* =======================
   2) Create tables
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

-- zones
CREATE TABLE dbo.zones (
  id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_zones PRIMARY KEY,
  name        NVARCHAR(64)       NOT NULL,
  category_id INT                NOT NULL,
  layout      NVARCHAR(MAX)      NULL,         -- JSON/string layout (optional)
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

-- devices
CREATE TABLE dbo.devices (
  id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_devices PRIMARY KEY,
  name        NVARCHAR(64)       NOT NULL,
  ip          VARCHAR(45)        NOT NULL,     -- IPv4/IPv6
  category_id INT                NOT NULL,
  zone_id     INT                NOT NULL,
  isOnline    BIT                NOT NULL CONSTRAINT DF_devices_isOnline DEFAULT (0),
  tag         NVARCHAR(64)       NULL,
  label       NVARCHAR(128)      NULL,

  CONSTRAINT UQ_devices_name UNIQUE (name),
  CONSTRAINT UQ_devices_ip   UNIQUE (ip),

  CONSTRAINT FK_devices_category FOREIGN KEY (category_id)
    REFERENCES dbo.categories(id),

  CONSTRAINT FK_devices_zone FOREIGN KEY (zone_id)
    REFERENCES dbo.zones(id)
);
GO

/* =======================
   3) Helpful indexes
   ======================= */
CREATE INDEX IX_zones_category_id ON dbo.zones(category_id);
CREATE INDEX IX_devices_zone_id   ON dbo.devices(zone_id);
CREATE INDEX IX_devices_category_id ON dbo.devices(category_id);
CREATE INDEX IX_user_zones_user_id ON dbo.user_zones(user_id);
CREATE INDEX IX_user_zones_zone_id ON dbo.user_zones(zone_id);
GO
