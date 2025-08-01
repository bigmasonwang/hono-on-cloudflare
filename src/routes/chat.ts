import { Hono } from 'hono'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, convertToModelMessages } from 'ai'
import { type Contexts } from '@/factories/app-factory'

const chat = new Hono<Contexts>().post('/', async (c) => {
  try {
    const { messages } = await c.req.json()

    const apiKey = c.env.OPENAI_API_KEY
    if (!apiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500)
    }

    const openai = createOpenAI({
      apiKey,
    })

    const result = streamText({
      model: openai('gpt-4.1-nano'),
      messages: convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return c.json({ error: 'Failed to process chat request' }, 500)
  }
})

export default chat
