-- Tabela de Categorias de Vagas
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    icon VARCHAR(50),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários Administrativos
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Principal de Vagas de Emprego
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    company_name VARCHAR(120) NOT NULL DEFAULT 'Confidencial',
    company_logo_url VARCHAR(500),
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    city VARCHAR(80) NOT NULL DEFAULT 'Natal',
    state VARCHAR(2) NOT NULL DEFAULT 'RN',
    neighborhood VARCHAR(100),
    work_model VARCHAR(30) NOT NULL DEFAULT 'PRESENCIAL', -- PRESENCIAL, HIBRIDO, REMOTO
    contract_type VARCHAR(30) NOT NULL DEFAULT 'CLT',     -- CLT, PJ, ESTAGIO, TEMPORARIO, JOVEM_APRENDIZ
    salary_min NUMERIC(10, 2),
    salary_max NUMERIC(10, 2),
    salary_currency VARCHAR(10) DEFAULT 'BRL',
    hide_salary BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    application_channel VARCHAR(30) NOT NULL DEFAULT 'EMAIL', -- EMAIL, LINK, WHATSAPP
    application_target VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',            -- PENDING, APPROVED, EXPIRED, REJECTED
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INTEGER NOT NULL DEFAULT 0,
    source_url VARCHAR(500),
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Alta Performance para Busca e SEO
CREATE INDEX IF NOT EXISTS idx_jobs_status_published ON jobs (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs (city);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs (category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs (slug);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs (is_featured);

-- Carga inicial de categorias essenciais de Natal e Região
INSERT INTO categories (name, slug, icon, description) VALUES
('Comércio & Varejo', 'comercio-varejo', 'ShoppingBag', 'Vendas, caixas, atendentes e gerência de lojas'),
('Gastronomia, Hotelaria & Turismo', 'gastronomia-hotelaria-turismo', 'Utensils', 'Restaurantes, hotéis, pousadas, garçons e cozinheiros'),
('Saúde & Farmácia', 'saude-farmacia', 'HeartPulse', 'Clínicas, farmácias, enfermagem, recepção e cuidadores'),
('Administrativo & Financeiro', 'administrativo-financeiro', 'Briefcase', 'Auxiliar de escritório, faturamento, financeiro e DP'),
('Tecnologia da Informação & Design', 'tecnologia-design', 'Laptop', 'Desenvolvimento, suporte técnico, infraestrutura e criação'),
('Logística, Transporte & Entregas', 'logistica-transporte-entregas', 'Truck', 'Estoque, motoristas, motoboys e expedição'),
('Serviços Gerais, Portaria & Limpeza', 'servicos-gerais-portaria', 'Sparkles', 'Zeladoria, portaria, vigilância e conservação'),
('Atendimento ao Cliente & Call Center', 'atendimento-call-center', 'Headphones', 'SAC, televendas, suporte e recepção'),
('Educação & Estágios', 'educacao-estagios', 'GraduationCap', 'Professores, tutores, instrutores e oportunidades de estágio')
ON CONFLICT (name) DO NOTHING;
