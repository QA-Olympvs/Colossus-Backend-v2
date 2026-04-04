import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveredAtToOrders1743614580000 implements MigrationInterface {
  name = 'AddDeliveredAtToOrders1743614580000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add delivered_at column
    await queryRunner.query(`
      ALTER TABLE orders 
      ADD COLUMN delivered_at TIMESTAMP NULL
    `);

    // Create indexes for dashboard queries
    await queryRunner.query(`
      CREATE INDEX idx_orders_branch_id_created_at 
      ON orders(branch_id, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_orders_status_delivered_at 
      ON orders(status, delivered_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_orders_created_at 
      ON orders(created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_orders_created_at`);
    await queryRunner.query(`DROP INDEX idx_orders_status_delivered_at`);
    await queryRunner.query(`DROP INDEX idx_orders_branch_id_created_at`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN delivered_at`);
  }
}
