/**
 * Utility type to convert a union to an intersection.
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/**
 * The possible types that any given field may be.
 */
export type FieldType = keyof SchemaFields;

/**
 * Schema definition options which belong to all field types.
 */
export type CommonSchemaFields = {
    __type: FieldType,
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
 * Map of each field type to it's native JS type and potential schema definition options.
 */
type SchemaFields = {
    bigint: {
        jsType: number,
        configuration: CommonSchemaFields & PrimaryKeyFields & IntegerPrimaryKeyFields,
    },
    dateTime: {
        jsType: Date,
        configuration: CommonSchemaFields,
    },
    int: {
        jsType: number,
        configuration: CommonSchemaFields & PrimaryKeyFields & IntegerPrimaryKeyFields,
    },
    string: {
        jsType: string,
        configuration: CommonSchemaFields & PrimaryKeyFields,
    },
};

/**
 * All possible options for a field configuration. Some fields may not support all options.
 */
export type AllPossibleSchemaConfigurations = Partial<UnionToIntersection<SchemaFields[keyof SchemaFields]['configuration']>>;

/**
 * Generic SchemaBuilder type. Requires a method for each configuration option which will in turn, enable that option in the schema.
 */
export type SchemaBuilder<TFieldType extends keyof SchemaFields> = {
    __build: () => SchemaFields[TFieldType]['configuration'],
} & { [P in keyof SchemaFields[TFieldType]['configuration']]: () => SchemaBuilder<TFieldType> };

/**
 * Generic schema builder.
 * @param options The current schema options.
 * @returns Schema builder with latest options.
 */
function schemaBuilder<TFieldType extends keyof SchemaFields>(options: SchemaFields[TFieldType]['configuration']): SchemaBuilder<TFieldType> {
    const updaters = (Object.keys(options) as Array<keyof typeof options>).reduce((acc, curr) => ({
        ...acc,
        [curr]: () => schemaBuilder<TFieldType>({ ...options, [curr]: true }),
    }), {} as Record<keyof typeof options, () => SchemaBuilder<TFieldType>>);

    return {
        __build: () => options,
        ...updaters,
    };
}

/**
 * BigInt schema builder.
 */
export function bigIntSchemaBuilder(): SchemaBuilder<'bigint'> {
    return schemaBuilder<'bigint'>({
        __type: 'bigint',
        unique: false,
        required: false,
        primaryKey: false,
        autoIncrement: false,
    });
}

export function dateTimeSchemaBuilder(): SchemaBuilder<'dateTime'> {
    return schemaBuilder<'dateTime'>({
        __type: 'dateTime',
        unique: false,
        required: false,
    });
}

export function intSchemaBuilder(): SchemaBuilder<'int'> {
    return schemaBuilder<'int'>({
        __type: 'int',
        unique: false,
        required: false,
        primaryKey: false,
        autoIncrement: false,
    });
}

export function stringSchemaBuilder(): SchemaBuilder<'string'> {
    return schemaBuilder<'string'>({
        __type: 'string',
        unique: false,
        required: false,
        primaryKey: false,
    });
}