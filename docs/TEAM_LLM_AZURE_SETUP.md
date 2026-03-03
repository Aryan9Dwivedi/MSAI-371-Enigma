# Team LLM Setup — Azure API Key Sharing

Mia has connected the project to Azure OpenAI (GPT) and it's working. To let the whole team use it, here are practical options.

## Option 1: Azure RBAC (Recommended if professor allows)

If the Azure resource group allows adding users:

1. Mia (or resource owner) goes to **Azure Portal** → Resource Group → **Access control (IAM)**
2. Add each team member with role **Cognitive Services User**
3. Each person signs in with their own Microsoft account
4. Use **Azure CLI** or **DefaultAzureCredential** so no API key is shared

*Requires backend code change to use Azure identity instead of API key.*

## Option 2: Shared API Key (Simplest for demo)

**Do NOT commit the key to git.**

1. Mia creates a key in Azure Portal: **Resource** → **Keys and Endpoint** → copy Key 1
2. Share via **Signal / WhatsApp / 1Password shared vault** (not Slack/email)
3. Each person creates `backend/.env`:

```env
LLM_EXPLANATION_ENABLED=true
LLM_PROVIDER=azure
LLM_API_KEY=<paste-key-here>
LLM_BASE_URL=https://<your-resource-name>.openai.azure.com
LLM_MODEL=<deployment-name>
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

4. Add `.env` to `.gitignore` (already done)

## Option 3: 1Password / Bitwarden Shared Vault

1. Create a shared vault for the team
2. Mia adds a "Secure Note" with:
   - `LLM_API_KEY`
   - `LLM_BASE_URL`
   - `LLM_MODEL` (deployment name)
3. Team members copy values into their local `backend/.env`

## What Mia needs to share

| Variable | Where to find |
|---------|---------------|
| `LLM_BASE_URL` | Azure Portal → Resource → Keys and Endpoint → Endpoint |
| `LLM_MODEL` | Azure Portal → Azure OpenAI → Deployments → your deployment name |
| `LLM_API_KEY` | Azure Portal → Resource → Keys and Endpoint → Key 1 |

---

**Note:** GPT models (e.g. gpt-4o-mini) generally produce better explanations than local LLaMA. Using Azure is recommended for demos.
