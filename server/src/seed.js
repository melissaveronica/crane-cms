import bcrypt from 'bcrypt';
import pool from './db.js';
import { nextOrderNo } from './lib/orderNo.js';
import { nextInvoiceNo } from './lib/invoiceNo.js';

const PASSWORD = 'password123';

const ROLE_USERS = [
  { email: 'admin@crane.test',     role: 'admin' },
  { email: 'sales@crane.test',     role: 'sales' },
  { email: 'finance@crane.test',   role: 'finance' },
  { email: 'operation@crane.test', role: 'operation' },
  { email: 'customer@crane.test',  role: 'customer' },
];

// Real-sounding companies instead of "Client 1, Client 2…" so the seed
// data actually looks like something a reviewer would believe.
const CLIENTS = [
  { company: 'PT Ganda Sentosa Konstruksi',     pic: 'Bambang Wirawan',          industry: 'Construction' },
  { company: 'PT Kencana Marine Works',         pic: 'Hendra Kusuma',            industry: 'Marine' },
  { company: 'PT Petro Nusantara Engineering',  pic: 'Siti Rahmawati',           industry: 'Oil & Gas' },
  { company: 'PT Selatan Logistik Jaya',        pic: 'Muhammad Rizky Pratama',   industry: 'Logistics' },
  { company: 'PT Menara Jaya Builders',         pic: 'Andi Setiawan',            industry: 'Construction' },
  { company: 'PT Perkasa Fabrikasi Baja',       pic: 'Dewi Anggraini',           industry: 'Manufacturing' },
  { company: 'PT Timur Jauh Shipyard',          pic: 'Agus Salim Nasution',      industry: 'Marine' },
  { company: 'PT Bintang Emas Development',     pic: 'Ratna Sari Dewi',          industry: 'Construction' },
  { company: 'PT Global Energi Resources',      pic: 'Yusuf Maulana',            industry: 'Oil & Gas' },
  { company: 'PT Cahaya Baru Pergudangan',      pic: 'Linda Kartika',            industry: 'Logistics' },
  { company: 'PT Pantai Indah Infrastruktur',   pic: 'Fajar Nugroho',            industry: 'Construction' },
  { company: 'PT Union Industri Berat',         pic: 'Hendro Wijaya',            industry: 'Manufacturing' },
  { company: 'PT Delta Petrokimia Services',    pic: 'Rina Marlina',             industry: 'Oil & Gas' },
  { company: 'PT Harmoni Pelabuhan Nusantara',  pic: 'Iwan Setiabudi',           industry: 'Marine' },
  { company: 'PT Nusa Prima Freight',           pic: 'Yulianto Saputra',         industry: 'Logistics' },
];

const PROJECTS = [
  { name: 'Simpang Susun Semanggi Girder Lift', location: 'Semanggi, Jakarta Selatan' },
  { name: 'Kilang Balongan Module Installation', location: 'Balongan, Indramayu' },
  { name: 'Tanjung Priok Container Yard Crane Setup', location: 'Tanjung Priok, Jakarta Utara' },
  { name: 'Menara BCA Annexe Steel Erection', location: 'Thamrin, Jakarta Pusat' },
  { name: 'Kilang Cilacap Vessel Lift', location: 'Cilacap, Jawa Tengah' },
  { name: 'Jembatan Suramadu Maintenance Lift', location: 'Suramadu, Surabaya' },
  { name: 'Citra Raya Mixed Development', location: 'Citra Raya, Tangerang' },
  { name: 'Terminal LNG Bontang Tank Roof Lift', location: 'Bontang, Kalimantan Timur' },
  { name: 'MRT Jakarta Fase 2 Box Girder Segment', location: 'Bundaran HI, Jakarta Pusat' },
  { name: 'Pelabuhan Tanjung Perak Ship-to-Shore Crane', location: 'Tanjung Perak, Surabaya' },
  { name: 'Kawasan Industri Karawang Tower Lift', location: 'Karawang, Jawa Barat' },
  { name: 'Pelindo Makassar Marine Structure Assembly', location: 'Pelabuhan Makassar, Sulawesi Selatan' },
  { name: 'Kilang Balikpapan Terminal Turnaround', location: 'Balikpapan, Kalimantan Timur' },
  { name: 'Gudang Cikarang Roof Truss Lift', location: 'Cikarang, Bekasi' },
  { name: 'Depo Logistik Medan Module Handling', location: 'Belawan, Medan' },
  { name: 'Gardu Induk Gresik Transformer Lift', location: 'Gresik, Jawa Timur' },
  { name: 'Sirkuit Mandalika Grandstand Erection', location: 'Mandalika, Lombok' },
  { name: 'Pelabuhan Batam Expansion Crane Assembly', location: 'Batu Ampar, Batam' },
  { name: 'Data Center BSD City Cooling Tower Lift', location: 'BSD City, Tangerang Selatan' },
  { name: 'Bandara Juanda Terminal Steelwork', location: 'Juanda, Surabaya' },
  { name: 'Marina Nongsa Jetty Installation', location: 'Nongsa, Batam' },
  { name: 'Pabrik Semen Gresik Silo Erection', location: 'Gresik, Jawa Timur' },
  { name: 'Stasiun LRT Palembang Beam Lift', location: 'Jakabaring, Palembang' },
  { name: 'Hotel Waterfront Manado Facade Panel Lift', location: 'Manado, Sulawesi Utara' },
  { name: 'Pergudangan Sidoarjo Rack Installation', location: 'Sidoarjo, Jawa Timur' },
];

