import { DbInstance, FieldType } from "@ef-js/core";
import { Database } from 'sqlite3';

export function sqlite(connectionString: string): DbInstance {
  return {
    createConnection: async () => {
      const connection = await new Promise<Database>((resolve, reject) => {
        const conn = new Database(connectionString, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(conn);
          }
        });
      });

      return {
        executeQuery: async (query: string, ...parameters: any[]) => {
          const result = await new Promise<unknown[]>((resolve, reject) => {
            connection.all(query, parameters, (err: any, rows: unknown[] | PromiseLike<unknown[]>) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            });
          });

          return {
            rows: result,
          };
        },
      };
    },
    ddlGenerators: {
      createTable: (params) => {
        const columnTypeMap: Record<FieldType, string> = {
          'bigint': 'INTEGER',
          'dateTime': 'DATETIME',
          'int': 'INTEGER',
          'string': 'TEXT',
        };

        const fields = Object.keys(params.columns) as Array<keyof typeof params.columns>;
        const columnStatements = fields.map(f => {
          const columnParams = params.columns[f];
          const columnDeclaration = [columnParams.columnName ?? f, columnTypeMap[columnParams.__type!]];

          if (columnParams.primaryKey) {
            columnDeclaration.push('PRIMARY KEY');

            if (columnParams.autoIncrement) {
              columnDeclaration.push('AUTOINCREMENT');
            }
          }

          if (columnParams.required) {
            columnDeclaration.push('NOT NULL');
          }

          if (columnParams.unique) {
            columnDeclaration.push('UNIQUE');
          }

          return columnDeclaration.join(' ');
        });

        return `CREATE TABLE ${params.tableName} (\n${columnStatements.map(s => ' '.repeat(4) + s).join(',\n')}\n)`;
      },
      dropTable: (params) => {
          return `DROP TABLE ${params.tableName}`;
      },
    },
    dqlGenerators: {
      getLatestMigration: () =>  `
        CREATE TABLE IF NOT EXISTS __migrations (
            MigrationId TEXT NOT NULL UNIQUE
        );
      
        SELECT * FROM __migrations ORDER BY MigrationId DESC LIMIT 1;`,
      insert: (params) => {
        const columns = Object.keys(params.propertiesAndValues).join(', ');
        const valuePlaceholders = '?'.repeat(Object.keys(params.propertiesAndValues).length).split('').join(', ');

        const sql = `INSERT INTO ${params.tableName} (${columns}) VALUES (${valuePlaceholders})`
        return [sql, Object.values(params.propertiesAndValues)];
      },
    },
  };
}
