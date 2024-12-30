import { AllPossibleSchemaConfigurations } from "./table-schema";

type ParamsArray = (string | number | Date | boolean)[];

type QueryResult = {
    rows: unknown[],
};

export type DbConnection = {
    executeQuery: (query: string, ...parameters: any[]) => Promise<QueryResult>,
};

type DdlGenerators = {
    createTable: {
        parameters: {
            tableName: string,
            columns: Record<string, AllPossibleSchemaConfigurations>,
        },
        returnType: string,
    },
    dropTable: {
        parameters: {
            tableName: string,
        },
        returnType: string,
    },
};

type DqlGenerators = {
    getLatestMigration: {
        parameters: {},
        returnType: string,
    }
    insert: {
        parameters: {
            tableName: string,
            propertiesAndValues: { [field: string]: string | number | boolean | Date },
        },
        returnType: [string, ParamsArray],
    },
};

export type DbInstance = {
    createConnection: () => Promise<DbConnection>,
    ddlGenerators: {
        [TGenerator in keyof DdlGenerators]: (params: DdlGenerators[TGenerator]['parameters']) => DdlGenerators[TGenerator]['returnType']
    },
    dqlGenerators: {
        [TGenerator in keyof DqlGenerators]: (params: DqlGenerators[TGenerator]['parameters']) => DqlGenerators[TGenerator]['returnType']
    },
};