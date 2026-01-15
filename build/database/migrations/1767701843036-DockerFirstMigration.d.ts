import { MigrationInterface, QueryRunner } from "typeorm";
export declare class DockerFirstMigration1767701843036 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
