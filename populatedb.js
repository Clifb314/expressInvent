#! /usr/bin/env node

console.log(
    'This script populates some test drugs to add to my inventory database'
  );
  
  // Get arguments passed on command line
  const userArgs = process.argv.slice(2);
  
//   const Book = require("./models/book");
//   const Author = require("./models/author");
//   const Genre = require("./models/genre");
//   const BookInstance = require("./models/bookinstance");


  const Drug = require('./models/drugModel')
  const Lot = require('./models/lotModel')
  const Manu = require('./models/manufactModel')
  const Class = require('./models/classModel')

  const drugs = [];
  const lots = [];
  const manus = [];
  const classes = [];
  
  const mongoose = require("mongoose");
  mongoose.set("strictQuery", false); // Prepare for Mongoose 7
  
  const mongoDB = userArgs[0];
  
  main().catch((err) => console.log(err));
  
  async function main() {
    console.log("Debug: About to connect");
    await mongoose.connect(mongoDB);
    console.log("Debug: Should be connected?");
    await createGenres();
    await createAuthors();
    await createBooks();
    await createBookInstances();
    console.log("Debug: Closing mongoose");
    mongoose.connection.close();
  }
  
  // We pass the index to the ...Create functions so that, for example,
  // genre[0] will always be the Fantasy genre, regardless of the order
  // in which the elements of promise.all's argument complete.
  async function genreCreate(index, name) {
    const myClass = new Class({ name: name });
    await myClass.save();
    classes[index] = myClass;
    console.log(`Added class: ${name}`);
  }
  
  async function authorCreate(index, name, country) {
    const authordetail = { name: name, country: country };
    const manu = new Manu(authordetail);
  
    await manu.save();
    manus[index] = manu;
    console.log(`Added Manufacturer: ${name}, ${country}`);
  }
  
  async function bookCreate(index, lot, quantity) {
    const bookdetail = {
      lot: lot,
    };

    bookdetail.quantity = quantity === undefined ? 0 : quantity

  
    const myLot = new Lot(bookdetail);
    await myLot.save();
    lots[index] = myLot;
    console.log(`Added lot: ${lot}`);
  }
  
  async function bookInstanceCreate(index, name, myClass, ndc, strength, form, manu, lot) {
    const bookinstancedetail = {
      name: name,
      class: myClass,
      products: {
        lots: lot,
        manufact: manu,
        strength: strength,
        form: form,
        ndc: ndc
      }
    };
  
    const drug = new Drug(bookinstancedetail);
    await drug.save();
    drugs[index] = drug;
    console.log(`Added drug: ${name}`);
  }
  
  async function createGenres() {
    console.log("Adding classes");
    await Promise.all([
      genreCreate(0, "Antibiotic"),
      genreCreate(1, "Opioid"),
      genreCreate(2, "Antihypertensive"),
      genreCreate(3, "Muscle Relaxant"),
      genreCreate(4, "Antipsychotic"),
      genreCreate(5, "Diuretic"),

    ]);
  }
  
  async function createAuthors() {
    console.log("Adding Manufacturers");
    await Promise.all([
      authorCreate(0, 'GlaxoSmithKline', 'UK'),
      authorCreate(1, 'Pfizer', 'America'),
      authorCreate(2, 'Roche', "Switzerland"),
      authorCreate(3, 'Novartis', 'Switzerland'),
      authorCreate(4, 'Merck', "America"),
    ]);
  }
  
  async function createBooks() {
    console.log("Adding Lots");
    await Promise.all([
      bookCreate(0, '1007813'),
      bookCreate(1, 'AA12456'),
      bookCreate(2, '1011770'),
      bookCreate(3, '1011476'),
      bookCreate(4, '1009523'),
      bookCreate(5, '0000126222'),
    ]);
  }
  
  async function createBookInstances() {
    console.log("Adding drugs");
    await Promise.all([
      //name, myClass, ndc, strength, form, manu, lot
      bookInstanceCreate(0, 'Bactrim', [classes[0]._id], '6068760311', "400mg / 80mg", "Tablet", [manus[0]._id], [lots[0]._id]),
      bookInstanceCreate(1, 'Oxycontin', [classes[1]._id], '13107005601', "15mg", "Tablet", [manus[1]._id], [lots[1]._id]),
      bookInstanceCreate(2, 'Cardizem', [classes[2]._id], '60687020690', "180mg", "ER Tablet", [manus[2]._id], [lots[2]._id]),
      bookInstanceCreate(3, 'Flexeril', [classes[3]._id], '31722028301', "400mg / 80mg", "Tablet", [manus[3]._id], [lots[3]._id]),
      bookInstanceCreate(4, 'Aricept', [classes[4]._id], '16729027901', "5mg", "Tablet", [manus[4]._id], [lots[4]._id]),
      bookInstanceCreate(5, 'Aldactone', [classes[0]._id, classes[5]._id], '53746051101', "25mg", "Tablet", [manus[0]._id], [lots[5]._id]),
    ]);
  }