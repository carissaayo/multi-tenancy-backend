import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddProfileFieldsToUsers1737000000001 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
