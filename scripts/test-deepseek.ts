
import { getAIReading } from '../lib/deepseek';

async function testDeepSeek() {
  console.log('Testing DeepSeek Integration...');
  
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY is not set in the environment.');
    return;
  }
  
  console.log('DEEPSEEK_API_KEY is set (length: ' + process.env.DEEPSEEK_API_KEY.length + ')');
  
  const request = {
    question: 'What does the future hold?',
    cards: [
      { id: 1, name: 'Rider', position: 0 },
      { id: 2, name: 'Clover', position: 1 },
      { id: 3, name: 'Ship', position: 2 }
    ],
    spreadId: 'past-present-future'
  };
  
  try {
    console.log('Calling getAIReading...');
    const result = await getAIReading(request);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error calling getAIReading:', error);
  }
}

testDeepSeek();
