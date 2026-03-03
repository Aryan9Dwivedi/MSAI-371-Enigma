# Azure LLM Setup — Personal Account (School-Provided)

Use your own Azure account and API key. No sharing required.

## Step 1: Log in to Azure Portal

1. Open https://portal.azure.com
2. Sign in with your school Azure account

## Step 2: Create Azure OpenAI Resource (if not already created)

1. Search for **Azure OpenAI**
2. Click **Azure OpenAI** → **Create**
3. Select your **Subscription** and **Resource Group**
4. **Region**: e.g. East US or West Europe
5. **Name**: e.g. kraft-llm
6. **Pricing tier**: Free F0 or S0
7. Click **Review + Create** → **Create**

## Step 3: Deploy Model

1. After creation, open the resource
2. Left menu → **Azure OpenAI Studio** (or **Models**)
3. Click **Deployments** → **Create new deployment**
4. **Model**: e.g. gpt-4o-mini or gpt-4o
5. **Deployment name**: e.g. gpt-4o-mini (remember this)
6. Click **Create**

## Step 4: Get API Key and Endpoint

1. Azure Portal → your **Azure OpenAI** resource
2. Left menu → **Keys and Endpoint**
3. Copy:
   - **Endpoint** → LLM_BASE_URL
   - **Key 1** → LLM_API_KEY
4. **Deployment name** (from Step 3) → LLM_MODEL

## Step 5: Configure Project

Create or edit `backend/.env`:

```env
LLM_EXPLANATION_ENABLED=true
LLM_API_KEY=<paste-your-key>
LLM_BASE_URL=https://<your-resource>.openai.azure.com/openai/deployments/<deployment-name>
LLM_AZURE_API_VERSION=2024-12-01-preview
```

## Step 6: Restart Backend

After editing `.env`:

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## FAQ

**Q: No Azure OpenAI permission?**  
A: Contact IT or professor to request access.

**Q: Free quota exhausted?**  
A: Use local Ollama: `LLM_BASE_URL=http://localhost:11434/v1`, no API key.

**Q: Commit .env to git?**  
A: **No.** `.env` is in `.gitignore`. Each person maintains their own config locally.
