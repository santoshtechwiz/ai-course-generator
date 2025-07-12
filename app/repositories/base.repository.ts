import prisma from "@/lib/db";

/**
 * Base repository with common CRUD operations
 */
export class BaseRepository<T> {
  protected prismaModel: any;

  constructor(model: any) {
    this.prismaModel = model;
  }

  /**
   * Find a record by its ID
   */
  async findById(id: number | string): Promise<T | null> {
    return this.prismaModel.findUnique({
      where: { id },
    });
  }

  /**
   * Find a record by a specific field
   */
  async findBy(field: string, value: any): Promise<T | null> {
    return this.prismaModel.findFirst({
      where: { [field]: value },
    });
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(where: any = {}, options: any = {}): Promise<T[]> {
    return this.prismaModel.findMany({
      where,
      ...options,
    });
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    return this.prismaModel.create({
      data,
    });
  }

  /**
   * Update an existing record
   */
  async update(id: number | string, data: any): Promise<T> {
    return this.prismaModel.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record
   */
  async delete(id: number | string): Promise<T> {
    return this.prismaModel.delete({
      where: { id },
    });
  }
}
