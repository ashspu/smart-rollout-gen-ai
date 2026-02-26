import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  try {
    const { schema, uiSchema, message, stepContext } = JSON.parse(event.body);

    const systemPrompt = `You are a JSON Schema form editor for a utility meter rollout platform. Users describe changes to form fields in natural language, and you return the modified schema.

Return ONLY a valid JSON object (no markdown fences, no extra text) with these exact fields:
{
  "schema": { the complete updated JSON Schema object },
  "uiSchema": { the complete updated uiSchema for @rjsf/core },
  "message": "Brief markdown description of changes made"
}

JSON Schema rules:
- The schema must have "type": "object" at root level
- Keep existing "title" and "description" unless asked to change
- Field types: string, number, integer, boolean, array, object
- Use "format" for: date, date-time, email, uri
- Use "enum" for dropdowns/selects
- Use "title" for field labels, "description" for help text
- Use "default" for default values
- Use "required" array at the schema root level
- Use "minimum"/"maximum" for number constraints
- Keep field keys in camelCase

uiSchema rules (@rjsf/core):
- "ui:readonly": true for read-only / auto-generated / display-only / non-editable fields
- "ui:widget": "textarea" for multiline text fields
- "ui:widget": "hidden" for hidden fields
- "ui:help": "text" for help text below a field
- "ui:placeholder": "text" for placeholder text

When making a field auto-generated or read-only or display-only:
- Set "ui:readonly": true in uiSchema for that field
- Add a sensible default value (e.g., "AUTO-" prefix for IDs, current date for timestamps)
- Append "(auto-generated)" to the field's description

Always return the COMPLETE schema and uiSchema, not just the changed parts.

Context: Form for the "${stepContext.stepName}" step in the "${stepContext.phaseName}" phase.
Step purpose: ${stepContext.stepDetail || 'General data capture'}
Step ID: ${stepContext.stepId} | Phase ID: ${stepContext.phaseId}

Keep "message" to 1-2 sentences using **bold** for field names.`;

    const userContent = `Current JSON Schema:\n${JSON.stringify(schema, null, 2)}\n\nCurrent uiSchema:\n${JSON.stringify(uiSchema, null, 2)}\n\nUser request: "${message}"`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const response = await bedrock.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.content[0].text;
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('Form AI error:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
