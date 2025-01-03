import { AllPossibleSchemaConfigurations, dataTypes, SchemaBuilder } from "./table-schema";

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

type DefineDatabaseConfig<TEntities> = {
    entities: {
        [EntityName in keyof TEntities]: {
            options?: {
                tableName?: string,
            },
            columnSpec: {
                [Column in keyof TEntities[EntityName]]: SchemaBuilder<TEntities[EntityName][Column]>
            }
        }
    },
};

type GetEntityFields<TEntity> = {
    [P in keyof TEntity]: TEntity[P];
}

type SliceQuerySegment = {
    start: number | undefined,
    end: number | undefined,
};

type FilterQuerySegment<TEntity> = {
    expression: (entity: TEntity) => boolean,
};

type QuerySegment<TEntity> = {
    type: 'filter' | 'slice',
    properties: FilterQuerySegment<TEntity> | SliceQuerySegment,
};

type QueryBuilder<TEntity> = {
    querySegments: QuerySegment<TEntity>[],
    execute: (dbInstance: DbInstance) => Promise<TEntity[]>,
    filter: (expression: (entity: GetEntityFields<TEntity>) => boolean) => QueryBuilder<TEntity>,
    find: (expression: (entity: GetEntityFields<TEntity>) => boolean) => Promise<TEntity | null>,
    slice: (start?: number, end?: number) => QueryBuilder<TEntity>,
};

type OmitPrimaryKeys<TEntity> = {
    [P in keyof TEntity]: TEntity[P] // TODO
};

type Repository<TEntity> = { [P in keyof QueryBuilder<TEntity>]: QueryBuilder<TEntity>[P] } & {
    add: (entity: OmitPrimaryKeys<TEntity>) => void,
};

export type ChangeEntry<TEntities> = {
    entityType: keyof TEntities,
    entity: GetEntityFields<TEntities[keyof TEntities]>,
    originalValues: Record<symbol, unknown> | null,
    state: 'new' | 'unchanged' | 'changed' | 'deleted',
};

type ChangeTracker<TEntities> = {
    entries: ChangeEntry<TEntities>[],
};

type DbConnectionLifetime<TEntities> = { [Entity in keyof TEntities]: Repository<TEntities[Entity]> } & {
    dispose: () => void,
    saveChanges: () => Promise<void>,
    changeTracker: ChangeTracker<TEntities>,
};

type DbHandle<TEntities> = {
    __entitiesType?: TEntities,
    createLifetime: () => DbConnectionLifetime<TEntities>,
};

function defineContext<TEntities>(config: DefineDatabaseConfig<TEntities>): DbHandle<TEntities> {
    return {
        createLifetime: () => {
            /* Todo */
        },
    };
}

const db = defineContext({
    entities: {
        users: {
            options: {
                tableName: 'users',
            },
            columnSpec: {
                id: dataTypes.bigint().primaryKey().autoIncrement(),
                name: dataTypes.string().required(),
                email: dataTypes.string().required().unique(),
                createdAt: dataTypes.dateTime().required(),
            }
        },
    },
});

const connection = db.createLifetime();
connection.users.filter(u => u.name.startsWith('test'));