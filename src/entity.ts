import sqlite3 from "sqlite3";
import { AtLeastOne } from "./types";

export class EntityManager<T> {
  private created = false;
  constructor(
    private tableName: string,
    private db: sqlite3.Database,
    private logs: boolean
  ) {
    this.db = db;
    this.tableName = tableName;
    this.logs = logs;
  }

  private entityToKeysAndValues(entity: any) {
    const keys: string[] = [];
    Object.keys(entity).forEach((key) => {
      keys.push(key === "id" ? this.tableName + "id" : key);
    });
    return {
      keys,
      values: Object.values(entity),
      columns: Object.keys(entity).join(", "),
      valuesString: Object.values(entity)
        .map(() => "?")
        .join(", "),
    };
  }

  public async createTableIfDoesntExist(entity: T) {
    if (this.created) return;
    const { keys } = this.entityToKeysAndValues(entity);
    const attributes = [
      [this.tableName + "id", "INTEGER PRIMARY KEY AUTOINCREMENT"],
    ];
    keys.forEach((key) => {
      if (typeof (entity as any)[key] === "string") {
        attributes.push([key, "TEXT"]);
      } else if (typeof (entity as any)[key] === "number") {
        attributes.push([key, "INTEGER"]);
      } else if (typeof (entity as any)[key] === "boolean") {
        attributes.push([key, "BOOLEAN"]);
      } else {
        throw new Error(
          "Unsupported type in entity: " + typeof (entity as any)[key]
        );
      }
    });
    const query = `CREATE TABLE IF NOT EXISTS ${this.tableName} (${attributes
      .map((attribute) => attribute.join(" "))
      .join(", ")})`;
    if (this.logs) console.log(query);
    await this.db.run(query);
    this.created = true;
  }

  public async getAll(callback: (result: T[]) => Promise<void> | void) {
    const tableName = this.tableName;
    const query = `SELECT * FROM ${tableName}`;
    if (this.logs) console.log(query);
    return await this.db.all(query, async (err, rows) => {
      if (err) throw err;
      callback(rows as T[]);
    });
  }

  public async save(entity: T) {
    await this.createTableIfDoesntExist(entity);
    const { keys, valuesString, values } = this.entityToKeysAndValues({
      ...entity,
    });
    const tableName = this.tableName;
    const query = `INSERT INTO ${tableName} (${keys.join(
      ", "
    )}) VALUES (${valuesString})`;
    if (this.logs) console.log(query);
    await this.db.run(query, values);
  }

  public async find(
    attributes: AtLeastOne<T>,
    callback: (result: T[]) => Promise<void> | void,
    limit?: number
  ) {
    const { keys, values } = this.entityToKeysAndValues(attributes);
    const tableName = this.tableName;
    const query =
      `SELECT * FROM ${tableName}` +
      (keys.length
        ? ` WHERE ${keys.map((key) => `${key} = ?`).join(" AND ")}`
        : "");
    if (this.logs) console.log(query);
    return await this.db.all(query, values, async (err, rows) => {
      if (err) throw err;
      if (limit) rows = rows.slice(0, limit);
      await callback(rows as T[]);
    });
  }

  public async delete(attributes: AtLeastOne<T>) {
    const { keys, values } = this.entityToKeysAndValues(attributes);
    const tableName = this.tableName;
    const query =
      `DELETE FROM ${tableName}` +
      (keys.length
        ? ` WHERE ${keys.map((key) => `${key} = ?`).join(" AND ")}`
        : "");
    if (this.logs) console.log(query);
    await this.db.run(query, values);
  }

  public async update(user: AtLeastOne<T>, updatedAttributes: AtLeastOne<T>) {
    const userAttributes = this.entityToKeysAndValues(user);
    const { keys, values } = this.entityToKeysAndValues(updatedAttributes);
    if (!keys.length) return;
    const tableName = this.tableName;
    const query = `UPDATE ${tableName} SET ${keys
      .map((key) => `${key} = ?`)
      .join(", ")} WHERE ${userAttributes.keys
      .map((key) => `${key} = ?`)
      .join(" AND ")}`;
    if (this.logs) console.log(query);
    await this.db.run(query, [...values, ...userAttributes.values]);
  }
}
