import OpenAI from 'openai'
import { z } from 'zod'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Available models in order of preference
const AVAILABLE_MODELS = ['gpt-4o-mini'] as const

// Helper function to find available model
async function findAvailableModel() {
  try {
    const models = await openai.models.list()
    const availableModel = AVAILABLE_MODELS.find((modelId) =>
      models.data.some((model) => model.id === modelId),
    )

    if (!availableModel) {
      throw new Error('No compatible OpenAI models available')
    }

    return availableModel
  } catch (error) {
    console.warn('Error fetching models, falling back to gpt-3.5-turbo:', error)
    return 'gpt-3.5-turbo'
  }
}

// Update the schema to match Lexical format
const RichTextSchema = z.object({
  root: z.object({
    type: z.string(),
    children: z.array(
      z.object({
        type: z.string(),
        version: z.number(),
        children: z.array(
          z.object({
            type: z.literal('text'),
            text: z.string(),
            version: z.number(),
          }),
        ),
        format: z.string(),
        indent: z.number(),
      }),
    ),
    direction: z.enum(['ltr', 'rtl']).nullable(),
    format: z.enum(['', 'left', 'start', 'center', 'right', 'end', 'justify']),
    indent: z.number(),
    version: z.number(),
  }),
})

// Type for the rematador data structure
const RematadorSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  website: z.string(),
  email: z.string(),
  description: RichTextSchema,
})

type RematadorData = z.infer<typeof RematadorSchema>

export async function generateRematadores(count: number): Promise<RematadorData[]> {
  const model = await findAvailableModel()

  const prompt = `Generate ${count} unique, realistic Uruguayan auctioneers (rematadores) data in JSON format. Each should include:
  - A realistic Uruguayan business name for an auctioneer
  - A real address in Uruguay
  - A realistic Uruguayan phone number
  - A plausible website URL (.com.uy domain)
  - A business email matching the website domain
  - A brief professional description in Spanish (1-2 sentences)
  
  Return the data in this exact format:
  {
    "rematadores": [
      {
        "name": "string",
        "address": "string",
        "phone": "string",
        "website": "string",
        "email": "string",
        "description": "string"
      }
    ]
  }
  
  The data should be varied and realistic, representing different types of auctioneers (rural, urban, specialized, etc.).`

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates realistic test data. Respond only with valid JSON data, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    const rawData = JSON.parse(content)

    if (!rawData.rematadores || !Array.isArray(rawData.rematadores)) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Transform the raw data into our required format
    return rawData.rematadores.map((rematador: any) => ({
      ...rematador,
      description: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: rematador.description, version: 1 }],
              format: '',
              indent: 0,
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      },
    }))
  } catch (error) {
    console.error('Error generating rematadores data:', error)
    throw new Error(
      `Failed to generate rematadores data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// Utility function for other OpenAI interactions
export async function generateContent(prompt: string): Promise<string> {
  const model = await findAvailableModel()

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    return content
  } catch (error) {
    console.error('Error generating content:', error)
    throw new Error(
      `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// Add this type definition after the RematadorSchema
const RemateSchema = z.object({
  title: z.string(),
  description: RichTextSchema,
  start_datetime: z.string(), // ISO date string
  end_datetime: z.string(), // ISO date string
  original_post_url: z.string().optional(),
})

type RemateData = z.infer<typeof RemateSchema>

export async function generateRemates(
  count: number,
  rematadorIds: string[],
): Promise<RemateData[]> {
  const model = await findAvailableModel()

  const prompt = `Generate ${count} unique, realistic auction events (remates) data in JSON format. Each should include:
  - A descriptive title in Spanish for the auction
  - A detailed description in Spanish (2-3 sentences) about what's being auctioned
  - A start date and time (in ISO format) within the next 30 days
  - An end date and time (in ISO format) that's 2-4 hours after the start time
  - Optionally, a URL to an original post (50% chance of having one)

  The auctions should be varied and realistic, including:
  - Rural property auctions
  - Vehicle and machinery auctions
  - Antiques and art auctions
  - Real estate auctions
  - Livestock auctions

  Return the data in this exact format:
  {
    "remates": [
      {
        "title": "string",
        "description": "string",
        "start_datetime": "2024-02-15T14:00:00.000Z",
        "end_datetime": "2024-02-15T17:00:00.000Z",
        "original_post_url": "string or null"
      }
    ]
  }`

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates realistic test data. Respond only with valid JSON data, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    const rawData = JSON.parse(content)

    if (!rawData.remates || !Array.isArray(rawData.remates)) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Transform the raw data into our required format
    return rawData.remates.map((remate: any) => ({
      ...remate,
      description: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: remate.description, version: 1 }],
              format: '',
              indent: 0,
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      },
    }))
  } catch (error) {
    console.error('Error generating remates data:', error)
    throw new Error(
      `Failed to generate remates data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
