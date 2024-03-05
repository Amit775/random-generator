import { Injectable } from '@nestjs/common';
import { raw } from 'guid';
import { Observable, of, switchMap } from 'rxjs';
import { Repository } from './app.repository';

function createShuffledArray(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 })
    .map((_, i) => i + 1)
    .sort(() => Math.random() - 0.5);
}

@Injectable()
export class AppService {
  constructor(private repository: Repository) {}

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
}
