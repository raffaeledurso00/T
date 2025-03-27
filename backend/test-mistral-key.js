// test-mistral-key.js
require('dotenv').config(); // Make sure to load .env file

console.log('Testing Mistral API Key...');
console.log('MISTRAL_API_KEY present:', !!process.env.MISTRAL_API_KEY);
console.log('MISTRAL_API_KEY first 4 chars:', process.env.MISTRAL_API_KEY ? process.env.MISTRAL_API_KEY.substring(0, 4) : 'none');

const testMistralImport = async () => {
  try {
    console.log('Trying to import @mistralai/mistralai...');
    
    // Import the module
    const mistralModule = await import('@mistralai/mistralai');
    console.log('Import successful!');
    console.log('Module structure:', Object.keys(mistralModule));
    
    // Use the default export directly
    const MistralClient = mistralModule.default;
    console.log('MistralClient found:', typeof MistralClient);
    
    console.log('Creating client...');
    const client = new MistralClient(process.env.MISTRAL_API_KEY);
    console.log('Client created successfully!');
    
    console.log('Testing a simple chat completion...');
    const response = await client.chat({
      model: 'mistral-tiny',
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    
    console.log('Response received:');
    console.log(response.choices[0].message.content);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:');
    console.error(error.message);
    if (error.stack) console.error(error.stack);
  }
};

testMistralImport();