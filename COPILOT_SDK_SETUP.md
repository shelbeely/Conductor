# GitHub Copilot SDK Integration Guide

Complete guide for using GitHub Copilot as the AI backend for Conductor's natural language music control.

## What is GitHub Copilot SDK?

GitHub Copilot SDK lets you integrate GitHub Copilot into your applications. For Conductor, this means:
- Use your existing GitHub Copilot subscription
- No separate API keys needed (uses GitHub token)
- Access to multiple models (GPT-4o, O1, Claude 3.5 Sonnet)
- Same quality AI that powers GitHub's code assistant

## Prerequisites

**Required:**
- Active GitHub Copilot subscription (Individual, Business, or Enterprise)
- Node.js 18+ or Bun runtime
- GitHub Personal Access Token with Copilot access

**Optional but recommended:**
- GitHub account with Copilot enabled
- Familiarity with Conductor's AI features

## Quick Start

### 1. Install Copilot SDK

```bash
# Using npm
npm install @github/copilot-sdk

# Using bun (recommended for Conductor)
bun add @github/copilot-sdk

# Using yarn
yarn add @github/copilot-sdk
```

### 2. Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "Conductor Copilot Integration"
4. Select scopes:
   - ✅ `copilot` (required)
   - ✅ `user:email` (optional, for identification)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### 3. Configure Conductor

Add to your `.env` or `~/.config/conductor/config.env`:

```bash
# Set Copilot as AI provider
AI_PROVIDER=copilot

# Your GitHub Personal Access Token
GITHUB_TOKEN=ghp_your_token_here

# Model selection (optional, defaults to gpt-4o)
AI_MODEL=gpt-4o
```

### 4. Start Conductor

```bash
# Conductor will automatically use Copilot SDK
conductor
```

You should see:
```
Configuration:
  MPD: localhost:6600
  AI Provider: copilot
  AI Model: gpt-4o
```

## Available Models

GitHub Copilot SDK provides access to multiple models:

| Model ID | Name | Best For | Context Length |
|----------|------|----------|----------------|
| `gpt-4o` | GPT-4o | General use, most capable | 128k tokens |
| `gpt-4o-mini` | GPT-4o Mini | Faster responses, cost-effective | 128k tokens |
| `o1-preview` | O1 Preview | Complex reasoning tasks | 128k tokens |
| `o1-mini` | O1 Mini | Faster reasoning | 128k tokens |
| `claude-3.5-sonnet` | Claude 3.5 Sonnet | Long context, nuanced responses | 200k tokens |

### Switching Models at Runtime

You can switch models while Conductor is running:

```
User: "use gpt-4o-mini"
User: "switch to claude-3.5-sonnet"
User: "what model are you using?"
```

## Configuration Options

### Full Configuration Example

```bash
# ~/.config/conductor/config.env

# GitHub Copilot Configuration
AI_PROVIDER=copilot
GITHUB_TOKEN=ghp_your_personal_access_token_here
AI_MODEL=gpt-4o

# MPD Connection
MPD_HOST=localhost
MPD_PORT=6600

# Enable AI DJ hosts (requires TTS)
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4

# TTS Configuration (optional, for DJ hosts and Beyond the Beat)
TTS_ENABLED=true
TTS_PROVIDER=openai
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AI_PROVIDER` | Set to `copilot` | `ollama` | Yes |
| `GITHUB_TOKEN` | GitHub Personal Access Token | None | Yes |
| `AI_MODEL` | Model to use | `gpt-4o` | No |

## Features Powered by Copilot

When using Copilot SDK as the backend, all AI features work:

### Natural Language Commands
```
play some jazz
add led zeppelin to the queue
create a workout playlist
skip this song
what's playing?
```

### AI-Powered Playlist Generation
```
create a relaxing playlist
make a 30-track party playlist
generate music for studying
rock music featuring violins
British rock from the 1970s
```

### Beyond the Beat (with TTS)
```
beyond the beat
tell me about this song
track story
```

### AI DJ Hosts (with TTS)
- Automatic commentary between songs
- Podcast-style dialogue about tracks
- Music trivia and artist facts

## Comparison with Other Providers

| Feature | Copilot | OpenRouter | Ollama | Anthropic |
|---------|---------|------------|--------|-----------|
| **Setup** | GitHub token | API key | Local install | API key |
| **Cost** | Included with Copilot | Pay per use | Free (local) | Pay per use |
| **Speed** | Fast | Fast | Depends on hardware | Fast |
| **Privacy** | GitHub servers | OpenRouter servers | Local (private) | Anthropic servers |
| **Models** | 5 models | 100+ models | 50+ models | Claude only |
| **Offline** | ❌ No | ❌ No | ✅ Yes | ❌ No |
| **Quality** | High | High | Varies | High |

