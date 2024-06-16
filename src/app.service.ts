import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { raw } from 'guid';
import { trim } from 'lodash';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { Repository } from './app.repository';
import { Movie } from './model';
import { GreetingService } from './greeting.service';

function createShuffledArray(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 })
    .map((_, i) => Number(i + min))
    .sort(() => Math.random() - 0.5);
}

@Injectable()
export class AppService {
  constructor(
    private repository: Repository,
    private http: HttpService,
    private greeting: GreetingService,
  ) {}

  startSession(min: number, max: number): Observable<string> {
    if (min > max) throw 'min is greater than max';

    const sessionId: string = raw();
    const values = createShuffledArray(min, max);

    return this.repository.createOne({ _id: sessionId, values });
  }

  next(sessionId: string): Observable<number> {
    return this.repository.getOne(sessionId).pipe(
      switchMap((session) => {
        if (!session) throw `${sessionId} was not started, call start first`;
        if (session.values.length === 0) this.endSession(sessionId);

        const value = session.values.pop();
        this.repository.updateOne({ _id: sessionId, values: session.values });
        return of(value);
      }),
    );
  }

  endSession(sessionId: string): Observable<void> {
    return this.repository.deleteOne(sessionId);
  }

  getOne(sessionId: string): Observable<number[]> {
    return this.repository.getOne(sessionId).pipe(
      switchMap((session) => {
        if (!session) throw `${sessionId} was not started, call start first`;
        return of(session.values);
      }),
    );
  }

  getAll(): Observable<Record<string, number[]>> {
    return this.repository.getAll();
  }

  endAll(): Observable<void> {
    return this.repository.deleteAll();
  }

  getHarryPotterMovies(): Observable<string> {
    const url =
      'https://www.ipo.co.il/program/harry_potter_and_the_prisoner_of_azkaban/';

    return from(
      this.http.get(url).pipe(
        map((response) => {
          const htmlContent = response.data;
          const $ = cheerio.load(htmlContent);

          const quotes = $('.time_zone [id^="event"]');

          return quotes.get().map((quote) => {
            const date = $(quote).closest('.event_date_str').text();
            const time = $(quote).closest('.event_time').text();

            return {
              name: 'הארי פוטר',
              date,
              time,
            } as Movie;
          });
        }),
        map((movies) => movies.map((movie) => `${movie.name}`).join('\n')),
      ),
    );
  }

  setGreeting(greeting: string): void {
    this.greeting.setGreeting(greeting);
  }

  getAtlasMovies(): Observable<{ movies: string }> {
    // URL of the website
    const url = 'http://atlashotels-experience.co.il/cinema/';

    // Send a GET request to the URL with headers
    return from(
      this.http.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).pipe(
        map((response) => {
          const htmlContent = response.data;
          const $ = cheerio.load(htmlContent);

          // Find all elements with class 'elementor-element-populated'
          const potentialParents = $('.elementor-element-populated');

          // Filter the potential parents to find those with a child with class 'film-image'
          const selectedParents = potentialParents.filter(
            (index, element) => $(element).find('.film-image').length > 0,
          );

          const text = trim(selectedParents.eq(0).text());
          const cleanText: string[] = text
            .split('custom CSS */')
            .reverse()[0]
            .replace('חדשים מהקולנוע', '')
            .replace(/^\n|\n$/, '')
            .replace(/\s+\n*\s+/g, '\n')
            .trim()
            .split('לפרטים ורכישה');

          return cleanText
            .filter((m) => m.length > 0)
            .map((movie) => {
              const [stock, name, dateTime, _day, cost] = movie
                .replace(/^\n|\n$/, '')
                .split('\n');
              const [date, time] = dateTime.split(' || ');

              return { date, name, time, cost, stock } as Movie;
            });
        }),
        map((movies) => {
          const result = movies.map(
            (movie) =>
              `${movie.name} - ${movie.date} - ${movie.time} - ${movie.stock} - ${movie.cost}`,
          );

          const greeting = this.greeting.getGreeting();
          result.unshift(greeting);

          return result.filter(Boolean).join('\n');
        }),
        map((movies) => ({ movies })),
      ),
    );
  }
}
