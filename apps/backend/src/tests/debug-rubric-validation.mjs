import fs from 'fs';

// Load the rubric schema and test validation
const { RubricSchema } = await import('../schemas/rubric.schema.ts');

// Load an existing rubric as template
const defaultRubric = JSON.parse(fs.readFileSync('./src/config/presets/defaultRubric.docx.json', 'utf8'));

console.log('Testing rubric validation...');
console.log('Rubric content:', JSON.stringify(defaultRubric, null, 2));

// Test with Zod schema
const result = RubricSchema.safeParse(defaultRubric);

if (result.success) {
  console.log('Rubric is valid!');
  console.log('Parsed rubric:', JSON.stringify(result.data, null, 2));
} else {
  console.log('Rubric validation failed:');
  console.log('Errors:', JSON.stringify(result.error.errors, null, 2));
}