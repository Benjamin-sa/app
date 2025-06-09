/**
 * Test script to validate HTML sanitization integration
 */

const htmlSanitizerService = require("./services/htmlSanitizer.service");
const ValidationUtils = require("./utils/validation.utils");

// Test cases
const testCases = [
  {
    name: "Basic rich text",
    input: "<p>Hello <strong>world</strong>! This is <em>italic</em> text.</p>",
    shouldPass: true,
  },
  {
    name: "Rich text with emoji",
    input:
      "<p>Check out this car! 🚗 <strong>Amazing</strong> performance!</p>",
    shouldPass: true,
  },
  {
    name: "Malicious script",
    input: '<p>Hello</p><script>alert("XSS")</script><p>World</p>',
    shouldPass: true, // Script should be removed
  },
  {
    name: "Too short content",
    input: "<p>Hi</p>",
    shouldPass: false, // Less than 10 characters
  },
  {
    name: "Empty content",
    input: "",
    shouldPass: false,
  },
  {
    name: "Only HTML tags",
    input: "<p></p><br><strong></strong>",
    shouldPass: false, // No actual text content
  },
];

console.log("🧪 Testing HTML Sanitization Integration\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: ${testCase.input}`);

  try {
    // Test validation
    ValidationUtils.htmlContent(testCase.input, "TEST");

    // Test sanitization
    const sanitized = htmlSanitizerService.sanitizeForumContent(testCase.input);
    console.log(`Sanitized: ${sanitized}`);

    // Extract text content for verification
    const textContent = ValidationUtils.extractTextFromHtml(sanitized);
    console.log(`Text content: "${textContent}" (${textContent.length} chars)`);

    if (testCase.shouldPass) {
      console.log("✅ PASS - Content processed successfully");
    } else {
      console.log("❌ UNEXPECTED PASS - Should have failed validation");
    }
  } catch (error) {
    if (!testCase.shouldPass) {
      console.log(`✅ EXPECTED FAIL - ${error.message}`);
    } else {
      console.log(`❌ UNEXPECTED FAIL - ${error.message}`);
    }
  }

  console.log("---\n");
});

console.log("✨ HTML Sanitization test completed!");
