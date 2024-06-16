import mongoose from 'mongoose';

let isConnected = false; // variable to check if the connection is already established

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if(!process.env.MONGODB_URL) {
        throw new Error('MONGODB_URI is not defined');
    }
    if(isConnected) {
        console.log('=> using existing database connection');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URL)

        isConnected = true;
        console.log('=> new database connection');
    } catch (error) {
        console.log('Error connecting to database: ', error);
    }
}