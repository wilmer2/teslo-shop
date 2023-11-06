import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column('text', {
    unique: true,
  })
  public title: string;

  @Column('float', {
    default: 0,
  })
  public price: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  public description: string;

  @Column('text', {
    unique: true,
  })
  public slug: string;

  @Column('int', {
    default: 0,
  })
  public stock: number;

  @Column('text', {
    array: true,
  })
  public sizes: string[];

  @Column('text')
  public gender: string;

  @Column('text', {
    array: true,
    default: [],
  })
  public tags: string[];

  @BeforeInsert()
  public checkSlugInsert(): void {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  public checkSlugUpdate(): void {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
