import { getPayload } from 'payload'
import config from '@payload-config'
import { generateRematadores, generateRemates } from '../utils/openai'

// Sample logo files - you should have these in your project
const logoFiles = [
  './public/images/rematadores/5b960517ef45b0f3b1b372d07e3ae444.jpg',
  './public/images/rematadores/5bf91e49c9a9aa2e75bd05340377d836.jpg',
  './public/images/rematadores/043d7f152f354e9cc0a73f1baf474a67.jpg',
  './public/images/rematadores/5033b54300c955dd43581ce0ce1d245c.jpg',
  './public/images/rematadores/b042c07dbb622efd9e751f603bd86cc6.jpg',
  './public/images/rematadores/cf1b6833a8eb39b94402fbdb89729e13.jpg',
  './public/images/rematadores/d0b2509c08000f3dc7fde827e0124cb3.png',
  './public/images/rematadores/f4d405fff7ea8f800afadd377aba3c97.jpg',
]

const rematesFiles = [
  './public/images/remates/7ed939692573fdd83c85fc40690fdd99.jpg',
  './public/images/remates/441c08e6b76cd1454ad2c8476c489a54.jpg',
  './public/images/remates/916d7041330fa63143d985ef301082ef.jpg',
  './public/images/remates/a38f8e20a9548d38a256f89823aa84e2.jpg',
  './public/images/remates/aea27c981ae92ed43ba87aaa876bd26b.jpg',
  './public/images/remates/b4510d90a1fa91f192b694be9ca2801a.jpg',
  './public/images/remates/f49e4ce638b23069ec893c390e62b97f.jpg',
]

async function run() {
  try {
    const payload = await getPayload({ config })

    // Create rematadores first
    let retries = 3
    let rematadores

    while (retries > 0) {
      try {
        rematadores = await generateRematadores(5)
        break
      } catch (error) {
        retries--
        if (retries === 0) {
          throw error
        }
        console.log(`Failed attempt, retrying... (${retries} attempts remaining)`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!rematadores) {
      throw new Error('Failed to generate rematadores data after all retries')
    }

    const createdRematadorIds: string[] = []

    // Create rematadores
    for (const rematador of rematadores) {
      const logoFilePath = logoFiles[Math.floor(Math.random() * logoFiles.length)]

      const logoUpload = await payload.create({
        collection: 'media',
        data: {
          alt: `${rematador.name} Logo`,
        },
        filePath: logoFilePath,
      })

      const createdRematador = await payload.create({
        collection: 'rematadores',
        data: {
          ...rematador,
          logo: logoUpload.id,
        },
      })

      createdRematadorIds.push(createdRematador.id.toString())
      console.log('CREANDO REMATADOR', rematador.name)
    }

    // Now create remates
    retries = 3
    let remates

    while (retries > 0) {
      try {
        // Generate 2-4 remates per rematador
        const rematesCount = createdRematadorIds.length * (2 + Math.floor(Math.random() * 3))
        remates = await generateRemates(rematesCount, createdRematadorIds)
        break
      } catch (error) {
        retries--
        if (retries === 0) {
          throw error
        }
        console.log(`Failed attempt for remates, retrying... (${retries} attempts remaining)`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!remates) {
      throw new Error('Failed to generate remates data after all retries')
    }

    // Create remates
    for (const remate of remates) {
      // Randomly assign a rematador
      const rematadorId =
        createdRematadorIds[Math.floor(Math.random() * createdRematadorIds.length)]

      if (!rematadorId) {
        throw new Error('No rematador ID found')
      }

      // Randomly select an image for cover
      const coverImagePath = rematesFiles[Math.floor(Math.random() * rematesFiles.length)]

      const coverImage = await payload.create({
        collection: 'media',
        data: {
          alt: `${remate.title} Cover Image`,
        },
        filePath: coverImagePath,
      })

      await payload.create({
        collection: 'remates',
        data: {
          ...remate,
          rematador: parseInt(rematadorId),
          cover_image: coverImage.id,
        },
      })
      console.log('CREANDO REMATE', remate.title)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  process.exit(0)
}

await run()
