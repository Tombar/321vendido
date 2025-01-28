import { getPayload } from 'payload'
import config from '@payload-config'
import { generateRematadores } from '../utils/openai'

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

async function run() {
  try {
    const payload = await getPayload({ config })

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
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second between retries
      }
    }

    if (!rematadores) {
      throw new Error('Failed to generate rematadores data after all retries')
    }

    for (const rematador of rematadores) {
      // Randomly select a logo file
      const logoFilePath = logoFiles[Math.floor(Math.random() * logoFiles.length)]

      // Upload logo
      const logoUpload = await payload.create({
        collection: 'media',
        data: {
          alt: `${rematador.name} Logo`,
        },
        filePath: logoFilePath,
      })

      // Create rematador with logo
      await payload.create({
        collection: 'rematadores',
        data: {
          ...rematador,
          logo: logoUpload.id,
        },
      })
      console.log('CREANDO REMATADOR', rematador.name)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  process.exit(0)
}

await run()