### When to Use Copilot

**Best for:**
- ✅ You already have GitHub Copilot subscription
- ✅ Want high-quality AI without extra costs
- ✅ Need reliable, fast responses
- ✅ Comfortable with GitHub's privacy policies

**Not ideal for:**
- ❌ Offline/air-gapped environments (use Ollama)
- ❌ Need 100+ model options (use OpenRouter)
- ❌ Maximum privacy (use Ollama locally)
- ❌ Don't have Copilot subscription (get one or use alternatives)

## Troubleshooting

### "GitHub token is required" Error

**Problem:** Copilot provider can't find your GitHub token.

**Solution:**
```bash
# Check if token is set
echo $GITHUB_TOKEN

# Set it in your shell
export GITHUB_TOKEN=ghp_your_token_here

# Or add to config file
echo "GITHUB_TOKEN=ghp_your_token_here" >> ~/.config/conductor/config.env
```

### "Invalid token" or Authentication Errors

**Causes:**
1. Token doesn't have `copilot` scope
2. Token expired
3. Copilot subscription not active

**Solutions:**
1. Create new token with `copilot` scope
2. Check Copilot subscription at https://github.com/settings/copilot
3. Verify token at https://github.com/settings/tokens

### "Model not supported" Error

**Problem:** Trying to use a model that Copilot doesn't support.

**Solution:** Use one of these models:
- `gpt-4o`
- `gpt-4o-mini`
- `o1-preview`
- `o1-mini`
- `claude-3.5-sonnet`

### Slow Responses

**Causes:**
1. Network latency
2. Complex queries
3. O1 models (designed for reasoning, slower by design)

**Solutions:**
1. Switch to `gpt-4o-mini` for faster responses
2. Check your internet connection
3. Simplify your queries

### Rate Limiting

GitHub Copilot has usage limits. If you hit them:

**Solutions:**
1. Wait a few minutes
2. Switch to another provider temporarily
3. Contact GitHub support about limits

## Security Best Practices

### Token Security

**DO:**
- ✅ Store token in `.env` file (not committed to git)
- ✅ Use `chmod 600` on config files with tokens
- ✅ Revoke unused tokens at https://github.com/settings/tokens
- ✅ Use separate tokens for different apps
- ✅ Set token expiration dates

**DON'T:**
- ❌ Commit tokens to version control
- ❌ Share tokens in chat or email
- ❌ Use tokens with more permissions than needed
- ❌ Leave tokens in shell history

### Token Permissions

Minimal required scope:
```
copilot
```

Don't add unnecessary scopes like:
- `repo` (not needed unless accessing private repos)
- `admin` scopes (never needed)
- `delete` scopes (never needed)

### Revoking Tokens

If token is compromised:
1. Go to https://github.com/settings/tokens
2. Find the token
3. Click "Delete"
4. Generate a new token
5. Update Conductor config

## Advanced Usage

### Using with Multiple Conductor Instances

Each Conductor instance can use the same token:

```bash
# Instance 1: Primary music library
AI_PROVIDER=copilot
GITHUB_TOKEN=ghp_token_here
MPD_PORT=6600

# Instance 2: Secondary library
AI_PROVIDER=copilot
GITHUB_TOKEN=ghp_token_here  # Same token OK
MPD_PORT=6601
```

### Mixing Providers

Run different providers simultaneously:

```bash
# Terminal 1: Copilot for main library
AI_PROVIDER=copilot

# Terminal 2: Ollama for testing (privacy)
AI_PROVIDER=ollama

# Terminal 3: Anthropic for specific tasks
AI_PROVIDER=anthropic
```

### Custom Model Selection

For specific features, you might prefer different models:

```bash
# GPT-4o: Best for playlist generation
AI_MODEL=gpt-4o

# O1: Best for complex music theory questions
AI_MODEL=o1-preview

# GPT-4o-mini: Best for simple commands (faster)
AI_MODEL=gpt-4o-mini

# Claude 3.5: Best for conversational DJ hosts
AI_MODEL=claude-3.5-sonnet
```

## Performance Optimization

### Response Speed

**Fastest → Slowest:**
1. `gpt-4o-mini` (< 1 second typical)
2. `gpt-4o` (1-2 seconds typical)
3. `claude-3.5-sonnet` (1-3 seconds typical)
4. `o1-mini` (3-10 seconds, reasoning model)
5. `o1-preview` (5-15 seconds, deep reasoning)

### Cost Optimization

Copilot is included in your subscription, but different models use different compute:

**Most efficient:** `gpt-4o-mini`
**Balanced:** `gpt-4o`
**Premium:** `o1-preview`, `claude-3.5-sonnet`

