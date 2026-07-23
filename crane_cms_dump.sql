--
-- PostgreSQL database dump
--

\restrict rcptNDQnwegFBD3mzcNn6lucsEkLi95GmxsAN0v1ORKbIO5NZOOjDh8XZXFbRZb

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    meta jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    user_id integer,
    company_name character varying(255) NOT NULL,
    registration_no character varying(100) NOT NULL,
    pic_name character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    address text NOT NULL,
    industry character varying(100),
    payment_terms character varying(50) DEFAULT 'NET30'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_no character varying(30) NOT NULL,
    order_id integer NOT NULL,
    client_id integer NOT NULL,
    base_amount numeric(12,2) NOT NULL,
    ot_hours numeric(6,2) DEFAULT 0 NOT NULL,
    ot_rate numeric(10,2) DEFAULT 0 NOT NULL,
    weekend_days numeric(6,2) DEFAULT 0 NOT NULL,
    weekend_rate numeric(10,2) DEFAULT 0 NOT NULL,
    additional_charges numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_percent numeric(5,2) DEFAULT 0 NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    due_date date NOT NULL,
    notes text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'paid'::character varying, 'partial'::character varying, 'overdue'::character varying])::text[])))
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: order_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_attachments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    file_path character varying(500) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(100),
    size_bytes integer,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_attachments_id_seq OWNED BY public.order_attachments.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_no character varying(30) NOT NULL,
    client_id integer NOT NULL,
    project_name character varying(255) NOT NULL,
    location text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    crane_type character varying(100) NOT NULL,
    capacity_tonnes numeric(10,2),
    load_weight_kg numeric(10,2),
    lift_height_m numeric(10,2),
    site_condition text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'review'::character varying, 'quotation'::character varying, 'approved'::character varying, 'running'::character varying, 'completed'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT valid_dates CHECK ((end_date >= start_date))
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'customer'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'sales'::character varying, 'finance'::character varying, 'operation'::character varying, 'customer'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: order_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attachments ALTER COLUMN id SET DEFAULT nextval('public.order_attachments_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, user_id, action, entity_type, entity_id, meta, created_at) FROM stdin;
1	1	login	user	1	{}	2026-07-17 16:22:46.776111+07
2	1	login	user	1	{}	2026-07-17 16:22:57.595126+07
3	1	login	user	1	{}	2026-07-17 16:42:58.107811+07
4	5	login	user	5	{}	2026-07-17 16:42:58.387061+07
5	1	create	order	26	{"order_no": "CR-202607-0026"}	2026-07-17 16:44:30.827875+07
6	\N	register	client	16	{"company": "Evil Corp"}	2026-07-17 16:45:04.55652+07
7	1	login	user	1	{}	2026-07-23 08:38:47.575154+07
8	1	login	user	1	{}	2026-07-23 08:39:46.431839+07
9	1	login	user	1	{}	2026-07-23 08:39:57.71272+07
10	1	login	user	1	{}	2026-07-23 08:43:04.409459+07
11	1	login	user	1	{}	2026-07-23 08:43:18.856589+07
12	5	login	user	5	{}	2026-07-23 08:43:19.595988+07
13	1	login	user	1	{}	2026-07-23 08:43:28.988085+07
14	1	login	user	1	{}	2026-07-23 09:58:18.543019+07
15	1	login	user	1	{}	2026-07-23 09:58:23.765756+07
16	1	login	user	1	{}	2026-07-23 09:58:29.322535+07
17	1	login	user	1	{}	2026-07-23 09:58:50.202942+07
18	1	login	user	1	{}	2026-07-23 09:59:24.983569+07
19	1	login	user	1	{}	2026-07-23 10:04:18.65536+07
20	1	login	user	1	{}	2026-07-23 10:04:28.34748+07
21	1	login	user	1	{}	2026-07-23 10:06:32.018441+07
22	1	login	user	1	{}	2026-07-23 10:07:07.794344+07
23	2	login	user	2	{}	2026-07-23 10:07:08.290449+07
24	1	login	user	1	{}	2026-07-23 10:09:53.090298+07
25	1	login	user	1	{}	2026-07-23 10:19:05.118566+07
26	1	login	user	1	{}	2026-07-23 10:19:25.615204+07
27	2	login	user	2	{}	2026-07-23 10:19:27.66109+07
28	5	login	user	5	{}	2026-07-23 11:09:04.609571+07
29	5	update	client	1	{"via": "portal", "fields": ["phone"]}	2026-07-23 11:09:30.978232+07
30	1	login	user	1	{}	2026-07-23 11:09:48.808811+07
31	5	login	user	5	{}	2026-07-23 11:10:54.672784+07
32	1	login	user	1	{}	2026-07-23 11:10:55.33275+07
33	5	login	user	5	{}	2026-07-23 11:13:29.206739+07
34	5	update	client	1	{"via": "portal", "fields": ["phone"]}	2026-07-23 11:13:29.666578+07
35	5	login	user	5	{}	2026-07-23 11:14:07.561571+07
36	5	login	user	5	{}	2026-07-23 11:20:36.407422+07
37	5	update	client	1	{"via": "portal", "fields": ["pic_name", "phone", "address"]}	2026-07-23 11:20:37.692888+07
38	1	login	user	1	{}	2026-07-23 11:20:38.467979+07
39	5	login	user	5	{}	2026-07-23 11:21:01.199324+07
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, user_id, company_name, registration_no, pic_name, phone, email, address, industry, payment_terms, created_at) FROM stdin;
2	\N	PT Kencana Marine Works	AHU-62830.PT.2019	Hendra Kusuma	0846-3966-9808	info@pt.kencana.marine.works.co.id	Sidoarjo, Jawa Timur	Marine	NET60	2026-07-17 16:22:38.36879+07
3	\N	PT Petro Nusantara Engineering	AHU-58431.TI.2024	Siti Rahmawati	0867-9977-4354	info@pt.petro.nusantara.engineering.co.id	Citra Raya, Tangerang	Oil & Gas	NET60	2026-07-17 16:22:38.36879+07
4	\N	PT Selatan Logistik Jaya	AHU-34499.AH.2020	Muhammad Rizky Pratama	0823-5230-7262	info@pt.selatan.logistik.jaya.co.id	Pelabuhan Makassar, Sulawesi Selatan	Logistics	NET30	2026-07-17 16:22:38.36879+07
5	\N	PT Menara Jaya Builders	AHU-75706.PT.2022	Andi Setiawan	0880-9065-1830	info@pt.menara.jaya.builders.co.id	Citra Raya, Tangerang	Construction	NET60	2026-07-17 16:22:38.36879+07
6	\N	PT Perkasa Fabrikasi Baja	AHU-97665.PT.2020	Dewi Anggraini	0869-2373-6033	info@pt.perkasa.fabrikasi.baja.co.id	Jakabaring, Palembang	Manufacturing	COD	2026-07-17 16:22:38.36879+07
7	\N	PT Timur Jauh Shipyard	AHU-10204.AH.2020	Agus Salim Nasution	0888-5529-8137	info@pt.timur.jauh.shipyard.co.id	Jakabaring, Palembang	Marine	COD	2026-07-17 16:22:38.36879+07
8	\N	PT Bintang Emas Development	AHU-96990.TI.2023	Ratna Sari Dewi	0880-6904-1284	info@pt.bintang.emas.development.co.id	Semanggi, Jakarta Selatan	Construction	NET60	2026-07-17 16:22:38.36879+07
9	\N	PT Global Energi Resources	AHU-62022.PT.2024	Yusuf Maulana	0814-8336-8108	info@pt.global.energi.resources.co.id	Tanjung Perak, Surabaya	Oil & Gas	COD	2026-07-17 16:22:38.36879+07
10	\N	PT Cahaya Baru Pergudangan	AHU-22144.AH.2018	Linda Kartika	0879-4887-6997	info@pt.cahaya.baru.pergudangan.co.id	Juanda, Surabaya	Logistics	NET30	2026-07-17 16:22:38.36879+07
11	\N	PT Pantai Indah Infrastruktur	AHU-47287.PT.2018	Fajar Nugroho	0829-3760-3741	info@pt.pantai.indah.infrastruktur.co.id	Sidoarjo, Jawa Timur	Construction	NET60	2026-07-17 16:22:38.36879+07
12	\N	PT Union Industri Berat	AHU-35651.TI.2024	Hendro Wijaya	0871-4227-9977	info@pt.union.industri.berat.co.id	Citra Raya, Tangerang	Manufacturing	COD	2026-07-17 16:22:38.36879+07
13	\N	PT Delta Petrokimia Services	AHU-68584.AH.2018	Rina Marlina	0824-5881-2753	info@pt.delta.petrokimia.services.co.id	Pelabuhan Makassar, Sulawesi Selatan	Oil & Gas	COD	2026-07-17 16:22:38.36879+07
14	\N	PT Harmoni Pelabuhan Nusantara	AHU-54245.PT.2018	Iwan Setiabudi	0837-9827-7889	info@pt.harmoni.pelabuhan.nusantara.co.id	Mandalika, Lombok	Marine	NET30	2026-07-17 16:22:38.36879+07
15	\N	PT Nusa Prima Freight	AHU-95682.AH.2019	Yulianto Saputra	0824-4626-1863	info@pt.nusa.prima.freight.co.id	Gresik, Jawa Timur	Logistics	NET60	2026-07-17 16:22:38.36879+07
16	\N	Evil Corp	EVIL-001	Hacker	0812345678	hacker2@evil.com	Nowhere	\N	NET30	2026-07-17 16:45:04.438461+07
1	5	PT Ganda Sentosa Konstruksi	AHU-80330.TI.2024	Bambang Wirawan	0811-2222-3333	info@pt.ganda.sentosa.konstruksi.co.id	Tanjung Priok, Jakarta Utara	Construction	NET30	2026-07-17 16:22:38.36879+07
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_no, order_id, client_id, base_amount, ot_hours, ot_rate, weekend_days, weekend_rate, additional_charges, discount, tax_percent, subtotal, tax_amount, total_amount, paid_amount, status, due_date, notes, created_by, created_at) FROM stdin;
1	INV-202607-0001	4	14	46073.45	12.00	114.90	0.00	0.00	51.82	464.45	6.00	47039.62	2822.38	49862.00	0.00	draft	2026-04-25	\N	3	2026-07-17 16:22:38.36879+07
2	INV-202607-0002	5	11	49928.00	4.00	93.67	0.00	0.00	430.02	754.63	6.00	49978.07	2998.68	52976.75	0.00	sent	2026-10-25	\N	3	2026-07-17 16:22:38.36879+07
3	INV-202607-0003	6	5	18132.88	0.00	0.00	2.00	647.22	273.12	380.19	6.00	19320.25	1159.21	20479.46	13106.85	partial	2026-02-21	\N	3	2026-07-17 16:22:38.36879+07
4	INV-202607-0004	11	1	42928.94	0.00	0.00	1.00	665.79	754.69	29.79	6.00	44319.63	2659.18	46978.81	0.00	overdue	2026-04-04	\N	3	2026-07-17 16:22:38.36879+07
5	INV-202607-0005	12	1	22819.05	12.00	141.40	0.00	0.00	413.24	495.91	6.00	24433.18	1465.99	25899.17	25899.17	paid	2026-12-27	\N	3	2026-07-17 16:22:38.36879+07
6	INV-202607-0006	13	11	48625.82	4.00	92.48	0.00	0.00	704.75	515.92	6.00	49184.57	2951.07	52135.64	0.00	draft	2026-03-23	\N	3	2026-07-17 16:22:38.36879+07
7	INV-202607-0007	18	3	43039.61	0.00	0.00	1.00	522.53	1320.20	155.22	6.00	44727.12	2683.63	47410.75	0.00	sent	2026-09-30	\N	3	2026-07-17 16:22:38.36879+07
8	INV-202607-0008	19	11	18055.64	0.00	0.00	1.00	406.40	1339.75	395.75	6.00	19406.04	1164.36	20570.40	12136.54	partial	2026-02-25	\N	3	2026-07-17 16:22:38.36879+07
9	INV-202607-0009	20	13	9485.72	4.00	104.65	2.00	526.44	498.76	15.68	6.00	11440.28	686.42	12126.70	0.00	overdue	2026-04-13	\N	3	2026-07-17 16:22:38.36879+07
10	INV-202607-0010	25	12	31333.79	8.00	80.30	2.00	805.68	1439.61	704.88	6.00	34322.28	2059.34	36381.62	36381.62	paid	2026-11-06	\N	3	2026-07-17 16:22:38.36879+07
\.


