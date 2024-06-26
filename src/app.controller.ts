import { Controller, Get, Param, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  @Get('start')
  start(
    @Query('min') min: number,
    @Query('max') max: number,
  ): Observable<string> {
    return this.service.startSession(+min, +max);
  }

  @Get('next/:sessionId')
  next(@Param('sessionId') sessionId: string): Observable<number> {
    return this.service.next(sessionId);
  }

  @Get('end/:sessionId')
  end(@Param('sessionId') sessionId: string): Observable<void> {
    return this.service.endSession(sessionId);
  }

  @Get('get-one/:sessionId')
  getOne(@Param('sessionId') sessionId: string): Observable<number[]> {
    return this.service.getOne(sessionId);
  }

  @Get('get-all')
  getAll(): Observable<Record<string, number[]>> {
    return this.service.getAll();
  }

  @Get('end-all')
  endAll(): Observable<void> {
    return this.service.endAll();
  }

  @Get('atlas')
  getAtlasMovies(): Observable<{ movies: string }> {
    return this.service.getAtlasMovies();
  }

  @Get('movies/harry-potter')
  getHarryPotterMovies(): Observable<string> {
    return this.service.getHarryPotterMovies();
  }

  @Get('atlas/:greeting')
  setGreeting(
    @Param('greeting') greeting: string,
  ): Observable<{ movies: string }> {
    this.service.setGreeting(greeting);

    return this.service.getAtlasMovies();
  }
}
