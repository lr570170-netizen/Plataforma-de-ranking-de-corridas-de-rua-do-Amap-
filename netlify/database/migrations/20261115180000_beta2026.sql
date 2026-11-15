CREATE TABLE IF NOT EXISTS resultados_beta_2026 (
 id BIGSERIAL PRIMARY KEY,
 atleta_id BIGINT NOT NULL REFERENCES atletas(id),
 prova TEXT NOT NULL,
 data DATE NOT NULL CHECK(data BETWEEN '2026-01-01' AND '2026-12-31'),
 dist TEXT NOT NULL,
 tempo_segundos INT NOT NULL CHECK(tempo_segundos>0),
 colocacao INT NOT NULL CHECK(colocacao>0),
 url TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','aprovado','rejeitado')),
 criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(atleta_id,prova,data,dist)
);
CREATE INDEX IF NOT EXISTS idx_beta2026_status ON resultados_beta_2026(status,dist,tempo_segundos);
