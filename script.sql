CREATE TABLE
    "clientes" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "saldo" INTEGER NOT NULL DEFAULT 0,
        "limite" INTEGER NOT NULL
    );

CREATE TABLE
    "transacoes" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "valor" INTEGER NOT NULL,
        "id_cliente" INTEGER NOT NULL,
        "tipo" VARCHAR(1) NOT NULL,
        "descricao" VARCHAR(10) NOT NULL,
        "realizado_em" TIMESTAMP NOT NULL DEFAULT NOW()
    );

ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_id_cliente"
ON "clientes" ("id");

DO $$
BEGIN
  INSERT INTO "clientes" ("limite")
  VALUES
    (1000 * 100),
    (800 * 100),
    (10000 * 100),
    (100000 * 100),
    (5000 * 100);
END; $$