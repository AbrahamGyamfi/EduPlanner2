# Getting a Free Hugging Face API Key

Follow these steps to get your free Hugging Face API key:

1. Go to [Hugging Face](https://huggingface.co/) and create a free account

2. After signing in, go to your profile by clicking on your avatar in the top-right corner, then select "Settings"

3. In the left sidebar, click on "Access Tokens"

4. Click "New Token"

5. Give your token a name (e.g., "EduPlanner") and select "Read" role

6. Click "Generate Token"

7. Copy the token and paste it in your `.env` file as the value for `HUGGINGFACE_API_KEY`

## Key Features of the Free Hugging Face API:

- Free to use (with rate limits)
- No credit card required
- Access to thousands of open-source AI models
- Supports text generation, summarization, and more

## Rate Limits:

The free tier of Hugging Face's Inference API has the following limitations:

- Limited requests per minute
- May experience slower inference times compared to paid APIs
- Some larger models may have restrictions

For educational projects like EduPlanner, these limitations are usually acceptable. If you need more capacity in the future, consider upgrading to their paid plans.
