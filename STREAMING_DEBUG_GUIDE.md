# Streaming Display Debug Guide

## What Should Happen

When you perform a physical card reading:

1. **Loading Phase (0-2 seconds)**
   - You should see the spinner with "Generating your reading..." message
   - The debug text at the bottom should show: `separatorFound=false | prophecyLength=0`

2. **Prophecy Appears (2-3 seconds)**
   - The loading spinner disappears
   - The card with "Results" and "Explain" tabs appears
   - The golden/amber "Results" tab shows the prophecy starting to stream
   - The debug text at the bottom should change to: `separatorFound=true | prophecyLength=XXX`
   - Badge shows "Streaming..."

3. **Explanation Arrives (3-5 seconds)**
   - Content continues to fill in the Results tab
   - The "Explain" tab becomes enabled (no longer greyed out)
   - Badge still shows "Streaming..."

4. **Complete (5+ seconds)**
   - Both tabs have full content
   - Badge changes to "Complete"
   - You can click between Results and Explain tabs

## How to Test

1. Go to `/read/physical`
2. Enter your question
3. Enter 3 card numbers (e.g., "1 2 3")
4. Click "Analyze My Cards"
5. **Open your browser developer tools** (F12)
6. Go to the **Console** tab
7. Watch for logs that say:
   - `🔮 SEPARATOR FOUND!` - prophecy is arriving
   - `📖 Prophecy length:` - how many characters
   - `AIReadingDisplay rendered with props:` - component state

## Browser Console Debug

You should see console logs like:

```
🔮 SEPARATOR FOUND! Showing prophecy immediately...
📖 Prophecy length: 450 chars
💡 Practical length: 250 chars
🎨 AIReadingDisplay rendered with props: {
  separatorFound: true,
  prophecyLength: 450,
  practicalLength: 250,
  isLoading: false,
  isStreaming: true,
  ...
}
```

## If You Don't See the Streaming

1. Check the console for error messages
2. Make sure your DeepSeek API key is working (try a non-streaming reading first)
3. Check the Badge under the tabs - it should show the current state
4. Look at the debug text at bottom of loading spinner - it tells you `separatorFound` value

## The Key Indicator

The most important thing is: **Do you see the results card appear BEFORE the practical/explanation tab fills in?**

- YES = Streaming is working! ✅
- NO = Something is preventing the separator from being detected ❌

## Technical Details

Files involved:
- `app/read/physical/page.tsx` - Tracks streaming state, calls API
- `components/AIReadingDisplay.tsx` - Displays results based on streaming state
- `app/api/readings/interpret/stream/route.ts` - Streaming API endpoint
