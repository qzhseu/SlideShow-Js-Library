/* server.js - Express server*/
'use strict';
const log = console.log

const express = require('express')
const app = express();

const path = require('path');

app.use(express.static(path.join(__dirname, '/pub')))


app.get('/', (req, res) => {
	res.sendFile('home.html', { root: path.join(__dirname, './pub/example') });
})

app.get('/demo',(req, res)=>{
	res.sendFile('slideExample.html', { root: path.join(__dirname, './pub') });
})

app.get('/example',(req, res)=>{
	res.sendFile('example.html', { root: path.join(__dirname, './pub/example') });
})

const port = process.env.PORT || 3000
app.listen(port, () => {
	log(`Listening on port ${port}...`)
})  

