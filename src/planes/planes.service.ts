import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private planesRepository: Repository<Plan>,
  ) {}

  create(createPlanDto: Partial<Plan>): Promise<Plan> {
    const plan = this.planesRepository.create(createPlanDto);
    return this.planesRepository.save(plan);
  }

  findAll(): Promise<Plan[]> {
    return this.planesRepository.find();
  }

  findAllActive(): Promise<Plan[]> {
    return this.planesRepository.find({ where: { activo: true } });
  }

  findOne(id: number): Promise<Plan | null> {
    return this.planesRepository.findOneBy({ id });
  }
}
