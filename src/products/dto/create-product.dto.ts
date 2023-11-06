import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  public readonly title: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  public readonly price?: number;

  @IsString()
  @IsOptional()
  public readonly description?: string;

  @IsString()
  @IsOptional()
  public readonly slug?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  public readonly stock?: number;

  @IsString({ each: true })
  @IsArray()
  public readonly sizes: string[];

  @IsIn(['men', 'women', 'kid', 'unisex'])
  public readonly gender: string;

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  public readonly tags: string[];

  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  public readonly images?: string[];
}
