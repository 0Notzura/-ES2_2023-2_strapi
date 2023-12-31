import { enumType } from 'nexus';

import type { Context } from '../../types';

export default ({ strapi }: Context) => {
  const { PUBLICATION_STATE_TYPE_NAME } = strapi.plugin('graphql').service('constants');

  return {
    /**
     * An enum type definition representing a publication state
     * @type {NexusEnumTypeDef}
     */
    PublicationState: enumType({
      name: PUBLICATION_STATE_TYPE_NAME,

      members: {
        // Published only
        LIVE: 'live',
        // Published & draft
        PREVIEW: 'preview',
      },
    }),
  };
};
