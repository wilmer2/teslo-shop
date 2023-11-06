import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    let product: Product;

    try {
      product = this.productRepository.create(createProductDto);
    } catch (error) {
      this.logger.error('error create product in memory', error);
      throw new InternalServerErrorException('Has error ocurred in created');
    }

    try {
      await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    return product;
  }

  async findAll(paginationDto: PaginationDto): Promise<Product[]> {
    let products: Product[];
    const { limit = 10, offset = 0 } = paginationDto;

    try {
      products = await this.productRepository.find({
        take: limit,
        skip: offset,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }

    return products;
  }

  async findOne(term: string): Promise<Product> {
    let product: Product;

    if (isUUID(term)) {
      try {
        product = await this.productRepository.findOneBy({
          id: term,
        });
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();

      try {
        product = await queryBuilder
          .where('Upper(title) = :title or slug=:slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase(),
          })
          .getOne();
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    if (!product) {
      throw new NotFoundException(
        `Product with id, title or slug "${term}" not found`,
      );
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    let product;

    try {
      product = await this.productRepository.preload({
        id,
        ...updateProductDto,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }

    if (!product) {
      throw new NotFoundException(` Product with id ${id} not found`);
    }

    try {
      await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    return product;
  }

  async remove(id: string): Promise<void> {
    const product: Product = await this.findOne(id);

    try {
      await this.productRepository.remove(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    if (error.message && typeof error.message === 'string') {
      throw new BadRequestException(error.message);
    }

    this.logger.error('error to create product in db', error);

    throw new InternalServerErrorException(
      'Unexpected error check server logs',
    );
  }
}
