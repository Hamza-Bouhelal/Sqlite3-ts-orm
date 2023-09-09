# Sqlite3-ts-orm

This project is a typescript ORM that integrates with sqlite3.

## Installation:

### NPM:

```
npm init -y
npm install sqlite3-ts-orm
```

### YARN:

```
yarn init
yarn add sqlite3-ts-orm
```

## dbManager:

The class `dbManager` provides a method to create a db.sqlite3 database, connect to it using package sqlite3, and provide a method that implements the factory design pattern to initiate instance of the `EntityManager`, A simple example of how to make use of it:

```ts
import { EntityInterface, DbManager } from "sqlite3-ts-orm";

interface UserModal extends EntityInterface {
    name: string;
    email: string;
    password: string;
}

const dbManager = new DbManager({ logs: false });

//creates db.sqlite3 file if it doesn't exist, and initiates a connection to the db
await dbManager.initDB();

//create an entity manager from the interface UserModal, with table name "User"
const UserManager = dbManager.getEntityManager<UserModal>("User");

[
    { name: "John", email: "fez", password: "fez" },
    { name: "John", email: "elvis", password: "elvis" },
].forEach(async (user) => {
    await UserManager.save(user);
});

await UserManager.delete({name: "John"});

await UserManager.find({{name: "John"}}, async (users: UserModal[]) => {
    console.log(users);
});
```
