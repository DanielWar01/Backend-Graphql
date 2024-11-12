import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let books = require('./resources/data.cjs');
import fs from 'fs';

// Definición de esquemas con GraphQL
const typeDefs = `#graphql
    type Author {
        name: String
        country: String
    }
    type Book {
        id: Int
        title: String
        author: Author
        pages: Int
        year: Int
        genre: String
    }
    type Query {
        books: [Book]
        findById(id: Int!): Book
        findByAuthor(author: String): [Book]
        findByGenre(genre: String): [Book]
    }
    type Mutation {
        deleteBook(id: Int!): [Book]
        addBook(book: AddBookInput): Book
        updateBook(id: Int!, edits: EditBookInput): Book
    }
    input AddBookInput {
        title: String
        author: AuthorInput
        pages: Int
        year: Int
        genre: String
    }
    input AuthorInput {
        name: String
        country: String
    }
    input EditBookInput {
        title: String
        author: EditAuthorInput
        pages: Int
        year: Int
        genre: String
    }
    input EditAuthorInput {
        name: String
        country: String
    }
`;

// Definición de resolvers
const resolvers = {
    Query: {
        books: () => books,
        findById: (_, args) => books.find(book => book.id === args.id),
        findByAuthor: (_, args) => books.filter(book => book.author.name === args.author),
        findByGenre: (_, args) => books.filter(book => book.genre === args.genre),
    },
    Mutation: {
        deleteBook: (_, args) => {
            books = books.filter(book => book.id !== args.id);
            fs.writeFileSync('./resources/data.cjs', `module.exports = ${JSON.stringify(books, null, 2)};`);
            return books;  
        },
        addBook: (_, args) => {
            let newBook = {
                id: Math.floor(Math.random() * 10000),
                ...args.book
            };
            books.push(newBook); 
            fs.writeFileSync('./resources/data.cjs', `module.exports = ${JSON.stringify(books, null, 2)};`); 
            return newBook;
        },
        updateBook: (_, args) => {
            books = books.map(book => {
                if(book.id === args.id){
                    return {...book, ...args.edits}
                }
                return book;
            });
            fs.writeFileSync('./resources/data.cjs', `module.exports = ${JSON.stringify(books, null, 2)};`); 
            return books.find(book => book.id === args.id);
        }
    }
};

// Configuración del servidor Apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
});

// Iniciar el servidor
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});

console.log(`Server ready at: ${url}`);
