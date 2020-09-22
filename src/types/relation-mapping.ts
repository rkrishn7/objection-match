interface RelationMapping {
  join: {
    with: string;
    on: string;
  };
}

export type RelationMappings = Record<string, RelationMapping>;
