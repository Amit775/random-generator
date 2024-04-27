import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import { AppController } from './app.controller';
import { Repository } from './app.repository';
import { AppService } from './app.service';
import { Session } from './model';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [
    AppService,
    Repository,
    {
      provide: Collection,
      useFactory: async () => {
        const config = {
          uri: `mongodb+srv://ambuex:Amit7885@randomizer.dluquzb.mongodb.net/?retryWrites=true&w=majority`,
          name: 'randomizer',
        };

        return await new MongoClient(config.uri)
          .connect()
          .then((client) => {
            return client.db(config.name).collection<Session>(config.name);
          })
          .catch((error) => console.error(error));
      },
    },
  ],
})
export class AppModule {}
