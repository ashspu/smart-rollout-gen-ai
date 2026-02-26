import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'form-ai-proxy',
      configureServer(server) {
        server.middlewares.use('/api/form-ai', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const env = loadEnv(mode, process.cwd(), '');
          const apiKey = env.ANTHROPIC_API_KEY;

          if (!apiKey) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'no-api-key' }));
            return;
          }

          let body = '';
          for await (const chunk of req) body += chunk;

          try {
            const { schema, uiSchema, message, stepContext } = JSON.parse(body);

            const { default: Anthropic } = await import('@anthropic-ai/sdk');
            const client = new Anthropic({ apiKey });

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

            const response = await client.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              system: systemPrompt,
              messages: [{ role: 'user', content: userContent }],
            });

            const text = response.content[0].text;
            const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const result = JSON.parse(jsonStr);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('Form AI error:', err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    }
  ],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    open: true
  }
}))
