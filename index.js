require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
const dns = require('node:dns');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const URLSchema = new mongoose.Schema({
    original_url: { type: String, required: true, unique: true },
    short_url: { type: String, required: true, unique: true },
})

let URLModel = mongoose.model('URLModel', URLSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url', function (req, res) {
    let short_url = req.params.short_url;
    // Find the original URL from the database using the short_url
    URLModel.findOne({ short_url: short_url })
        .then((foundURL) => {
            console.log(foundURL);
            if (foundURL) {
                let original_url = foundURL.original_url;
                res.redirect(original_url);
            } else {
                res.json({ message: 'The shorturl doesnt exist!' });
            }
        })
        .catch((err) => {
            res.json({ error: 'An error occurred' });
        });
});

// Your first API endpoint
app.post('/api/shorturl', function (req, res) {
    let url = req.body.url;

    // Validate the URL
    try {
        let urlObj = new URL(url);
        dns.lookup(urlObj.hostname, (err, address, family) => {
            console.log(address);

            // If the DNS domain does not exist no address
            if (!address) {
                res.json({ error: 'invalid url' });
            }
            // We have a valid URL
            else {
                let original_url = urlObj.href;
                let short_url = 1
                let resObj = {
                    original_url: original_url,
                    short_url: short_url
                }
                // Create an entry in the database
                let newURL = new URLModel(resObj);
                newURL.save()
                res.json(resObj);
            }
        })
    }
    catch {
        res.json({ error: 'invalid url' });
    }
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
