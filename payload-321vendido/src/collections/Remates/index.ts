import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import type { CollectionConfig, CollectionSlug } from 'payload'

export const Remates: CollectionConfig = {
  slug: 'remates',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Título del Remate',
    },
    {
      name: 'rematador',
      type: 'relationship',
      relationTo: 'rematadores' as CollectionSlug,
      required: true,
      label: 'Rematador',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descripción',
    },
    {
      name: 'start_datetime',
      type: 'date',
      required: true,
      label: 'Fecha y Hora de Inicio',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'end_datetime',
      type: 'date',
      required: true,
      label: 'Fecha y Hora de Finalización',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'original_post_url',
      type: 'text',
      label: 'URL del Post Original',
    },
    {
      name: 'cover_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen de Portada',
    },
  ],
} 