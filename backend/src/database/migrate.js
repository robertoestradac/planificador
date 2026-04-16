require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');

const schema = `
-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  subdomain     VARCHAR(100)  NOT NULL UNIQUE,
  custom_domain VARCHAR(255)  NULL,
  status        ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME      NULL,
  INDEX idx_subdomain (subdomain),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  tenant_id  VARCHAR(36)  NULL,
  name       VARCHAR(100) NOT NULL,
  is_global  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  UNIQUE KEY uq_role_tenant (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)   NOT NULL PRIMARY KEY,
  tenant_id     VARCHAR(36)   NULL,
  role_id       VARCHAR(36)   NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  totp_secret   VARCHAR(255)  NULL,
  totp_enabled  TINYINT(1)    NOT NULL DEFAULT 0,
  status        ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME      NULL,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_email (email),
  INDEX idx_role_id (role_id),
  UNIQUE KEY uq_email_tenant (tenant_id, email),
  FOREIGN KEY fk_users_tenant (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  FOREIGN KEY fk_users_role (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  revoked    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  FOREIGN KEY fk_rt_user (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  key_name    VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ROLE_PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY fk_rp_role (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY fk_rp_perm (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id          VARCHAR(36)    NOT NULL PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  price_usd   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  price_gtq   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  max_events  INT            NULL COMMENT 'NULL = unlimited',
  max_guests  INT            NULL COMMENT 'NULL = unlimited',
  max_users   INT            NULL COMMENT 'NULL = unlimited',
  is_active   TINYINT(1)     NOT NULL DEFAULT 1,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN_PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_permissions (
  plan_id       VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (plan_id, permission_id),
  FOREIGN KEY fk_pp_plan (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
  FOREIGN KEY fk_pp_perm (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  tenant_id  VARCHAR(36)  NOT NULL,
  plan_id    VARCHAR(36)  NOT NULL,
  starts_at  DATETIME     NOT NULL,
  expires_at DATETIME     NOT NULL,
  status     ENUM('active','expired','cancelled','trial') NOT NULL DEFAULT 'active',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_status (status),
  FOREIGN KEY fk_sub_tenant (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY fk_sub_plan (plan_id) REFERENCES plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  preview_image VARCHAR(500) NULL,
  base_json     LONGTEXT     NULL,
  category      VARCHAR(100) NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_by    VARCHAR(36)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  tenant_id  VARCHAR(36)  NOT NULL,
  name       VARCHAR(255) NOT NULL,
  date       DATETIME     NOT NULL,
  location   VARCHAR(500) NULL,
  map_url    VARCHAR(500) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME     NULL,
  INDEX idx_tenant_id (tenant_id),
  FOREIGN KEY fk_events_tenant (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVITATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  tenant_id    VARCHAR(36)  NOT NULL,
  event_id     VARCHAR(36)  NOT NULL,
  template_id  VARCHAR(36)  NULL,
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL,
  builder_json LONGTEXT     NULL,
  html         LONGTEXT     NULL,
  css          LONGTEXT     NULL,
  status       ENUM('draft','published') NOT NULL DEFAULT 'draft',
  published_at DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME     NULL,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_slug (slug),
  UNIQUE KEY uq_slug (slug),
  UNIQUE KEY uq_event_invitation (event_id, deleted_at) COMMENT '1 invitation per event (soft-delete aware)',
  FOREIGN KEY fk_inv_tenant (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY fk_inv_event (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY fk_inv_template (template_id) REFERENCES templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVITATION_VIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS invitation_views (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  invitation_id VARCHAR(36)  NOT NULL,
  ip            VARCHAR(45)  NULL,
  device        VARCHAR(255) NULL,
  country       VARCHAR(100) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invitation_id (invitation_id),
  FOREIGN KEY fk_iv_invitation (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS guests (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  invitation_id VARCHAR(36)  NOT NULL,
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(50)  NULL,
  email         VARCHAR(255) NULL,
  status        ENUM('pending','confirmed','declined') NOT NULL DEFAULT 'pending',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invitation_id (invitation_id),
  INDEX idx_email (email),
  FOREIGN KEY fk_guests_inv (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RSVPS
-- ============================================================
CREATE TABLE IF NOT EXISTS rsvps (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  guest_id     VARCHAR(36)  NOT NULL UNIQUE,
  response     ENUM('confirmed','declined','maybe') NOT NULL,
  message      TEXT         NULL,
  confirmed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY fk_rsvp_guest (guest_id) REFERENCES guests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EVENT PHOTOS (guest-uploaded photos)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_photos (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  invitation_id VARCHAR(36)  NOT NULL,
  uploader_name VARCHAR(255) NULL,
  photo_url     VARCHAR(500) NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invitation_id (invitation_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY fk_ep_invitation (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EVENT PLANS (planificador de eventos)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_plans (
  id           VARCHAR(36)   NOT NULL PRIMARY KEY,
  event_id     VARCHAR(36)   NOT NULL,
  tenant_id    VARCHAR(36)   NOT NULL,
  event_type   ENUM('boda','xv_anos','baby_shower','graduacion','corporativo','cumpleanos','bautizo','otro') NOT NULL DEFAULT 'otro',
  budget_total DECIMAL(12,2) NULL,
  notes        TEXT          NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_plan_event (event_id),
  INDEX idx_tenant_id (tenant_id),
  FOREIGN KEY fk_ep_event (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY fk_ep_tenant (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN TASKS (checklist)
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_tasks (
  id         VARCHAR(36)   NOT NULL PRIMARY KEY,
  plan_id    VARCHAR(36)   NOT NULL,
  category   VARCHAR(100)  NOT NULL DEFAULT 'Otros',
  title      VARCHAR(255)  NOT NULL,
  due_date   DATE          NULL,
  assignee   VARCHAR(255)  NULL,
  status     ENUM('pendiente','en_progreso','completado') NOT NULL DEFAULT 'pendiente',
  notes      TEXT          NULL,
  sort_order INT           NOT NULL DEFAULT 0,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_id (plan_id),
  INDEX idx_status (status),
  FOREIGN KEY fk_pt_plan (plan_id) REFERENCES event_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN BUDGET ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_budget_items (
  id             VARCHAR(36)   NOT NULL PRIMARY KEY,
  plan_id        VARCHAR(36)   NOT NULL,
  category       VARCHAR(100)  NOT NULL DEFAULT 'Otros',
  name           VARCHAR(255)  NOT NULL,
  estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_cost    DECIMAL(12,2) NULL,
  payment_status ENUM('pendiente','anticipo','pagado') NOT NULL DEFAULT 'pendiente',
  notes          TEXT          NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_id (plan_id),
  FOREIGN KEY fk_pbi_plan (plan_id) REFERENCES event_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN VENDORS (proveedores)
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_vendors (
  id      VARCHAR(36)   NOT NULL PRIMARY KEY,
  plan_id VARCHAR(36)   NOT NULL,
  service VARCHAR(100)  NOT NULL,
  name    VARCHAR(255)  NOT NULL,
  phone   VARCHAR(50)   NULL,
  email   VARCHAR(255)  NULL,
  price   DECIMAL(12,2) NULL,
  status  ENUM('contactado','cotizado','contratado','pagado') NOT NULL DEFAULT 'contactado',
  website VARCHAR(500)  NULL,
  notes   TEXT          NULL,
  created_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_id (plan_id),
  FOREIGN KEY fk_pv_plan (plan_id) REFERENCES event_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN TIMELINE ITEMS (cronograma del día)
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_timeline_items (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  plan_id    VARCHAR(36)  NOT NULL,
  start_time TIME         NOT NULL,
  end_time   TIME         NULL,
  activity   VARCHAR(255) NOT NULL,
  assignee   VARCHAR(255) NULL,
  notes      TEXT         NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_id (plan_id),
  FOREIGN KEY fk_pti_plan (plan_id) REFERENCES event_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN CALENDAR ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_calendar_entries (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  plan_id      VARCHAR(36)  NOT NULL,
  title        VARCHAR(255) NOT NULL,
  type         ENUM('nota','alerta') NOT NULL DEFAULT 'nota',
  date         DATE         NOT NULL,
  description  TEXT         NULL,
  dismissed_at DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_id (plan_id),
  INDEX idx_date (date),
  INDEX idx_type_dismissed (type, dismissed_at),
  FOREIGN KEY fk_pce_plan (plan_id) REFERENCES event_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN SEATING TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_seating_tables (
  id             VARCHAR(36)  NOT NULL PRIMARY KEY,
  plan_id        VARCHAR(36)  NOT NULL,
  table_number   INT          NOT NULL,
  seat_count     INT          NOT NULL DEFAULT 4,
  is_bride_table TINYINT(1)   NOT NULL DEFAULT 0,
  position_x     DECIMAL(8,2) NOT NULL DEFAULT 0,
  position_y     DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_id (plan_id),
  UNIQUE KEY uq_table_number_plan (plan_id, table_number),
  FOREIGN KEY fk_pst_plan (plan_id) REFERENCES event_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN SEATS
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_seats (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  table_id   VARCHAR(36) NOT NULL,
  seat_index INT         NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_table_id (table_id),
  UNIQUE KEY uq_seat_index_table (table_id, seat_index),
  FOREIGN KEY fk_ps_table (table_id) REFERENCES plan_seating_tables(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PLAN SEAT ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_seat_assignments (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  seat_id    VARCHAR(36) NOT NULL UNIQUE,
  guest_id   VARCHAR(36) NOT NULL,
  plan_id    VARCHAR(36) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_plan_id (plan_id),
  INDEX idx_guest_id (guest_id),
  FOREIGN KEY fk_psa_seat  (seat_id)  REFERENCES plan_seats(id) ON DELETE CASCADE,
  FOREIGN KEY fk_psa_guest (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
  FOREIGN KEY fk_psa_plan  (plan_id)  REFERENCES event_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- APP SETTINGS (singleton row, id = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id            INT           NOT NULL PRIMARY KEY DEFAULT 1,
  app_name      VARCHAR(255)  NOT NULL DEFAULT 'InvitApp',
  tagline       VARCHAR(500)  NULL,
  logo_url      VARCHAR(500)  NULL,
  app_url       VARCHAR(500)  NULL,
  support_email VARCHAR(255)  NULL,
  footer_text   VARCHAR(500)  NULL DEFAULT 'Hecha con \u2665 por InvitApp',
  show_branding    TINYINT(1)    NOT NULL DEFAULT 1,
  landing_content  LONGTEXT      NULL,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO app_settings (id, app_name, tagline, footer_text, show_branding)
VALUES (1, 'InvitApp', 'Plataforma de invitaciones digitales', 'Hecha con \u2665 por InvitApp', 1);

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS landing_content  LONGTEXT     NULL;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS sales_whatsapp  VARCHAR(30)  NULL;
ALTER TABLE plans         ADD COLUMN IF NOT EXISTS duration_months TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER max_users;

-- 2FA columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret  VARCHAR(255) NULL          AFTER password_hash;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled TINYINT(1)   NOT NULL DEFAULT 0 AFTER totp_secret;

-- ============================================================
-- Payments (credit-based plan purchases)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id            CHAR(36)       NOT NULL PRIMARY KEY,
  tenant_id     CHAR(36)       NOT NULL,
  plan_id       CHAR(36)       NOT NULL,
  amount        DECIMAL(10,2)  NOT NULL,
  currency      VARCHAR(3)     NOT NULL DEFAULT 'USD',
  method        ENUM('bank_transfer','payment_link') NOT NULL DEFAULT 'bank_transfer',
  status        ENUM('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
  reference     VARCHAR(255)   NULL COMMENT 'Número de referencia bancaria',
  notes         TEXT           NULL,
  confirmed_by  CHAR(36)       NULL,
  confirmed_at  DATETIME       NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_tenant  FOREIGN KEY (tenant_id)    REFERENCES tenants(id),
  CONSTRAINT fk_payments_plan    FOREIGN KEY (plan_id)      REFERENCES plans(id),
  CONSTRAINT fk_payments_admin   FOREIGN KEY (confirmed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add max_invitations to plans if not exists
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_invitations INT NULL AFTER max_events;
`;

async function migrate() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    console.log('Creating database if not exists...');
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${config.db.name}\``);

    console.log('Running migrations...');
    await conn.query(schema);
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
