import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(private readonly productService: ProductsService) {}

  public async runSeed() {
    const response = await this.insertNewProducts();

    if (response) return 'SEED EXECUTED';

    return 'FAILED SEED EXECUTED';
  }

  private async insertNewProducts() {
    await this.productService.deleteAllProducts();

    const products = initialData.products;

    const insertPromises = products.map((product) => {
      return this.productService.create(product);
    });

    await Promise.all(insertPromises);

    return true;
  }
}