const CRANE_TYPES = ['Tower Crane', 'Mobile Crane', 'Crawler Crane', 'Rough Terrain Crane', 'All Terrain Crane'];
const SITE_NOTES = [
  'Soft soil, matting required for outriggers',
  'Congested urban site, night lift permit obtained',
  'Coastal site, corrosion-resistant rigging used',
  'Elevated platform, wind speed monitored throughout',
  'Confined access, mobile crane only, escort vehicle arranged',
  'Standard ground bearing capacity, no special measures',
];
const ORDER_STATUSES = ['pending', 'review', 'quotation', 'approved', 'running', 'completed', 'rejected'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dp = 2) => Number((Math.random() * (max - min) + min).toFixed(dp));

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Clearing existing data…');
    await client.query('TRUNCATE activity_logs, invoices, order_attachments, orders, clients, users RESTART IDENTITY CASCADE');

    const hash = await bcrypt.hash(PASSWORD, 10);

    console.log('Creating role users…');
    const userIds = {};
    for (const u of ROLE_USERS) {
      const { rows: [row] } = await client.query(
        `INSERT INTO users (email, password_hash, role, status) VALUES ($1,$2,$3,'approved') RETURNING id`,
        [u.email, hash, u.role]
      );
      userIds[u.role] = row.id;
    }

    console.log('Creating clients…');
    const clientIds = [];
    for (let i = 0; i < CLIENTS.length; i++) {
      const c = CLIENTS[i];
      const isFirst = i === 0; // link the seeded customer login to the first company
      const slug = c.company.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
      const { rows: [row] } = await client.query(
        `INSERT INTO clients (user_id, company_name, registration_no, pic_name, phone, email, address, industry, payment_terms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [
          isFirst ? userIds.customer : null,
          c.company,
          `AHU-${randInt(10000, 99999)}.${rand(['AH', 'PT', 'TI'])}.${randInt(2018, 2024)}`,
          c.pic,
          `08${randInt(11, 99)}-${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
          `info@${slug}.co.id`,
          rand(PROJECTS).location,
          c.industry,
          rand(['NET30', 'NET60', 'COD']),
        ]
      );
      clientIds.push(row.id);
    }

    console.log('Creating orders across every status…');
    const orderRows = [];
    for (let i = 0; i < PROJECTS.length; i++) {
      const p = PROJECTS[i];
      const status = ORDER_STATUSES[i % ORDER_STATUSES.length];
      const clientId = rand(clientIds);
      const orderNo = await nextOrderNo(client);
      const startDate = new Date(2026, randInt(0, 11), randInt(1, 20));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + randInt(3, 25));

      const { rows: [order] } = await client.query(
        `INSERT INTO orders (order_no, client_id, project_name, location, start_date, end_date,
                             crane_type, capacity_tonnes, load_weight_kg, lift_height_m,
                             site_condition, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          orderNo, clientId, p.name, p.location,
          startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10),
          rand(CRANE_TYPES), randFloat(15, 350, 1), randInt(2000, 80000), randFloat(12, 95, 1),
          rand(SITE_NOTES), status, userIds.sales,
        ]
      );
      orderRows.push(order);
    }

    console.log('Creating invoices for approved/running/completed orders…');
    const invoiceable = orderRows.filter((o) => ['approved', 'running', 'completed'].includes(o.status));
    const invoiceStatusCycle = ['draft', 'sent', 'partial', 'overdue', 'paid'];
    for (let i = 0; i < invoiceable.length; i++) {
      const order = invoiceable[i];
      const invoiceNo = await nextInvoiceNo(client);
      const baseAmount = randFloat(8000, 60000, 2);
      const otHours = rand([0, 0, 4, 8, 12]);
      const otRate = otHours ? randFloat(80, 150, 2) : 0;
      const weekendDays = rand([0, 0, 1, 2]);
      const weekendRate = weekendDays ? randFloat(400, 900, 2) : 0;
      const additionalCharges = randFloat(0, 1500, 2);
      const discount = randFloat(0, 800, 2);
      const taxPercent = 6;
      const subtotal = baseAmount + otHours * otRate + weekendDays * weekendRate + additionalCharges - discount;
      const taxAmount = Number((subtotal * (taxPercent / 100)).toFixed(2));
      const totalAmount = Number((subtotal + taxAmount).toFixed(2));
      const status = invoiceStatusCycle[i % invoiceStatusCycle.length];
      const paidAmount = status === 'paid' ? totalAmount
        : status === 'partial' ? Number((totalAmount * randFloat(0.3, 0.7, 2)).toFixed(2))
        : 0;
      const dueDate = new Date(order.end_date);
      dueDate.setDate(dueDate.getDate() + 30);

      await client.query(
        `INSERT INTO invoices (invoice_no, order_id, client_id, base_amount, ot_hours, ot_rate,
                               weekend_days, weekend_rate, additional_charges, discount, tax_percent,
                               subtotal, tax_amount, total_amount, paid_amount, status, due_date, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [invoiceNo, order.id, order.client_id, baseAmount, otHours, otRate, weekendDays, weekendRate,
         additionalCharges, discount, taxPercent, subtotal.toFixed(2), taxAmount, totalAmount, paidAmount,
         status, dueDate.toISOString().slice(0, 10), userIds.finance]
      );
    }

    await client.query('COMMIT');
    console.log(`Seed complete: ${CLIENTS.length} clients, ${orderRows.length} orders, ${invoiceable.length} invoices.`);
    console.log('\nLogin table:');
    console.log('| Role      | Email                    | Password    |');
    console.log('|-----------|--------------------------|-------------|');
    for (const u of ROLE_USERS) {
      console.log(`| ${u.role.padEnd(9)} | ${u.email.padEnd(24)} | ${PASSWORD} |`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