--
-- Data for Name: order_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_attachments (id, order_id, file_path, original_name, mime_type, size_bytes, uploaded_at) FROM stdin;
2	11	/uploads/orders/test-drawing.pdf	site-drawing.pdf	application/pdf	33	2026-07-23 11:19:16.704061+07
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, order_no, client_id, project_name, location, start_date, end_date, crane_type, capacity_tonnes, load_weight_kg, lift_height_m, site_condition, status, created_by, created_at) FROM stdin;
1	CR-202607-0001	13	Simpang Susun Semanggi Girder Lift	Semanggi, Jakarta Selatan	2026-09-10	2026-10-04	All Terrain Crane	159.00	31714.00	19.40	Coastal site, corrosion-resistant rigging used	pending	2	2026-07-17 16:22:38.36879+07
2	CR-202607-0002	7	Kilang Balongan Module Installation	Balongan, Indramayu	2026-03-16	2026-04-08	Tower Crane	60.10	41461.00	47.60	Congested urban site, night lift permit obtained	review	2	2026-07-17 16:22:38.36879+07
3	CR-202607-0003	6	Tanjung Priok Container Yard Crane Setup	Tanjung Priok, Jakarta Utara	2026-05-02	2026-05-27	Rough Terrain Crane	333.10	27396.00	48.90	Standard ground bearing capacity, no special measures	quotation	2	2026-07-17 16:22:38.36879+07
4	CR-202607-0004	14	Menara BCA Annexe Steel Erection	Thamrin, Jakarta Pusat	2026-03-12	2026-03-27	Rough Terrain Crane	308.40	7910.00	13.10	Standard ground bearing capacity, no special measures	approved	2	2026-07-17 16:22:38.36879+07
5	CR-202607-0005	11	Kilang Cilacap Vessel Lift	Cilacap, Jawa Tengah	2026-09-19	2026-09-26	Tower Crane	129.40	9195.00	13.60	Coastal site, corrosion-resistant rigging used	running	2	2026-07-17 16:22:38.36879+07
6	CR-202607-0006	5	Jembatan Suramadu Maintenance Lift	Suramadu, Surabaya	2026-01-10	2026-01-23	Mobile Crane	298.40	64106.00	55.50	Standard ground bearing capacity, no special measures	completed	2	2026-07-17 16:22:38.36879+07
7	CR-202607-0007	8	Citra Raya Mixed Development	Citra Raya, Tangerang	2026-06-11	2026-06-21	Tower Crane	91.30	14842.00	74.90	Standard ground bearing capacity, no special measures	rejected	2	2026-07-17 16:22:38.36879+07
8	CR-202607-0008	8	Terminal LNG Bontang Tank Roof Lift	Bontang, Kalimantan Timur	2026-03-10	2026-04-03	All Terrain Crane	342.40	39696.00	53.10	Soft soil, matting required for outriggers	pending	2	2026-07-17 16:22:38.36879+07
9	CR-202607-0009	2	MRT Jakarta Fase 2 Box Girder Segment	Bundaran HI, Jakarta Pusat	2026-08-04	2026-08-19	Rough Terrain Crane	224.50	23104.00	91.20	Elevated platform, wind speed monitored throughout	review	2	2026-07-17 16:22:38.36879+07
10	CR-202607-0010	7	Pelabuhan Tanjung Perak Ship-to-Shore Crane	Tanjung Perak, Surabaya	2026-07-12	2026-08-03	All Terrain Crane	262.90	53132.00	52.70	Confined access, mobile crane only, escort vehicle arranged	quotation	2	2026-07-17 16:22:38.36879+07
11	CR-202607-0011	1	Kawasan Industri Karawang Tower Lift	Karawang, Jawa Barat	2026-03-02	2026-03-06	Tower Crane	73.60	11210.00	60.00	Congested urban site, night lift permit obtained	approved	2	2026-07-17 16:22:38.36879+07
12	CR-202607-0012	1	Pelindo Makassar Marine Structure Assembly	Pelabuhan Makassar, Sulawesi Selatan	2026-11-11	2026-11-28	Tower Crane	104.20	45101.00	60.30	Standard ground bearing capacity, no special measures	running	2	2026-07-17 16:22:38.36879+07
13	CR-202607-0013	11	Kilang Balikpapan Terminal Turnaround	Balikpapan, Kalimantan Timur	2026-02-16	2026-02-22	Mobile Crane	260.30	43548.00	51.30	Elevated platform, wind speed monitored throughout	completed	2	2026-07-17 16:22:38.36879+07
14	CR-202607-0014	15	Gudang Cikarang Roof Truss Lift	Cikarang, Bekasi	2026-04-05	2026-04-13	Tower Crane	85.10	19377.00	52.20	Standard ground bearing capacity, no special measures	rejected	2	2026-07-17 16:22:38.36879+07
15	CR-202607-0015	11	Depo Logistik Medan Module Handling	Belawan, Medan	2026-02-17	2026-03-02	Mobile Crane	219.00	51254.00	41.00	Soft soil, matting required for outriggers	pending	2	2026-07-17 16:22:38.36879+07
16	CR-202607-0016	6	Gardu Induk Gresik Transformer Lift	Gresik, Jawa Timur	2026-02-14	2026-02-20	Crawler Crane	292.80	39168.00	43.90	Standard ground bearing capacity, no special measures	review	2	2026-07-17 16:22:38.36879+07
17	CR-202607-0017	7	Sirkuit Mandalika Grandstand Erection	Mandalika, Lombok	2026-12-01	2026-12-21	All Terrain Crane	241.60	57086.00	29.00	Confined access, mobile crane only, escort vehicle arranged	quotation	2	2026-07-17 16:22:38.36879+07
18	CR-202607-0018	3	Pelabuhan Batam Expansion Crane Assembly	Batu Ampar, Batam	2026-08-15	2026-09-01	Crawler Crane	44.10	72023.00	79.70	Elevated platform, wind speed monitored throughout	approved	2	2026-07-17 16:22:38.36879+07
19	CR-202607-0019	11	Data Center BSD City Cooling Tower Lift	BSD City, Tangerang Selatan	2026-01-15	2026-01-27	Mobile Crane	209.60	64839.00	61.70	Coastal site, corrosion-resistant rigging used	running	2	2026-07-17 16:22:38.36879+07
20	CR-202607-0020	13	Bandara Juanda Terminal Steelwork	Juanda, Surabaya	2026-02-18	2026-03-15	Rough Terrain Crane	64.60	24718.00	88.30	Confined access, mobile crane only, escort vehicle arranged	completed	2	2026-07-17 16:22:38.36879+07
21	CR-202607-0021	2	Marina Nongsa Jetty Installation	Nongsa, Batam	2026-03-14	2026-03-23	Rough Terrain Crane	162.20	76647.00	80.30	Elevated platform, wind speed monitored throughout	rejected	2	2026-07-17 16:22:38.36879+07
22	CR-202607-0022	3	Pabrik Semen Gresik Silo Erection	Gresik, Jawa Timur	2026-11-08	2026-11-28	Mobile Crane	218.10	10380.00	75.20	Coastal site, corrosion-resistant rigging used	pending	2	2026-07-17 16:22:38.36879+07
23	CR-202607-0023	3	Stasiun LRT Palembang Beam Lift	Jakabaring, Palembang	2026-11-18	2026-12-12	Rough Terrain Crane	279.90	69442.00	47.80	Confined access, mobile crane only, escort vehicle arranged	review	2	2026-07-17 16:22:38.36879+07
24	CR-202607-0024	3	Hotel Waterfront Manado Facade Panel Lift	Manado, Sulawesi Utara	2026-06-14	2026-06-21	Rough Terrain Crane	185.60	78067.00	77.00	Elevated platform, wind speed monitored throughout	quotation	2	2026-07-17 16:22:38.36879+07
25	CR-202607-0025	12	Pergudangan Sidoarjo Rack Installation	Sidoarjo, Jawa Timur	2026-10-02	2026-10-08	All Terrain Crane	79.00	16081.00	88.70	Coastal site, corrosion-resistant rigging used	approved	2	2026-07-17 16:22:38.36879+07
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, role, status, created_at) FROM stdin;
1	admin@crane.test	$2b$10$g.3tq1ouCvVJ0vxwH5xr1eeynS/tVtoHprMLnrZBZFPmQueyNE9bu	admin	approved	2026-07-17 16:22:38.36879+07
2	sales@crane.test	$2b$10$g.3tq1ouCvVJ0vxwH5xr1eeynS/tVtoHprMLnrZBZFPmQueyNE9bu	sales	approved	2026-07-17 16:22:38.36879+07
3	finance@crane.test	$2b$10$g.3tq1ouCvVJ0vxwH5xr1eeynS/tVtoHprMLnrZBZFPmQueyNE9bu	finance	approved	2026-07-17 16:22:38.36879+07
4	operation@crane.test	$2b$10$g.3tq1ouCvVJ0vxwH5xr1eeynS/tVtoHprMLnrZBZFPmQueyNE9bu	operation	approved	2026-07-17 16:22:38.36879+07
5	customer@crane.test	$2b$10$g.3tq1ouCvVJ0vxwH5xr1eeynS/tVtoHprMLnrZBZFPmQueyNE9bu	customer	approved	2026-07-17 16:22:38.36879+07
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 39, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clients_id_seq', 16, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 10, true);


--
-- Name: order_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_attachments_id_seq', 2, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 26, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: clients clients_registration_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_registration_no_key UNIQUE (registration_no);


--
-- Name: invoices invoices_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_no_key UNIQUE (invoice_no);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: order_attachments order_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attachments
    ADD CONSTRAINT order_attachments_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_no_key UNIQUE (order_no);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_clients_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_company ON public.clients USING btree (company_name);


--
-- Name: idx_invoices_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_client ON public.invoices USING btree (client_id);


--
-- Name: idx_invoices_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_order ON public.invoices USING btree (order_id);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_created ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_orders_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_client ON public.orders USING btree (client_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: invoices invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_attachments order_attachments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attachments
    ADD CONSTRAINT order_attachments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rcptNDQnwegFBD3mzcNn6lucsEkLi95GmxsAN0v1ORKbIO5NZOOjDh8XZXFbRZb