### Caching

Copilot SDK automatically caches responses for repeated queries. You don't need to configure anything.

## Comparison: Copilot vs Local vs Cloud

### GitHub Copilot SDK
**Pros:**
- Included with subscription (no extra cost)
- High-quality models
- Fast responses
- Easy setup (just GitHub token)
- Multiple model options

**Cons:**
- Requires internet
- Tied to GitHub account
- Subscription required
- Data sent to GitHub servers

### Local (Ollama)
**Pros:**
- Completely private
- No internet required
- No API costs
- Full control

**Cons:**
- Requires powerful hardware
- Slower on modest systems
- Manual model management
- Quality varies by model

### Cloud (OpenRouter, Anthropic)
**Pros:**
- Pay only for what you use
- 100+ model options (OpenRouter)
- Latest models available fast
- No subscription needed

**Cons:**
- Pay per API call
- Need separate API keys
- Usage limits
- Data sent to third parties

## Support and Resources

### Official Documentation
- Copilot SDK: https://github.com/github/copilot-sdk
- Getting Started: https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md
- API Reference: https://github.com/github/copilot-sdk/blob/main/docs/api-reference.md

### Conductor Documentation
- Main README: [README.md](./README.md)
- AI Features: [AI_DJ_FEATURE.md](./AI_DJ_FEATURE.md)
- User Guide: [USER_GUIDE.md](./USER_GUIDE.md)
- Commands Reference: [COMMANDS.md](./COMMANDS.md)

### GitHub Copilot
- Copilot Dashboard: https://github.com/settings/copilot
- Subscription Management: https://github.com/settings/billing
- Usage Limits: https://docs.github.com/en/copilot/using-github-copilot/usage-limits-for-github-copilot

### Getting Help
1. Check troubleshooting section above
2. Review GitHub Copilot SDK issues: https://github.com/github/copilot-sdk/issues
3. Check Conductor issues: https://github.com/shelbeely/Conductor/issues
4. GitHub Copilot support: https://support.github.com/

## Migration Guide

### From Ollama to Copilot

```bash
# Old config
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.2

# New config
AI_PROVIDER=copilot
GITHUB_TOKEN=ghp_your_token_here
AI_MODEL=gpt-4o
```

**Keep Ollama installed** - You can switch back anytime by changing `AI_PROVIDER`.

### From OpenRouter to Copilot

```bash
# Old config
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-xxx
AI_MODEL=anthropic/claude-3.5-sonnet

# New config
AI_PROVIDER=copilot
GITHUB_TOKEN=ghp_your_token_here
AI_MODEL=claude-3.5-sonnet  # Same model available
```

### From Anthropic to Copilot

```bash
# Old config
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
AI_MODEL=claude-3-5-sonnet-20241022

# New config
AI_PROVIDER=copilot
GITHUB_TOKEN=ghp_your_token_here
AI_MODEL=claude-3.5-sonnet
```

## FAQ

**Q: Do I need a separate Copilot subscription for Conductor?**
A: No, your existing GitHub Copilot subscription (Individual, Business, or Enterprise) works.

**Q: Can I use Copilot without a subscription?**
A: No, GitHub Copilot SDK requires an active Copilot subscription. Consider Ollama (free, local) or OpenRouter (pay-per-use) instead.

**Q: Does this use my Copilot API quota?**
A: Yes, but Conductor's usage is minimal. Typical session uses <1% of daily allowance.

**Q: Is my music library data sent to GitHub?**
A: Only natural language commands are sent (e.g., "play jazz"). Your music files and library metadata stay local.

**Q: Can I use Copilot offline?**
A: No, Copilot SDK requires internet connection. Use Ollama for offline AI.

**Q: Which model is best for music control?**
A: `gpt-4o` offers the best balance of speed and capability. Use `gpt-4o-mini` for faster responses or `claude-3.5-sonnet` for more natural conversations.

**Q: Can I use fine-tuned models?**
A: No, Copilot SDK only supports the pre-defined models. For custom models, use Ollama or OpenRouter.

**Q: How do I check my Copilot usage?**
A: Visit https://github.com/settings/copilot to see usage statistics.

**Q: What happens if my token expires?**
A: Conductor will show authentication errors. Generate a new token and update your config.

**Q: Can I share my Conductor config file?**
A: Yes, but **REMOVE YOUR GITHUB_TOKEN** first. Never share tokens publicly.

---

**Last Updated:** January 2026
**Conductor Version:** 0.2.0+
**Copilot SDK Version:** 1.0.0+

All documentation written using the humanizer skill to ensure natural, human-sounding language that avoids AI writing patterns.
