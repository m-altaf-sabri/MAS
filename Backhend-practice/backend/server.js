import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('server is ready');
});

// get a list of 5 joke 

app.get('/api/jokes', (req, res) => {
    const jokes = [
        {
            id: 1,
            title: 'i am joke',
            content: 'that was a joke'
        },
        {
            id: 2,
            title: 'i am joke now',
            content: 'that was another joke'
        },
        {
            id: 3,
            title: 'i am joke serious',
            content: 'that was my joke'
        },
        {
            id: 4,
            title: 'i am joker',
            content: 'that was your joke'
        },
        {
            id: 5,
            title: 'i am king of joker',
            content: 'these my joke'
        }
    ];
    res.send(jokes);
});

const port = process.env.port || 3000;

app.listen(port, () => {
    console.log('server at http://localhost:${port}');
});