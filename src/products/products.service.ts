import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    let product: Product;
    const { images = [], ...productDetails } = createProductDto;
    const productImages = images.map((img: string) =>
      this.productImageRepository.create({ url: img }),
    );

    try {
      product = this.productRepository.create({
        ...productDetails,
        images: productImages,
      });
    } catch (error) {
      this.logger.error('error create product in memory', error);
      throw new InternalServerErrorException('Has error ocurred in created');
    }

    try {
      await this.productRepository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    return { ...product, images };
  }

  async findAll(paginationDto: PaginationDto) {
    let products: Product[];
    const { limit = 10, offset = 0 } = paginationDto;

    try {
      products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true,
        },
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }

    return products.map((product) => ({
      ...product,
      images: product.images.map((image) => image.url),
    }));
  }

  async findOne(term: string) {
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
      const queryBuilder = this.productRepository.createQueryBuilder('prod');

      try {
        product = await queryBuilder
          .where('Upper(title) = :title or slug=:slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase(),
          })
          .leftJoinAndSelect('prod.images', 'productImages')
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

  async findOnePlan(term: string) {
    const { images = [], ...product } = await this.findOne(term);

    return {
      ...product,
      images: images.map((image) => image.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;
    let product: Product;

    try {
      product = await this.productRepository.preload({ id, ...toUpdate });
    } catch (error) {
      this.handleDBExceptions(error);
    }

    if (!product) {
      throw new NotFoundException(` Product with id ${id} not found`);
    }

    // Create query Runner
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map((image) =>
          this.productImageRepository.create({
            url: image,
          }),
        );
      } else {
        const productImages = await this.productImageRepository.find({
          where: {
            product: { id: product.id },
          },
        });

        product.images = productImages;
      }

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);
    }

    const productDetail = {
      ...product,
      images: product.images.map((image) => image.url),
    };

    return productDetail;
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
    console.log(error);

    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error('error to create product in db', error);

    throw new InternalServerErrorException(
      'Unexpected error check server logs',
    );
  }
}
