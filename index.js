const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.stqqfzx.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
        const categoryCollection = client.db('lovinBook').collection('categoryDetails');
        const bookingsCollection = client.db('lovinBook').collection('bookings');
        const buyersCollection = client.db('lovinBook').collection('buyers');
        const productsCollection = client.db('lovinBook').collection('products');


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

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' });

            }

            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(booking);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const buyer = await buyersCollection.findOne(query);
            if (buyer) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }

            res.status(403).send({ accessToken: '' })
        })

        app.get('/buyers', async (req, res) => {
            const query = {};
            const buyers = await buyersCollection.find(query).toArray();
            res.send(buyers)
        })

        app.get('/buyers/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const buyer = await buyersCollection.findOne(query);
            res.send({ isAdmin: buyer?.role === 'admin' })
        })

        app.post('/buyers', async (req, res) => {
            const buyer = req.body;
            const result = await buyersCollection.insertOne(buyer);
            res.send(result);
        })

        app.put('/buyers/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const buyer = await buyersCollection.findOne(query);

            if (buyer?.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = buyersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.get('/allBuyers', async (req, res) => {
            const query = { role: 'Buyer' };
            const buyers = await buyersCollection.find(query).toArray();
            res.send(buyers)
        })
        app.get('/sellers', async (req, res) => {
            const query = { role: 'Seller' };
            const sellers = await buyersCollection.find(query).toArray();
            res.send(sellers)
        })

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
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