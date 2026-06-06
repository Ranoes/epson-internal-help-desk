-- PostgreSQL schema for epson-internal-help-desk
-- Based on the provided DDL

-- public._prisma_migrations definition
CREATE TABLE public._prisma_migrations (
	id varchar(36) NOT NULL,
	checksum varchar(64) NOT NULL,
	finished_at timestamptz NULL,
	migration_name varchar(255) NOT NULL,
	logs text NULL,
	rolled_back_at timestamptz NULL,
	started_at timestamptz DEFAULT now() NOT NULL,
	applied_steps_count int4 DEFAULT 0 NOT NULL,
	CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);

-- public.knowledge_base definition
CREATE TABLE public.knowledge_base (
	id text NOT NULL,
	title varchar(255) NOT NULL,
	category varchar(50) NOT NULL,
	subcategory varchar(100) NULL,
	"content" text NOT NULL,
	tags _text NULL,
	source_doc varchar(255) NULL,
	embedding_id varchar(100) NULL,
	created_at timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp(3) NOT NULL,
	CONSTRAINT knowledge_base_pkey PRIMARY KEY (id)
);

-- public.users definition
CREATE TABLE public.users (
	id text NOT NULL,
	username varchar(100) NOT NULL,
	password_hash varchar(255) NOT NULL,
	"name" varchar(255) NULL,
	"role" varchar(20) DEFAULT 'user'::character varying NOT NULL,
	department varchar(100) NULL,
	created_at timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);

-- public.chat_logs definition
CREATE TABLE public.chat_logs (
	id text NOT NULL,
	session_id varchar(50) NOT NULL,
	user_id varchar(20) NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text NOT NULL,
	confidence float8 NULL,
	escalated bool DEFAULT false NOT NULL,
	kb_sources _text NULL,
	engine_used varchar(50) NULL,
	created_at timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT chat_logs_pkey PRIMARY KEY (id),
	CONSTRAINT chat_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- public.tickets definition
CREATE TABLE public.tickets (
	id text NOT NULL,
	user_id varchar(20) NOT NULL,
	session_id varchar(50) NULL,
	question text NOT NULL,
	status varchar(20) DEFAULT 'open'::character varying NOT NULL,
	assigned_to varchar(20) NULL,
	resolution text NULL,
	created_at timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp(3) NOT NULL,
	CONSTRAINT tickets_pkey PRIMARY KEY (id),
	CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
