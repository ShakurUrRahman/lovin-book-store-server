const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.stqqfzx.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoryCollection = client.db('lovinBook').collection('categoryDetails');
        const bookingsCollection = client.db('lovinBook').collection('bookings');


        app.get('/', async (req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query);
            const categoryDetails = await cursor.toArray();
            res.send(categoryDetails);
        })

        app.get('/categoryDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const categoryDetail = await categoryCollection.findOne(query);
            res.send(categoryDetail);
        })

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(booking);
        })
    }
    finally {

    }
}

run().catch(error => console.error(error))


app.get('/', (req, res) => {
    res.send('lovin book store server is running')
})

app.listen(port, () => {
    console.log(`Lovin Book Store server running on ${port}`);
})