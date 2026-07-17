CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer'
                CHECK (role IN ('admin','sales','finance','operation','customer')),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  company_name    VARCHAR(255) NOT NULL,
  registration_no VARCHAR(100) UNIQUE NOT NULL,
  pic_name        VARCHAR(255) NOT NULL,
  phone           VARCHAR(50)  NOT NULL,
  email           VARCHAR(255) NOT NULL,
  address         TEXT         NOT NULL,
  industry        VARCHAR(100),
  payment_terms   VARCHAR(50) DEFAULT 'NET30',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id             SERIAL PRIMARY KEY,
  order_no       VARCHAR(30) UNIQUE NOT NULL,
  client_id      INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_name   VARCHAR(255) NOT NULL,
  location       TEXT NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  crane_type     VARCHAR(100) NOT NULL,
  capacity_tonnes NUMERIC(10,2),
  load_weight_kg  NUMERIC(10,2),
  lift_height_m   NUMERIC(10,2),
  site_condition  TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','review','quotation','approved','running','completed','rejected')),
  created_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE TABLE order_attachments (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_path     VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100),
  size_bytes    INTEGER,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INTEGER,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id                 SERIAL PRIMARY KEY,
  invoice_no         VARCHAR(30) UNIQUE NOT NULL,
  order_id           INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id          INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  base_amount        NUMERIC(12,2) NOT NULL,
  ot_hours           NUMERIC(6,2)  NOT NULL DEFAULT 0,
  ot_rate            NUMERIC(10,2) NOT NULL DEFAULT 0,
  weekend_days       NUMERIC(6,2)  NOT NULL DEFAULT 0,
  weekend_rate       NUMERIC(10,2) NOT NULL DEFAULT 0,
  additional_charges NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_percent        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  subtotal           NUMERIC(12,2) NOT NULL,
  tax_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount       NUMERIC(12,2) NOT NULL,
  paid_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  status             VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','sent','paid','partial','overdue')),
  due_date           DATE NOT NULL,
  notes              TEXT,
  created_by         INTEGER REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_company ON clients(company_name);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_client   ON orders(client_id);
CREATE INDEX idx_logs_created    ON activity_logs(created_at DESC);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_order  ON invoices(order_id);
