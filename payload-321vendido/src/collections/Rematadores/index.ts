import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import type { CollectionConfig } from 'payload'

export const Rematadores: CollectionConfig = {
  slug: 'rematadores' as const,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre del Rematador',
    },
    {
      name: 'address',
      type: 'text',
      label: 'Dirección',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Teléfono',
    },
    {
      name: 'website',
      type: 'text',
      label: 'Sitio Web',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Correo Electrónico',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descripción',
      defaultValue: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  text: '',
                  version: 1,
                },
              ],
            },
          ],
        },
        version: 1,
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
  ],
}
