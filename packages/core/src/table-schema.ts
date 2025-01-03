/**
 * Schema definition options which belong to all field types.
 */
export type CommonSchemaFields = {
    __type: FieldTypes,
    unique: boolean,
    required: boolean,
    columnName?: string,
};

/**
 * Schema definition options for fields which may be used as a primary key.
 */
type PrimaryKeyFields = {
    primaryKey: boolean,
};

/**
 * Schema definition options for fields which support auto-increment.
 */
type IntegerPrimaryKeyFields = {
    autoIncrement: boolean,
};

/**
 * Type to infer the configuration options available for the field based on it's
 * underlying JS type.
 */
type InferConfig<TUnderlying> = TUnderlying extends bigint ?
    { configuration: CommonSchemaFields & PrimaryKeyFields & IntegerPrimaryKeyFields } :
    TUnderlying extends number ?
        { configuration: CommonSchemaFields & PrimaryKeyFields & IntegerPrimaryKeyFields } :
        TUnderlying extends Date ?
            { configuration: CommonSchemaFields } :
            TUnderlying extends string ?
                { configuration: CommonSchemaFields & PrimaryKeyFields }
                : never;

/**
 * Type representing all possible fields that a column's configuration *may* have on it.
 */
export type AllPossibleSchemaConfigurations = CommonSchemaFields & Partial<PrimaryKeyFields & IntegerPrimaryKeyFields>;

/**
 * Generic SchemaBuilder type. Requires a method for each configuration option which will in turn, enable that option in the schema.
 */
export type SchemaBuilder<TUnderlying> = {
    __type: string,
    __build: () => InferConfig<TUnderlying>,
} & { [P in keyof InferConfig<TUnderlying>['configuration']]: () => SchemaBuilder<TUnderlying> };

/**
 * Generic schema builder.
 * @param options The current schema options.
 * @returns Schema builder with latest options.
 */
function schemaBuilder<TUnderlying>(options: InferConfig<TUnderlying>['configuration']): SchemaBuilder<TUnderlying> {
    const updaters = (Object.keys(options) as Array<keyof typeof options>).reduce((acc, curr) => ({
        ...acc,
        [curr]: () => schemaBuilder<TUnderlying>({ ...options, [curr]: true }),
    }), {} as Record<keyof typeof options, () => SchemaBuilder<TUnderlying>>);

    return {
        __build: () => options,
        ...updaters,
    };
}

/**
 * Each possible data type and the default parameters for each.
 */
export const dataTypes = {
    bigint: () => schemaBuilder<bigint>({
        __type: 'bigint',
        unique: false,
        required: false,
        primaryKey: false,
        autoIncrement: false,
    }),
    dateTime: () => schemaBuilder<Date>({
        __type: 'dateTime',
        unique: false,
        required: false,
    }),
    int: () => schemaBuilder<number>({
        __type: 'int',
        unique: false,
        required: false,
        primaryKey: false,
        autoIncrement: false,
    }),
    string: () => schemaBuilder<string>({
        __type: 'string',
        unique: false,
        required: false,
        primaryKey: false,
    }),
}

/**
 * Collection of all possible field types supported by ef-js.
 */
export type FieldTypes = keyof typeof dataTypes;