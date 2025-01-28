import { getPayload } from 'payload'
import config from '@payload-config'

const rematadoresJson: {
  name: string
  address: string
  phone: string
  website: string
  email: string
  logo: number | null
  logoFilePath: string
  description: any
}[] = [
  {
    name: 'Juan Pérez Remates',
    address: 'Av. 18 de Julio 1234',
    phone: '2900 1234',
    website: 'https://juanperezremates.com.uy',
    email: 'contacto@juanperezremates.com.uy',
    logo: null,
    logoFilePath: './public/images/rematadores/5b960517ef45b0f3b1b372d07e3ae444.jpg',
    description: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Rematador con más de 20 años de experiencia en el mercado.',
              },
            ],
            version: 1,
          },
        ],
        direction: 'ltr' as 'ltr' | 'rtl' | null,
        format: '' as '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify',
        indent: 0,
        version: 1,
      },
    },
  },
  {
    name: 'Remates García',
    address: 'Bulevar Artigas 4567',
    phone: '2901 5678',
    website: 'https://rematesgarcia.com.uy',
    email: 'info@rematesgarcia.com.uy',
    logo: null,
    logoFilePath: './public/images/rematadores/5bf91e49c9a9aa2e75bd05340377d836.jpg',
    description: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                text: 'Especialistas en remates rurales y maquinaria agrícola.',
              },
            ],
            version: 1,
          },
        ],
        direction: 'ltr' as 'ltr' | 'rtl' | null,
        format: '' as '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify',
        indent: 0,
        version: 1,
      },
    },
  },
]

async function run() {
  try {
    const payload = await getPayload({ config })

    for (const rematador of rematadoresJson) {
      // Upload logo
      const logoUpload = await payload.create({
        collection: 'media',
        data: {
          alt: `${rematador.name} Logo`,
        },
        filePath: rematador.logoFilePath,
      })

      // Create rematador with logo
      const { logoFilePath, ...rematadorData } = rematador
      await payload.create({
        collection: 'rematadores',
        data: {
          ...rematadorData,
          logo: logoUpload.id,
        },
      })
      console.log('CREANDO REMATADOR', rematador.name)
    }
  } catch (error) {
    console.error(JSON.stringify(error))
    process.exit(1)
  }

  process.exit(0)
}

await run()
