/**
 * Quick test script to verify Ollama integration with Mastra
 * Run: npx ts-node test-ollama.ts
 */

import { Agent } from '@mastra/core/agent';

async function testOllama() {
  console.log('🧪 Testing Ollama Integration with Mastra...\n');

  try {
    // Test 1: Basic connectivity
    console.log('1. Testing Ollama connectivity...');
    const agent = new Agent({
      id: 'test-agent',
      name: 'ollama/qwen2.5-coder:latest',
      instructions: 'You are a helpful assistant.',
      baseUrl: 'http://localhost:11434/v1',
    });

    const result = await agent.generate('Respond with just "OK" if you can read this.');

    console.log(`   Response: ${result.text}`);
    console.log('   ✅ Ollama is working!\n');

    // Test 2: Structured output (simulating intent extraction)
    console.log('2. Testing structured output (intent extraction)...');
    const intentResult = await agent.generate(`Extract intent from this ticket:
Title: Add user authentication
Description: Users should be able to sign up and log in

Respond with valid JSON:
{"intent": "clear statement", "keywords": ["keyword1", "keyword2"]}`);

    console.log(`   Response: ${intentResult.text}`);
    const parsed = JSON.parse(intentResult.text);
    console.log('   ✅ Structured output working!\n');
    console.log(`   Parsed:`, parsed);

    console.log('\n🎉 Ollama integration verified with Mastra!');
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Is Ollama running? (ollama serve)');
    console.error('2. Is qwen2.5-coder:latest installed? (ollama pull qwen2.5-coder:latest)');
    console.error('3. Is port 11434 accessible? (curl http://localhost:11434/v1/models)');
  }
}

testOllama();
