// dbConnect.js
require('dotenv').config();
const hbase = require('hbase');

const client = hbase({
  host: process.env.HBASE_HOST || 'localhost',
  port: parseInt(process.env.HBASE_PORT, 10) || 8080
});

async function dbConnect() {
  return new Promise((resolve, reject) => {
    client.tables((err, tables) => {
      if (err) {
        console.error('Error connecting to HBase:', err);
        return reject(err);
      }
      console.log('Connected to HBase successfully. Tables:', tables);
      resolve();
    });
  });
}

async function getAsyncTable(tableName) {
  const table = client.table(tableName);
  return {
    get: (rowKey) => {
      return new Promise((resolve, reject) => {
        table.row(rowKey).get((err, data) => {
          if (err) {
            if (err.code === 404) {
              return resolve(null); // Not found
            } else {
              return reject(err);
            }
          }
          resolve(data || null);
        });
      });
    },
    put: (rowKey, values) => {
      return new Promise((resolve, reject) => {
        table.row(rowKey).put(values, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      });
    },
    scan: () => {
      return new Promise((resolve, reject) => {
        const scanner = table.scan(); // Assuming your client supports scan like this
        const scanResults = [];
        
        scanner
          .on('error', (err) => {
            reject(err);
          })
          .on('readable', function () {
            let row;
            while ((row = this.read())) {
              scanResults.push(row);
            }
          })
          .on('end', function () {
            resolve(scanResults);
          });
      });
    }
  };
}

module.exports = { dbConnect, getAsyncTable, client };