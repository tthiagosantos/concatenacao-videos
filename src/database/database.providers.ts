import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> => {
      try {
        const connection = await mongoose.connect(
          'mongodb://root:root@localhost:27017/?retryWrites=true&w=majority',
          {
            authSource: 'admin',
          },
        );

        return connection;
      } catch (error) {
        throw error;
      }
    },
  },
];
