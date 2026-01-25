import { 
  categorizeQuestion, 
  generateCacheKey, 
  getStaticInterpretation,
  getCachedReading,
  setCachedReading 
} from '../lib/interpretation-cache';

// Test cases
const testCases = [
  {
    name: "Love Question with 2 Cards",
    question: "What does the future hold for my love life?",
    cards: [
      { id: 1, name: "Rider" },
      { id: 24, name: "Heart" }
    ],
    spreadId: "sentence-3"
  },
  {
    name: "Career Question with 3 Cards",
    question: "Should I take this new job opportunity?",
    cards: [
      { id: 1, name: "Rider" },
      { id: 25, name: "Ring" },
      { id: 6, name: "Clouds" }
    ],
    spreadId: "sentence-3"
  },
  {
    name: "Health Question with 1 Card",
    question: "How is my health going to be?",
    cards: [
      { id: 3, name: "Ship" }
    ],
    spreadId: "single-card"
  },
  {
    name: "General Question with 5 Cards",
    question: "What should I focus on this month?",
    cards: [
      { id: 1, name: "Rider" },
      { id: 9, name: "Bouquet" },
      { id: 25, name: "Ring" },
      { id: 23, name: "Mice" },
      { id: 35, name: "Anchor" }
    ],
    spreadId: "sentence-5"
  }
];

function runTests() {
  console.log('🧪 Testing Interpretation Cache System\\n');
  
  let cacheHits = 0;
  let staticHits = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Question: ${testCase.question}`);
    console.log(`Cards: ${testCase.cards.map(c => c.name).join(', ')}`);
    
    // Test question categorization
    const category = categorizeQuestion(testCase.question);
    console.log(`Category: ${category}`);
    
    // Test cache key generation
    const cacheKey = generateCacheKey(testCase.cards, testCase.spreadId, category);
    console.log(`Cache Key: ${cacheKey}`);
    
    // Test static interpretation
    const staticInterpretation = getStaticInterpretation(
      testCase.cards, 
      testCase.spreadId, 
      category
    );
    
    if (staticInterpretation) {
      staticHits++;
      console.log(`✅ Static Interpretation Found: ${staticInterpretation.source}`);
      console.log(`Meaning: ${staticInterpretation.meaning.substring(0, 100)}...`);
      
      // Cache it
      setCachedReading(cacheKey, staticInterpretation.meaning, 'static');
    } else {
      console.log(`❌ No Static Interpretation - would use AI`);
    }
    
    // Test memory cache retrieval
    const cached = getCachedReading(cacheKey);
    if (cached) {
      cacheHits++;
      console.log(`✅ Cache Retrieval: ${cached.source}`);
    }
    
    console.log('---\\n');
  });
  
  console.log('📊 Results Summary:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Static Interpretations: ${staticHits}/${totalTests} (${((staticHits/totalTests) * 100).toFixed(1)}%)`);
  console.log(`Cache Hits: ${cacheHits}/${totalTests} (${((cacheHits/totalTests) * 100).toFixed(1)}%)`);
  console.log(`Expected AI Reduction: ${((staticHits/totalTests) * 100).toFixed(1)}%`);
  
  if (staticHits >= totalTests * 0.7) {
    console.log('🎉 EXCELLENT: >70% static interpretations achieved!');
  } else if (staticHits >= totalTests * 0.5) {
    console.log('✅ GOOD: >50% static interpretations achieved');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: <50% static interpretations');
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

export { runTests };