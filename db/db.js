const mongodb = require("mongodb");

module.exports = class Database {
  constructor(db, dbName) {
    this._db = db;
    this._dbName = dbName;
  }
  static async connect(url, dbName) {
    return new Promise((resolve, reject) => {
      const mongoClient = new mongodb.MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      mongoClient
        .connect()
        .then((db) => {
          const dbc = new this(db, dbName);
          resolve(dbc);
        })
        .catch(reject);
    });
  }
  async GetToken(_token) {
    return new Promise((resolve, reject) => {
      if (!_token) {
        reject("Provide a valid token hash");
      }
      const mongod = this._db.db(this._dbName);
      mongod
        .collection("OauthTokens")
        .find(
          {
            hash: _token,
          },
          {
            projection: {
              _id: 0,
            },
          }
        )
        .toArray()
        .then((res) => {
          resolve(res[0]);
        })
        .catch(reject);
    });
  }
  async SetToken(_data) {
    return new Promise((resolve, reject) => {
      if (!_data) {
        reject("Provide a valid Data");
      }
      const mongod = this._db.db(this._dbName);
      mongod
        .collection("OauthTokens")
        .insertOne(_data)
        .then((res) => {
          resolve(res);
        })
        .catch(reject);
    });
  }

  async GetGuildData(_gid) {
    return new Promise((resolve, reject) => {
      if (!_gid) {
        reject("Provide a valid guild id");
      }
      const mongod = this._db.db(this._dbName);
      mongod
        .collection("AutoPostWebhook")
        .find(
          {
            id: _gid,
          },
          {
            projection: {
              _id: 0,
            },
          }
        )
        .toArray()
        .then((res) => {
          resolve(res[0]);
        })
        .catch(reject);
    });
  }
  async SetGuildData(_data) {
    return new Promise((resolve, reject) => {
      if (!_data) {
        reject("Provide valid Data");
      }
      const mongod = this._db.db(this._dbName);
      mongod
        .collection("AutoPostWebhook")
        .insertOne(_data)
        .then((res) => {
          resolve(res);
        })
        .catch(reject);
    });
  }
  async UpdateGuildData(id, update) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Provide a valid id");
      }
      if (!update) {
        reject("Provide a valid update data");
      }
      const mongod = this._db.db(this._dbName);
      mongod
        .collection("AutoPostWebhook")
        .updateOne(
          {
            id: id,
          },
          {
            $set: update,
          }
        )
        .then((res) => {
          resolve(res);
        })
        .catch(reject);
    });
  }
};
