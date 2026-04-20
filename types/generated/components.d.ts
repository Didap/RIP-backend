import type { Schema, Struct } from '@strapi/strapi';

export interface RelationConnection extends Struct.ComponentSchema {
  collectionName: 'components_relation_connections';
  info: {
    description: 'Legame di parentela tra una lapide e un utente';
    displayName: 'Connection';
    icon: 'link';
  };
  attributes: {
    notes: Schema.Attribute.String;
    relation_type: Schema.Attribute.Enumeration<
      [
        'Padre',
        'Madre',
        'Figlio/a',
        'Fratello/Sorella',
        'Coniuge',
        'Partner/Compagno/a',
        'Nonno/a',
        'Bisnonno/a',
        'Zio/a',
        'Cugino/a',
        'Nipote',
        'Suocero/a',
        'Genero/Nuora',
        'Cognato/a',
        'Amico',
        'Padrone',
        'Proprietario',
        'Altro',
      ]
    > &
      Schema.Attribute.Required;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'relation.connection': RelationConnection;
    }
  }
}
