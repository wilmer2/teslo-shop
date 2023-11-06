import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from '.';

@Entity()
export class ProductImage {
  @PrimaryGeneratedColumn()
  public id: number;
  @Column('text')
  public url: string;

  @ManyToOne(() => Product, (product) => product.images)
  public product: Product;
}
