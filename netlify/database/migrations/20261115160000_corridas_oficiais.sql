CREATE TABLE IF NOT EXISTS corridas_oficiais (
 id BIGSERIAL PRIMARY KEY,
 nome TEXT NOT NULL,
 cidade TEXT NOT NULL,
 data DATE NOT NULL,
 distancias TEXT NOT NULL,
 organizador TEXT NOT NULL,
 criado_por TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','aprovada','rejeitada')),
 criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_corridas_status_data ON corridas_oficiais(status,data);
