import { MigrationInterface, QueryRunner } from "typeorm";

export class AddComentarioTableAndRelationToPublicacao1737981438112 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "comentario" (
                "id" SERIAL NOT NULL,
                "idUsuario" integer NOT NULL,
                "conteudo" character varying(500) NOT NULL,
                "dataHora" TIMESTAMP NOT NULL,
                "publicacaoId" integer,
                CONSTRAINT "PK_comentario_id" PRIMARY KEY ("id")
            )`
        );

        await queryRunner.query(
            `ALTER TABLE "comentario"
             ADD CONSTRAINT "FK_comentario_publicacaoId"
             FOREIGN KEY ("publicacaoId")
             REFERENCES "publicacao"("id")
             ON DELETE CASCADE`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "comentario" DROP CONSTRAINT "FK_comentario_publicacaoId"`
        );
        
        await queryRunner.query(`DROP TABLE "comentario"`);
    }
}