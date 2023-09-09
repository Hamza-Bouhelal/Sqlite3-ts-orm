import fs from "fs";
import sqlite3 from "sqlite3";
import { EntityManager } from "./entity";
import path from "path";
import { EntityInterface } from "./types";

export class DbManager {
  private db: sqlite3.Database;
  private logs: boolean;
  private path: string;
  private dbDir: string;
  static entityManagers: { [key: string]: EntityManager<any> } = {};

  constructor(config?: { logs: boolean; path: string }) {
    this.logs = config ? (config.logs ? config.logs : false) : false;
    this.dbDir = path.resolve(
      config ? (config.path ? config.path : "./db") : "./db"
    );
    this.path = path.resolve(this.dbDir, "db.sqlite3");
    if (this.logs) console.log("db path", this.path);
  }

  public async initDB() {
    try {
      fs.mkdirSync(this.dbDir);
    } catch {
      if (this.logs) console.log("DB dir already exists");
    }
    if (!fs.existsSync(this.path)) {
      if (this.logs) console.log("Creating DB");
      fs.writeFileSync(this.path, "");
    }
    this.db = new sqlite3.Database(this.path, (err) => {
      if (!this.logs) return;
      if (err) {
        console.error(err.message);
      }
      console.log("Connected to the database.");
    });
  }

  public getEntityManager<T extends EntityInterface>(
    tableName: string
  ): EntityManager<T> {
    if (!DbManager.entityManagers[tableName]) {
      DbManager.entityManagers[tableName] = new EntityManager<T>(
        tableName,
        this.db,
        this.logs
      );
    }
    return DbManager.entityManagers[tableName];
  }
}
