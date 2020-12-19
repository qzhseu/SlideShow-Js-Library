/* server.js - Express server*/
'use strict';
const log = console.log

const express = require('express')
const app = express();

const path = require('path');

app.use(express.static(path.join(__dirname, '/pub')))


app.get('/', (req, res) => {
	res.sendFile('home.html', { root: path.join(__dirname, './pub') });
})

app.get('/demo',(req, res)=>{
	res.sendFile('slideExample.html', { root: path.join(__dirname, './pub') });
})

const port = process.env.PORT || 3000
app.listen(port, () => {
	log(`Listening on port ${port}...`)
})  

