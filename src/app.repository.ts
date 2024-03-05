import { Injectable } from '@nestjs/common';
import { Collection } from 'mongodb';
import { Observable, from, map } from 'rxjs';
import { Session } from './model';

@Injectable()
export class Repository {
  constructor(private collection: Collection<Session>) {}

  getOne(id: string): Observable<Session> {
    return from(this.collection.findOne({ _id: id }));
  }

  getAll(): Observable<Record<string, number[]>> {
    return from(this.collection.find({}).toArray()).pipe(
      map((array: Session[]) =>
        array.reduce((result: Record<string, number[]>, value: Session) => {
          result[value._id] = value.values;
          return result;
        }, {} as Record<string, number[]>),
      ),
    );
  }

  createOne(session: Session): Observable<string> {
    return from(this.collection.insertOne(session).then(() => session._id));
  }

  updateOne(session: Session): Observable<void> {
    return from(
      this.collection
        .replaceOne({ _id: session._id }, session)
        .then(() => undefined),
    );
  }

  deleteOne(id: string): Observable<void> {
    return from(this.collection.deleteOne({ _id: id }).then(() => undefined));
  }

  deleteAll(): Observable<void> {
    return from(this.collection.deleteMany({}).then(() => undefined));
  }
}
